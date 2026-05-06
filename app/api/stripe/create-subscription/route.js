import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ===============================
// ENV VALIDATION (FAIL FAST)
// ===============================
const required = [
  "STRIPE_SECRET_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FRONTEND_URL",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ENV: ${key}`);
  }
}

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
// PRICING (CENT-BASED SAFETY)
// ===============================
const PLANS = Object.freeze({
  starter: 9900,
  growth: 19900,
  elite: 49900,
});

// ===============================
// HELPERS
// ===============================
const normalizeEmail = (email = "") =>
  email.trim().toLowerCase();

const sha = (v) =>
  crypto.createHash("sha256").update(v).digest("hex");

const buildKey = (email, plan) =>
  sha(`${email}:${plan}`);

// ===============================
// 🚨 RATE LIMIT (HARD PROTECTION)
// ===============================
async function rateLimit(email) {
  const windowStart = new Date(Date.now() - 5 * 60 * 1000);

  const { count, error } = await supabase
    .from("checkout_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("rateLimit error:", error);
    return { allowed: true }; // fail open
  }

  if ((count || 0) >= 12) {
    return { allowed: false, reason: "blocked" };
  }

  if ((count || 0) >= 6) {
    return { allowed: false, reason: "cooldown" };
  }

  return { allowed: true };
}

// ===============================
// 🔐 CHECKOUT LOCK (RACE SAFE)
// ===============================
async function acquireLock(key, email, plan) {
  const now = new Date();

  const { data, error } = await supabase
    .from("checkout_locks")
    .select("*")
    .eq("id", key)
    .maybeSingle();

  if (error) throw error;

  // active lock still valid
  if (
    data?.status === "active" &&
    new Date(data.expires_at) > now
  ) {
    return { allowed: false };
  }

  // upsert lock
  const { error: upsertError } = await supabase
    .from("checkout_locks")
    .upsert(
      {
        id: key,
        email,
        plan,
        status: "active",
        created_at: now.toISOString(),
        expires_at: new Date(
          Date.now() + 25 * 60 * 1000
        ).toISOString(),
      },
      { onConflict: "id" }
    );

  if (upsertError) throw upsertError;

  return { allowed: true };
}

// ===============================
// 🧹 CLEANUP (NON-BLOCKING)
// ===============================
function expireOldLocks() {
  supabase
    .from("checkout_locks")
    .update({ status: "expired" })
    .lt("expires_at", new Date().toISOString())
    .eq("status", "active")
    .then(() => {})
    .catch(() => {});
}

// ===============================
// MAIN CHECKOUT ROUTE
// ===============================
export async function POST(req) {
  try {
    const { plan, email } = await req.json();

    const cleanEmail = normalizeEmail(email);

    // ===============================
    // VALIDATION
    // ===============================
    if (!plan || !cleanEmail) {
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

    expireOldLocks();

    // ===============================
    // RATE LIMIT
    // ===============================
    const limit = await rateLimit(cleanEmail);

    if (!limit.allowed) {
      return Response.json(
        {
          error:
            limit.reason === "blocked"
              ? "Too many attempts (blocked)"
              : "Too many attempts (cooldown)",
        },
        { status: 429 }
      );
    }

    // ===============================
    // IDEMPOTENCY KEY
    // ===============================
    const checkoutKey = buildKey(cleanEmail, plan);

    // ===============================
    // LOCK CHECK
    // ===============================
    const lock = await acquireLock(
      checkoutKey,
      cleanEmail,
      plan
    );

    if (!lock.allowed) {
      return Response.json(
        { error: "Checkout already in progress" },
        { status: 409 }
      );
    }

    // ===============================
    // STRIPE SESSION (SAFE + IDEMPOTENT)
    // ===============================
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: cleanEmail,

        payment_method_types: ["card"],

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
          email: cleanEmail,
          checkout_key: checkoutKey,
        },
      },
      {
        idempotencyKey: checkoutKey,
      }
    );

    // ===============================
    // NON-BLOCKING LOGGING
    // ===============================
    supabase.from("checkout_attempts").insert({
      email: cleanEmail,
      plan,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    supabase.from("events").insert({
      type: "checkout.created",
      email: cleanEmail,
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
      amount,
    });

  } catch (err) {
    console.error("❌ Checkout crash:", err);

    return Response.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}