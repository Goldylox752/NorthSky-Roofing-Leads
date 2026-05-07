const router = require("express").Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

/* ===============================
   ENV CHECK
=============================== */
const required = [
  "STRIPE_SECRET_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FRONTEND_URL",
];

for (const k of required) {
  if (!process.env[k]) {
    throw new Error(`Missing ENV: ${k}`);
  }
}

/* ===============================
   INIT
=============================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   PRICING
=============================== */
const PLANS = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

/* ===============================
   HELPERS
=============================== */
const normalizeEmail = (e = "") => e.trim().toLowerCase();

const hash = (v) =>
  crypto.createHash("sha256").update(v).digest("hex");

const key = (email, plan) => hash(`${email}:${plan}`);

/* ===============================
   RATE LIMIT
=============================== */
async function rateLimit(email) {
  const since = new Date(Date.now() - 5 * 60 * 1000);

  const { count, error } = await supabase
    .from("checkout_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since.toISOString());

  if (error) return { allowed: true };

  const c = count || 0;

  if (c >= 12) return { allowed: false, reason: "blocked" };
  if (c >= 6) return { allowed: false, reason: "cooldown" };

  return { allowed: true };
}

/* ===============================
   LOCK (prevent duplicates)
=============================== */
async function acquireLock(id, email, plan) {
  const expires = new Date(Date.now() + 25 * 60 * 1000);

  const { error } = await supabase
    .from("checkout_locks")
    .upsert(
      {
        id,
        email,
        plan,
        status: "active",
        expires_at: expires.toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) return { allowed: false };

  return { allowed: true };
}

/* ===============================
   ROUTE
=============================== */
router.post("/create", async (req, res) => {
  try {
    const { plan, email } = req.body;

    const cleanEmail = normalizeEmail(email);
    const amount = PLANS[plan];

    if (!plan || !cleanEmail) {
      return res.status(400).json({ error: "Missing input" });
    }

    if (!amount) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    /* =======================
       RATE LIMIT
    ======================= */
    const rl = await rateLimit(cleanEmail);

    if (!rl.allowed) {
      return res.status(429).json({ error: rl.reason });
    }

    /* =======================
       IDEMPOTENCY KEY
    ======================= */
    const checkoutKey = key(cleanEmail, plan);

    /* =======================
       LOCK
    ======================= */
    const lock = await acquireLock(checkoutKey, cleanEmail, plan);

    if (!lock.allowed) {
      return res.status(409).json({ error: "checkout_locked" });
    }

    /* =======================
       STRIPE SESSION
    ======================= */
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: cleanEmail,

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
          key: checkoutKey,
        },
      },
      {
        idempotencyKey: checkoutKey,
      }
    );

    /* =======================
       NON-BLOCKING LOG
    ======================= */
    supabase.from("checkout_attempts").insert({
      email: cleanEmail,
      plan,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return res.json({
      url: session.url,
      plan,
      amount,
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "checkout_failed" });
  }
});

module.exports = router;