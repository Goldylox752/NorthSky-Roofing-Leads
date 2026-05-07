const router = require("express").Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLANS = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

const normalizeEmail = (e = "") => e.trim().toLowerCase();

const hash = (v) =>
  crypto.createHash("sha256").update(v).digest("hex");

const key = (email, plan) => hash(`${email}:${plan}`);

async function rateLimit(email) {
  const since = new Date(Date.now() - 5 * 60 * 1000);

  const { count, error } = await supabase
    .from("checkout_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since.toISOString());

  if (error) return true;

  return (count || 0) < 12;
}

router.post("/checkout", async (req, res) => {
  try {
    const { plan, email } = req.body;

    const cleanEmail = normalizeEmail(email);
    const amount = PLANS[plan];

    if (!plan || !cleanEmail)
      return res.status(400).json({ error: "Missing input" });

    if (!amount)
      return res.status(400).json({ error: "Invalid plan" });

    const allowed = await rateLimit(cleanEmail);

    if (!allowed)
      return res.status(429).json({ error: "rate_limited" });

    const checkoutKey = key(cleanEmail, plan);

    const session = await stripe.checkout.sessions.create({
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
    });

    supabase.from("checkout_attempts").insert({
      email: cleanEmail,
      plan,
      created_at: new Date().toISOString(),
    });

    res.json({
      url: session.url,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "checkout_failed" });
  }
});

module.exports = router;