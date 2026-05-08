const crypto = require("crypto");
const stripe = require("../lib/stripe");

/* ===============================
   VALIDATE STRIPE INSTANCE
=============================== */
if (!stripe || typeof stripe.checkout?.sessions?.create !== "function") {
  throw new Error("Invalid Stripe instance in ../lib/stripe");
}

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
async function createCheckoutSession(params) {
  const {
    email,
    leadId,
    plan = "starter",
    amount,
  } = params || {};

  try {
    /* ===============================
       VALIDATION
    =============================== */
    if (!email) throw new Error("Missing email");
    if (!amount || isNaN(amount)) throw new Error("Invalid amount");
    if (!process.env.FRONTEND_URL) throw new Error("Missing FRONTEND_URL");

    /* ===============================
       NORMALIZE AMOUNT SAFELY
       (prevents double-cents bug)
    =============================== */
    const numericAmount = Number(amount);
    const unitAmount =
      numericAmount < 100 ? Math.round(numericAmount * 100) : Math.round(numericAmount);

    /* ===============================
       IDEMPOTENCY KEY
    =============================== */
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${email}:${leadId}:${plan}:${unitAmount}`)
      .digest("hex");

    /* ===============================
       CREATE SESSION
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
          leadId: leadId || "",
        },
      },
      {
        idempotencyKey,
      }
    );

    if (!session?.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return {
      url: session.url,
      id: session.id,
    };

  } catch (err) {
    const safeLog = {
      message: err.message,
      email,
      leadId,
      plan,
      amount,
    };

    console.error("❌ Stripe Checkout Error:", safeLog);

    throw new Error("Checkout session creation failed");
  }
}

module.exports = {
  createCheckoutSession,
};