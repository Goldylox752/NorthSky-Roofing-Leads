const crypto = require("crypto");

/* ===============================
   STRIPE INIT (SAFE IMPORT)
=============================== */
const stripe = require("../lib/stripe");

if (!stripe) {
  throw new Error("Stripe instance missing in ../lib/stripe");
}

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
async function createCheckoutSession({
  email,
  leadId,
  plan = "starter",
  amount,
}) {
  try {
    /* ===============================
       VALIDATION
    =============================== */
    if (!email) throw new Error("Missing email");
    if (!amount || isNaN(amount)) throw new Error("Invalid amount");

    if (!process.env.FRONTEND_URL) {
      throw new Error("Missing FRONTEND_URL");
    }

    /* ===============================
       CONVERT TO CENTS (STRIPE REQUIREMENT)
    =============================== */
    const unitAmount = Math.round(Number(amount) * 100);

    /* ===============================
       IDEMPOTENCY KEY (SAFE DEDUPE)
    =============================== */
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${email}:${leadId}:${plan}:${unitAmount}`)
      .digest("hex");

    /* ===============================
       CREATE STRIPE SESSION
    =============================== */
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: email,

        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Flow OS - ${plan.toUpperCase()}`,
                description: "AI-powered lead automation system",
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],

        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,

        metadata: {
          email,
          plan,
          leadId: leadId || null,
        },
      },
      {
        idempotencyKey,
      }
    );

    return {
      url: session.url,
      id: session.id,
    };
  } catch (err) {
    console.error("❌ Stripe Checkout Error:", {
      message: err.message,
      email,
      leadId,
      plan,
      amount,
    });

    throw new Error("Failed to create checkout session");
  }
}

module.exports = {
  createCheckoutSession,
};