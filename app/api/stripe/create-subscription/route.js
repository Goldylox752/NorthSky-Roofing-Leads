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
// 🔐 DISTRIBUTED IDEMPOTENCY KEY (IMPROVED)
// ===============================
function buildLockId(email, plan) {
  const hour = Math.floor(Date.now() / (1000 * 60 * 60));
  const day = Math.floor(hour / 24);

  // prevents abuse + allows retry recovery
  return `checkout:${email}:${plan}:${day}`;
}

// ===============================
// 🧠 ATOMIC LOCK (RACE SAFE + REPLAY SAFE)
// ===============================
async function acquireLock(lockId, email) {
  const { error } = await supabase.from("checkout_locks").insert({
    id: lockId,
    email,
    created_at: new Date().toISOString(),
  });

  return !error;
}

// ===============================
// 🧹 SAFE CLEANUP (NON-BLOCKING)
// ===============================
async function cleanupOldLocks() {
  await supabase
    .from("checkout_locks")
    .delete()
    .lt(
      "created_at",
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    );
}

// ===============================
// 🛡️ BASIC ABUSE GUARD (LIGHTWEIGHT BOT FILTER)
// ===============================
async function abuseCheck(email) {
  const { data } = await supabase
    .from("checkout_locks")
    .select("id")
    .eq("email", email)
    .gte(
      "created_at",
      new Date(Date.now() - 1000 * 60 * 10).toISOString()
    );

  // too many attempts in 10 min = blocked
  return (data?.length || 0) < 5;
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
    // 🛡️ ABUSE PROTECTION LAYER
    // ===============================
    const allowed = await abuseCheck(email);

    if (!allowed) {
      return Response.json(
        { error: "Too many attempts. Try later." },
        { status: 429 }
      );
    }

    // ===============================
    // 🔐 IDEMPOTENCY LOCK
    // ===============================
    const lockId = buildLockId(email, plan);

    const locked = await acquireLock(lockId, email);

    if (!locked) {
      return Response.json(
        { error: "Duplicate checkout blocked" },
        { status: 409 }
      );
    }

    // ===============================
    // 💳 STRIPE SESSION CREATION
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
      // 🔗 STRIPE WEBHOOK CORRELATION
      // ===============================
      metadata: {
        plan,
        email,
        lock_id: lockId,
        source: "roofflow_checkout_v3",
      },
    });

    // ===============================
    // 📊 AUDIT LOG (NON-CRITICAL)
    // ===============================
    await supabase.from("events").insert({
      type: "checkout.created",
      email,
      plan,
      stripe_session_id: session.id,
      lock_id: lockId,
    });

    // ===============================
    // BACKGROUND MAINTENANCE (NON-BLOCKING)
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