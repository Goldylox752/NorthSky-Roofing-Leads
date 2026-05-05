import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  {
    apiVersion: "2024-06-20",
  }
);

const PLANS = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

export async function POST(req) {
  try {
    const { plan, email } = await req.json();

    const amount = PLANS[plan];

    if (!amount) {
      return Response.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,

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

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json(
      { error: "Stripe error" },
      { status: 500 }
    );
  }
}