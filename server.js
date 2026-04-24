import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ Stripe webhook needs RAW body (special handling)
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("✅ Webhook received:", event.type);

      // Handle events
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        console.log("💰 Payment success:", session.id);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Normal middleware AFTER webhook
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Checkout route
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { priceId } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/cancel"
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).send("Stripe error");
  }
});

// Start server
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
