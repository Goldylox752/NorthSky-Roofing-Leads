import { stripe } from "../lib/stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { email, plan = "starter" } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email required"
      });
    }

    // Optional: dynamic pricing by plan
    const pricing = {
      starter: 49700,
      growth: 99700,
      elite: 149700
    };

    const amount = pricing[plan] || pricing.starter;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: `NorthSky AI Roofing Leads (${plan})`
            },

            unit_amount: amount,

            recurring: {
              interval: "month"
            }
          },

          quantity: 1
        }
      ],

      metadata: {
        email,
        plan
      },

      success_url:
        `https://northskyflowai.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `https://northskyflowai.vercel.app/cancel`
    });

    return res.status(200).json({
      id: session.id,
      url: session.url
    });

  } catch (err) {
    console.error("Checkout Error:", err);

    return res.status(500).json({
      error: "Checkout failed"
    });
  }
}