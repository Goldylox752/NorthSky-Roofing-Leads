import Stripe from "stripe";

export const runtime = "nodejs";

// ===============================
// STRIPE INIT
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// ===============================
// CREATE CHECKOUT SESSION
// SaaS + Marketplace + City Ownership Layer
// ===============================
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      priceId,
      mode = "payment", // payment | subscription
      email,
      city,
      contractorId,
      planTier,
      metadata = {},
    } = body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!priceId) {
      return Response.json(
        { success: false, error: "Missing priceId" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_URL) {
      return Response.json(
        { success: false, error: "Missing NEXT_PUBLIC_URL" },
        { status: 500 }
      );
    }

    // ===============================
    // STRIPE SESSION BUILD
    // ===============================
    const session = await stripe.checkout.sessions.create({
      mode,

      payment_method_types: ["card"],

      customer_email: email || undefined,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      // ===============================
      // REDIRECT FLOW
      // ===============================
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,

      // ===============================
      // MARKETPLACE / ROUTING CONTEXT
      // ===============================
      metadata: {
        source: "roofflow",
        system: "lead_marketplace",

        // 🏙 city ownership layer
        city: city || "unknown",

        // 🧑‍💼 contractor assignment (future-proof)
        contractorId: contractorId || null,

        // 💎 tier system (basic | priority | exclusive)
        planTier: planTier || "basic",

        // 💰 billing mode
        mode,

        // original metadata passthrough
        ...metadata,
      },
    });

    return Response.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });

  } catch (err) {
    console.error("🔥 Stripe checkout error:", err);

    return Response.json(
      {
        success: false,
        error: "Checkout session failed",
      },
      { status: 500 }
    );
  }
}