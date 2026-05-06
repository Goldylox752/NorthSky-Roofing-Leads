require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();

// ===============================
// HARD FAIL ENV (PRODUCTION SAFE)
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
    throw new Error(`Missing ENV: ${key}`);
  }
});

// ===============================
// INIT
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

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

  console.log(JSON.stringify({
    id: req.id,
    method: req.method,
    path: req.originalUrl,
    time: new Date().toISOString(),
  }));

  next();
});

// ===============================
// HEALTH
// ===============================
app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ===============================
// CREATE LEAD (IDEMPOTENT)
// ===============================
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "Email or phone required",
      });
    }

    const leadId = crypto.randomUUID();

    // ===============================
    // IDEMPOTENCY KEY (CRITICAL)
    // ===============================
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${email || ""}:${phone || ""}:${city || ""}`)
      .digest("hex");

    // CHECK DUPLICATE
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      return res.json({
        success: true,
        duplicate: true,
        lead: existing,
      });
    }

    // CREATE LEAD
    const { data, error } = await supabase
      .from("leads")
      .insert({
        id: leadId,
        name,
        email,
        phone,
        city,
        status: LEAD_STATUS.PENDING_PAYMENT,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
        request_id: req.id,
      })
      .select()
      .single();

    if (error) throw error;

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

// ===============================
// STRIPE CHECKOUT
// ===============================
app.post("/api/checkout", async (req, res) => {
  try {
    const { leadId, amount } = req.body;

    if (!leadId || typeof amount !== "number") {
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

// ===============================
// STRIPE WEBHOOK (RAW BODY REQUIRED)
// ===============================
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

      // IDEMPOTENCY CHECK
      const { data: existing } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("id", event.id)
        .maybeSingle();

      if (existing) {
        return res.json({ received: true, duplicate: true });
      }

      await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        created_at: new Date().toISOString(),
      });

      // PAYMENT SUCCESS
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
      console.error("❌ Webhook error:", err.message);
      return res.status(400).send("Webhook Error");
    }
  }
);

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
// START
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});