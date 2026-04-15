require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const { runGoogleLeadEngine } = require("./googleLeads");

// =========================
// INIT
// =========================
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

// =========================
// MIDDLEWARE
// =========================
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
            recurring: { interval: "month" },
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
    res.status(500).json({ error: err.message });
  }
});

// =========================
// STRIPE WEBHOOK
// =========================
app.post(
  "/api/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(err.message);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.metadata?.email;

      if (!email) return res.json({ received: true });

      const { data: existing } = await supabase
        .from("tenants")
        .select("*")
        .eq("email", email)
        .single();

      if (existing) {
        await supabase
          .from("tenants")
          .update({ status: "active" })
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
  }
);

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SaaS Server running on port ${PORT}`);
});