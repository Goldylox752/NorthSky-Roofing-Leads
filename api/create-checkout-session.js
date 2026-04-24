import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    // ✅ Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ✅ Ensure body exists
    const { plan, userId } = req.body || {};

    if (!plan) {
      return res.status(400).json({ error: "Missing plan" });
    }

    // ✅ Safe price lookup
    const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];

    if (!priceId) {
      return res.status(400).json({ error: "Invalid plan or missing price ID" });
    }

    if (!process.env.DOMAIN) {
      return res.status(500).json({ error: "Missing DOMAIN env var" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId || "unknown",
        plan,
      },
      success_url: `${process.env.DOMAIN}/dashboard?success=1`,
      cancel_url: `${process.env.DOMAIN}/pricing`,
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("🔥 STRIPE ERROR:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
}
