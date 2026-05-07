const Stripe = require("stripe");

/* ===============================
   ENV VALIDATION
=============================== */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

/* ===============================
   STRIPE CLIENT
=============================== */
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  {
    apiVersion: "2024-06-20",
  }
);

module.exports = stripe;