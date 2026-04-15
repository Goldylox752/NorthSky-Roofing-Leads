require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");

// =========================
// INIT
// =========================
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =========================
// MIDDLEWARE
// =========================
// IMPORTANT: Stripe webhook must use raw body BEFORE JSON middleware
app.post(
  "/api/stripe-webhook",
  bodyParser.raw({ type: "application/json" })
);

// JSON middleware for everything else
app.use(express.json());

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("RoofFlow AI SaaS Engine Running 🚀");
});

// =========================
// STRIPE CHECKOUT SESSION
// =========================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RoofFlow AI - Roofing Lead System",
            },
            unit_amount: 49700,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: { email },
      success_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/cancel",
    });

    res.json({ id: session.id });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// =========================
// STRIPE WEBHOOK
// =========================
app.post("/api/stripe-webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // =========================
    // HANDLE SUCCESSFUL PAYMENT
    // =========================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.metadata?.email;

      if (!email) {
        return res.json({ received: true, warning: "No email in metadata" });
      }

      // Check tenant
      const { data: existing, error: fetchError } = await supabase
        .from("tenants")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
      }

      if (existing) {
        await supabase
          .from("tenants")
          .update({
            status: "active",
            stripe_customer_id: session.customer,
          })
          .eq("email", email);
      } else {
        await supabase.from("tenants").insert([
          {
            email,
            stripe_customer_id: session.customer,
            plan: "growth",
            status: "active",
          },
        ]);
      }
    }

    res.json({ received: true });

  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SaaS Server running on port ${PORT}`);
});