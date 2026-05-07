const stripe = require("../lib/stripe");

const PRICE_MAP = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

async function createCheckoutSession({ email, leadId, plan = "starter" }) {
  const amount = PRICE_MAP[plan];

  if (!amount) throw new Error("Invalid plan");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Flow OS - ${plan}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],

    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,

    metadata: {
      email,
      leadId,
      plan,
    },
  });

  return session;
}

module.exports = {
  createCheckoutSession,
};