"use strict";

/* =========================
   SAFE ENV LOADING
========================= */
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (e) {
    console.warn("dotenv not installed (ok in production)");
  }
}

/* =========================
   IMPORTS
========================= */
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();

/* =========================
   BASIC HEALTH (NO DEPENDENCIES)
========================= */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   ENV CHECK (NON-FATAL)
   → DO NOT CRASH SERVER
========================= */
const requiredEnv = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FRONTEND_URL",
];

const missing = requiredEnv.filter((k) => !process.env[k]);

if (missing.length) {
  console.error("⚠️ Missing ENV vars:", missing);
}

/* =========================
   INIT CLIENTS (ONLY IF VALID)
========================= */
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

/* =========================
   WEBHOOK (RAW BODY)
========================= */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!stripe) return res.status(500).send("Stripe not configured");

      const sig = req.headers["stripe-signature"];
      if (!sig) return res.status(400).send("Missing signature");

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const leadId = session?.metadata?.leadId;

        if (leadId && supabase) {
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
      res.status(400).send("Webhook failed");
    }
  }
);

/* =========================
   JSON BODY
========================= */
app.use(express.json({ limit: "1mb" }));

/* =========================
   CREATE LEAD
========================= */
app.post("/api/leads", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

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

    res.json({ success: true, lead: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* =========================
   STRIPE CHECKOUT
========================= */
app.post("/api/checkout", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const { leadId, amount } = req.body;

    if (!leadId || !amount) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RoofFlow Lead",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: { leadId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

/* =========================
   404
========================= */
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);

  if (missing.length) {
    console.warn("⚠️ Missing env vars:", missing);
  }
});