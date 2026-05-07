const stripe = require("../lib/stripe");
require("dotenv").config();

/* ===============================
   CREATE STRIPE CHECKOUT SESSION
=============================== */
async function createCheckoutSession({ email, leadId, plan, amount }) {
  if (!email || !leadId || !plan) {
    throw new Error("Missing required checkout parameters");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `NorthSky Flow OS - ${plan}`,
              description: "Automated Lead-to-Payment System Access",
            },
            unit_amount: amount || 2900, // fallback safety
          },
          quantity: 1,
        },
      ],

      // 🔥 CRITICAL: ensures onboarding works
      success_url: `${process.env.FRONTEND_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,

      // 🔥 SOURCE OF TRUTH (used by webhook)
      metadata: {
        email,
        leadId,
        plan,
      },

      // improves Stripe customer tracking
      customer_email: email,
    });

    return session;

  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    throw err;
  }
}

module.exports = {
  createCheckoutSession,
};