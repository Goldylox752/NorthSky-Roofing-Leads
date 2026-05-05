import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLANS = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

// ===============================
// 🔐 IDEMPOTENCY KEY (SAFE + TIME-BUCKETED)
// ===============================
function buildLockId(email, plan) {
  // prevents permanent lock failures + reduces spam abuse
  const hourBucket = Math.floor(Date.now() / (1000 * 60 * 60));
  return `${email}:${plan}:${hourBucket}`;
}

// ===============================
// 🧠 ATOMIC LOCK (RACE SAFE)
// ===============================
async function acquireLock(lockId) {
  const { error } = await supabase.from("checkout_locks").insert({
    id: lockId,
    created_at: new Date().toISOString(),
  });

  return !error;
}

// ===============================
// 🧹 OPTIONAL: CLEANUP OLD LOCKS (prevents table bloat)
// ===============================
async function cleanupOldLocks() {
  await supabase
    .from("checkout_locks")
    .delete()
    .lt("created_at", new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString());
}

// ===============================
// ROUTE
// ===============================
export async function POST(req) {
  try {
    const { plan, email } = await req.json();

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
    // 🔐 IDEMPOTENCY LOCK (STRONGER)
    // ===============================
    const lockId = buildLockId(email, plan);

    const locked = await acquireLock(lockId);

    if (!locked) {
      return Response.json(
        { error: "Duplicate checkout blocked" },
        { status: 429 }
      );
    }

    // ===============================
    // CREATE STRIPE SESSION
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

      // ===============================
      // 🔗 WEBHOOK CORRELATION (CRITICAL)
      // ===============================
      metadata: {
        plan,
        email,
        lock_id: lockId,
        source: "roofflow_checkout_v2",
      },
    });

    // ===============================
    // AUDIT EVENT (NON-CRITICAL)
    // ===============================
    await supabase.from("events").insert({
      type: "checkout.created",
      email,
      plan,
      stripe_session_id: session.id,
      lock_id: lockId,
    });

    // ===============================
    // BACKGROUND CLEANUP (optional safe call)
    // ===============================
    cleanupOldLocks().catch(() => {});

    return Response.json({
      url: session.url,
    });

  } catch (err) {
    console.error("Stripe checkout error:", err);

    return Response.json(
      { error: "Stripe error" },
      { status: 500 }
    );
  }
}