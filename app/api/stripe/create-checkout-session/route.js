import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🧠 Plan mapping (single source of truth)
const PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  elite: process.env.STRIPE_ELITE_PRICE_ID,
};

export async function POST(req) {
  try {
    const { plan, email, phone } = await req.json();

    // 🚨 Validate plan exists
    const priceId = PRICES[plan];

    if (!priceId) {
      return Response.json(
        { error: "Invalid or unconfigured plan" },
        { status: 400 }
      );
    }

    // 🚨 Validate env misconfig (prevents silent Stripe failures)
    if (typeof priceId !== "string" || priceId.length < 10) {
      return Response.json(
        { error: "Stripe price ID missing or invalid" },
        { status: 500 }
      );
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

      customer_email: email || undefined,

      metadata: {
        plan,
        email: email || "",
        phone: phone || "",
      },

      success_url: `${process.env.BASE_URL}/success`,
      cancel_url: `${process.env.BASE_URL}/apply`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);

    return Response.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
