const cron = require("node-cron");
const { runGoogleLeadEngine } = require("./googleLeads");

// every 6 hours (DON'T spam Google)
cron.schedule("0 */6 * * *", async () => {
  console.log("Running Google Maps Lead Engine...");
  await runGoogleLeadEngine();
});

await supabase.from("leads").insert([lead]);

// send SMS instantly
await client.messages.create({
  body: `New Roofing Lead:\n${lead.name}\n${lead.phone}\n${lead.location}`,
  from: process.env.TWILIO_NUMBER,
  to: process.env.RECEIVER_NUMBER
});

const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const cron = require("node-cron");
const { scrapeLeads } = require("./scraper");

// run every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  console.log("Running lead scraper...");
  await scrapeLeads();
});

const express = require("express");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabase (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("RoofFlow AI API is running 🚀");
});

// =========================
// CREATE STRIPE CHECKOUT
// =========================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RoofFlow AI - Roofing Pipeline System",
            },
            unit_amount: 49700,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/cancel",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =========================
// STRIPE WEBHOOK (RAW BODY REQUIRED)
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
      console.error("Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // =========================
    // PAYMENT SUCCESS
    // =========================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email;

      console.log("Payment success:", email);

      if (email) {
        // Check if user exists
        const { data: existing } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (existing) {
          // update user
          await supabase
            .from("users")
            .update({
              status: "active",
              plan: "growth",
              updated_at: new Date().toISOString(),
            })
            .eq("email", email);
        } else {
          // insert new user
          await supabase.from("users").insert([
            {
              email,
              stripe_session_id: session.id,
              status: "active",
              plan: "growth",
              created_at: new Date().toISOString(),
            },
          ]);
        }
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
  console.log(`Server running on port ${PORT} 🚀`);
});
