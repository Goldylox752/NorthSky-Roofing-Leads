import Stripe from "stripe";

// =====================
// STRIPE INIT (SAFE)
// =====================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// =====================
// CREATE CHECKOUT SESSION
// =====================
export async function POST(req) {
  try {
    const { priceId, mode = "payment", email, metadata = {} } =
      await req.json();

    // ---------------------
    // VALIDATION
    // ---------------------
    if (!priceId) {
      return Response.json(
        { error: "Missing priceId" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_URL) {
      return Response.json(
        { error: "Missing NEXT_PUBLIC_URL" },
        { status: 500 }
      );
    }

    // ---------------------
    // SESSION CREATE
    // ---------------------
    const session = await stripe.checkout.sessions.create({
      mode, // "payment" or "subscription"
      payment_method_types: ["card"],

      customer_email: email || undefined,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,

      metadata,
    });

    return Response.json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err.message);

    return Response.json(
      { error: "Checkout session failed" },
      { status: 500 }
    );
  }
}