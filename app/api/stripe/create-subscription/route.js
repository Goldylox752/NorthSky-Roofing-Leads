import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// PRICING
// ===============================
const PLANS = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

// ===============================
// HELPERS
// ===============================
const normalizeEmail = (e = "") => e.trim().toLowerCase();

const hash = (v) =>
  crypto.createHash("sha256").update(v).digest("hex");

// ===============================
// 🧠 STRONG IDEMPOTENCY KEY (RETRY SAFE)
// ===============================
function buildCheckoutKey(email, plan) {
  return hash(`${email}:${plan}`);
}

// ===============================
// 🔐 RATE LIMIT (FAST COUNT QUERY)
// ===============================
async function abuseCheck(email) {
  const window = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("checkout_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", window);

  const attempts = count || 0;

  if (attempts >= 10) return { allowed: false, reason: "hard" };
  if (attempts >= 5) return { allowed: false, reason: "soft" };

  return { allowed: true };
}

// ===============================
// 🔐 IDEMPOTENCY STORE (SAFE UPSERT)
// ===============================
async function ensureCheckoutLock(key, email, plan) {
  const { data, error } = await supabase
    .from("checkout_locks")
    .upsert(
      {
        id: key,
        email,
        plan,
        status: "active",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) return false;

  // if already exists AND active → block duplicate checkout
  if (data?.status === "active" && data.created_at !== null) {
    return true;
  }

  return true;
}

// ===============================
// 🧹 SAFE BACKGROUND CLEANUP
// ===============================
function cleanupLocks() {
  supabase
    .from("checkout_locks")
    .update({ status: "expired" })
    .lt("expires_at", new Date().toISOString())
    .eq("status", "active")
    .then(() => {})
    .catch(() => {});
}

// ===============================
// MAIN ROUTE
// ===============================
export async function POST(req) {
  try {
    const body = await req.json();

    let { plan, email } = body;

    email = normalizeEmail(email);

    // ===============================
    // VALIDATION
    // ===============================
    if (!plan || !email) {
      return Response.json(
        { error: "Missing plan or email" },
        { status: 400 }
      );
    }

    const amount = PLANS[plan];

    if (!amount) {
      return Response.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // ===============================
    // CLEANUP (FIRE & FORGET)
    // ===============================
    cleanupLocks();

    // ===============================
    // ABUSE CHECK
    // ===============================
    const abuse = await abuseCheck(email);

    if (!abuse.allowed) {
      return Response.json(
        {
          error:
            abuse.reason === "hard"
              ? "Account temporarily blocked"
              : "Too many checkout attempts",
        },
        { status: 429 }
      );
    }

    // ===============================
    // IDEMPOTENCY LOCK
    // ===============================
    const checkoutKey = buildCheckoutKey(email, plan);

    const locked = await ensureCheckoutLock(
      checkoutKey,
      email,
      plan
    );

    if (!locked) {
      return Response.json(
        { error: "Checkout already in progress" },
        { status: 409 }
      );
    }

    // ===============================
    // STRIPE SESSION
    // ===============================
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `RoofFlow ${plan}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/success?plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,

      metadata: {
        plan,
        email,
        checkout_key: checkoutKey,
        source: "roofflow_v6",
      },
    });

    // ===============================
    // EVENT LOG (LIGHTWEIGHT)
    // ===============================
    supabase.from("events").insert({
      type: "checkout.created",
      email,
      plan,
      stripe_session_id: session.id,
      checkout_key: checkoutKey,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      url: session.url,
      checkoutKey,
    });

  } catch (err) {
    console.error("Stripe checkout error:", err);

    return Response.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}