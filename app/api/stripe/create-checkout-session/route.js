import Stripe from "stripe";
import { scoreLead } from "@/lib/leadScore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { email, phone, answers = {} } = await req.json();

    // 🧠 LEAD SCORING (inside handler only)
    const leadScore = scoreLead({ email, phone, answers });

    // 🚨 BLOCK LOW QUALITY LEADS BEFORE STRIPE
    if (leadScore < 60) {
      return new Response(
        JSON.stringify({ error: "Not qualified" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 💳 CREATE STRIPE CHECKOUT SESSION
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,

      customer_email: email,

      // 📦 Used later in webhook (SMS + CRM + analytics)
      metadata: {
        email,
        phone,
        score: leadScore,
        source: "roofflow_apply",
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return new Response("Error creating checkout session", { status: 500 });
  }
}
