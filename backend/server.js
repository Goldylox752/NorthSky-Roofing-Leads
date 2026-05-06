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
   SECURITY (CORS SAFE MODE)
========================= */
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = [process.env.FRONTEND_URL];

      // allow server-to-server / curl / Stripe
      if (!origin) return cb(null, true);

      if (allowed.includes(origin)) return cb(null, true);

      console.warn("⚠️ CORS blocked:", origin);
      return cb(null, false);
    },
    credentials: true,
  })
);

/* =========================
   WEBHOOK (RAW BODY FIRST)
========================= */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        return res.status(400).send("Missing Stripe signature");
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // =========================
      // PAYMENT SUCCESS HANDLER
      // =========================
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const leadId = session?.metadata?.leadId;

        if (leadId) {
          const { error } = await supabase
            .from("leads")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", leadId);

          if (error) {
            console.error("❌ Supabase update error:", error);
          }
        }
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      return res.status(400).send("Webhook Error");
    }
  }
);

/* =========================
   JSON MIDDLEWARE
========================= */
app.use(express.json({ limit: "1mb" }));

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "roofflow-backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   CREATE LEAD
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

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return res.status(500).json({
        success: false,
        error: "Database error",
      });
    }

    return res.json({
      success: true,
      lead: data,
    });
  } catch (err) {
    console.error("❌ Lead error:", err);
    return res.status(500).json({
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
      metadata: { leadId },
    });

    return res.json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    return res.status(500).json({
      success: false,
      error: "Checkout failed",
    });
  }
});

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
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("🔥 Server crash:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});