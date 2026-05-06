import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ===============================
// ENV VALIDATION
// ===============================
if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!process.env.FRONTEND_URL) throw new Error("Missing FRONTEND_URL");

// ===============================
// INIT
// ===============================
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

function buildCheckoutKey(email, plan) {
  return hash(`${email}:${plan}`);
}

// ===============================
// 🔐 RATE LIMIT
// ===============================
async function abuseCheck(email) {
  const window = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("checkout_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", window);

  if (error) {
    console.error("abuseCheck error:", error);
    return { allowed: true }; // fail open, don’t block legit users
  }

  if ((count || 0) >= 10) return { allowed: false, reason: "hard" };
  if ((count || 0) >= 5) return { allowed: false, reason: "soft" };

  return { allowed: true };
}

// ===============================
// 🔐 LOCK (FIXED)
// ===============================
async function ensureCheckoutLock(key, email, plan) {
  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("checkout_locks")
    .select("*")
    .eq("id", key)
    .maybeSingle();

  if (fetchError) throw fetchError;

  // 🔥 If active and NOT expired → block
  if (
    existing &&
    existing.status === "active" &&
    new Date(existing.expires_at) > new Date()
  ) {
    return { allowed: false };
  }

  // otherwise overwrite (expired or missing)
  const { error } = await supabase
    .from("checkout_locks")
    .upsert(
      {
        id: key,
        email,
        plan,
        status: "active",
        created_at: now,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) throw error;

  return { allowed: true };
}

// ===============================
// CLEANUP (NON-BLOCKING)
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

    cleanupLocks();

    // ===============================
    // RATE LIMIT
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
    // LOCK
    // ===============================
    const checkoutKey = buildCheckoutKey(email, plan);

    const lock = await ensureCheckoutLock(
      checkoutKey,
      email,
      plan
    );

    if (!lock.allowed) {
      return Response.json(
        { error: "Checkout already in progress" },
        { status: 409 }
      );
    }

    // ===============================
    // STRIPE SESSION (WITH IDEMPOTENCY)
    // ===============================
    const session = await stripe.checkout.sessions.create(
      {
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
        },
      },
      {
        idempotencyKey: checkoutKey, // 🔥 CRITICAL FIX
      }
    );

    // ===============================
    // LOG ATTEMPT (NON-BLOCKING)
    // ===============================
    supabase.from("checkout_attempts").insert({
      email,
      plan,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    supabase.from("events").insert({
      type: "checkout.created",
      email,
      plan,
      stripe_session_id: session.id,
      checkout_key: checkoutKey,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      url: session.url,
      checkoutKey,
    });

  } catch (err) {
    console.error("❌ Checkout error:", err);

    return Response.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}