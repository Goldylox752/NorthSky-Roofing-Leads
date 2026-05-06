require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();

// ===============================
// CRASH PROTECTION (IMPORTANT)
// ===============================
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});

// ===============================
// ENV SAFETY CHECK (PREVENT BOOT CRASH)
// ===============================
const REQUIRED_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FRONTEND_URL",
];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV: ${key}`);
  }
});

// ===============================
// INIT (SAFE)
// ===============================
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

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ===============================
// LEAD STATES
// ===============================
const LEAD_STATUS = {
  NEW: "new",
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  DELIVERED: "delivered",
  COMPLETED: "completed",
};

// ===============================
// REQUEST LOGGING
// ===============================
app.use((req, res, next) => {
  req.id = crypto.randomUUID();

  console.log(
    JSON.stringify({
      id: req.id,
      method: req.method,
      path: req.originalUrl,
      time: new Date().toISOString(),
    })
  );

  next();
});

// ===============================
// ROOT + HEALTH (RENDER SAFE)
// ===============================
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// ===============================
// STRIPE WEBHOOK (RAW BODY)
// ===============================
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).send("Stripe not initialized");
      }

      const sig = req.headers["stripe-signature"];

      let event;

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // ===============================
      // IDEMPOTENCY CHECK
      // ===============================
      const eventId = event.id;

      const { data: existing } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("id", eventId)
        .maybeSingle();

      if (existing) {
        return res.json({ received: true, duplicate: true });
      }

      await supabase.from("stripe_events").insert({
        id: eventId,
        type: event.type,
        created_at: new Date().toISOString(),
      });

      // ===============================
      // PAYMENT SUCCESS
      // ===============================
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const leadId = session.metadata?.leadId;

        if (leadId) {
          await supabase
            .from("leads")
            .update({
              status: LEAD_STATUS.PAID,
              paid_at: new Date().toISOString(),
            })
            .eq("id", leadId);
        }
      }

      return res.json({ received: true });

    } catch (err) {
      console.error("❌ Stripe webhook error:", err.message);
      return res.status(400).send("Webhook Error");
    }
  }
);

// ===============================
// CREATE LEAD
// ===============================
app.post("/api/leads", async (req, res) => {
  try {
    if (!supabase) throw new Error("Supabase not initialized");

    const { name, email, phone, city } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "Email or phone required",
      });
    }

    const leadId = crypto.randomUUID();

    const lead = {
      id: leadId,
      name,
      email,
      phone,
      city,
      status: LEAD_STATUS.PENDING_PAYMENT,
      created_at: new Date().toISOString(),
      request_id: req.id,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(lead)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      lead: data,
    });

  } catch (err) {
    console.error("❌ Lead error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ===============================
// STRIPE CHECKOUT
// ===============================
app.post("/api/checkout", async (req, res) => {
  try {
    if (!stripe) throw new Error("Stripe not initialized");

    const { leadId, amount } = req.body;

    if (!leadId || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing leadId or amount",
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
              name: "Qualified Lead",
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

    res.json({ success: true, url: session.url });

  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ success: false, error: "Checkout failed" });
  }
});

// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});