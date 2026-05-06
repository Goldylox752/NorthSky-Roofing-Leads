"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();

/* =========================
   ENV VALIDATION
========================= */
const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FRONTEND_URL",
];

const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error("❌ Missing ENV:", missing);
  process.exit(1);
}

/* =========================
   INIT CLIENTS
========================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "roofflow-backend",
  });
});

/* =========================
   LEADS API
========================= */
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "Email or phone required",
      });
    }

    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from("leads")
      .insert({
        id,
        name,
        email,
        phone,
        city,
        status: "new",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      lead: data,
    });
  } catch (err) {
    console.error("Lead error:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/* =========================
   STRIPE CHECKOUT
========================= */
app.post("/api/checkout", async (req, res) => {
  try {
    const { leadId, amount } = req.body;

    if (!leadId || !amount) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RoofFlow AI Lead",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        leadId,
      },
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({
      success: false,
      error: "Checkout failed",
    });
  }
});

/* =========================
   STRIPE WEBHOOK
========================= */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const leadId = session.metadata?.leadId;

        if (leadId) {
          await supabase
            .from("leads")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", leadId);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err.message);
      res.status(400).send("Webhook Error");
    }
  }
);

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});