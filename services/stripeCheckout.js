const stripe = require("../lib/stripe");
const crypto = require("crypto");

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
async function createCheckoutSession({
  email,
  leadId,
  plan,
  amount,
}) {
  if (!email || !plan || !amount) {
    throw new Error("Missing required checkout parameters");
  }

  /* ===============================
     IDEMPOTENCY KEY (PREVENT DUPLICATES)
  =============================== */
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(email + plan + String(amount))
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
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      /* ===============================
         CRITICAL REDIRECTS
      =============================== */
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,

      /* ===============================
         WEBHOOK LINKING DATA
      =============================== */
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

  return session;
}

module.exports = {
  createCheckoutSession,
};