require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();

/* ======================
   ENV CHECK (SAFE)
====================== */
const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FRONTEND_URL",
];

for (const key of required) {
  if (!process.env[key]) {
    console.error("Missing ENV:", key);
    process.exit(1);
  }
}

/* ======================
   INIT
====================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 0, // disables realtime instability
      },
    },
  }
);

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

/* ======================
   HEALTH CHECK
====================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ======================
   LEADS
====================== */
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from("leads")
      .insert({ id, name, email, phone, city })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, lead: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ======================
   STRIPE CHECKOUT
====================== */
app.post("/api/checkout", async (req, res) => {
  const { leadId, amount } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "RoofFlow Lead" },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    metadata: { leadId },
  });

  res.json({ url: session.url });
});

/* ======================
   START
====================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});