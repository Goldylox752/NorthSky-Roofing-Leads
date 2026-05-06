require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// ===============================
// ENV VALIDATION
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
    throw new Error(`Missing env var: ${key}`);
  }
});

// ===============================
// INIT
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// LOGGING
// ===============================
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ===============================
// ✅ STRIPE WEBHOOK FIRST (CRITICAL)
// ===============================
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];
      if (!sig) {
        return res.status(400).send("Missing signature");
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature error:", err.message);
      return res.status(400).send("Webhook Error");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const leadId = session.metadata?.leadId;

        if (leadId) {
          const { error } = await supabase
            .from("leads")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", leadId);

          if (error) throw error;
        }
      }

      return res.json({ received: true });

    } catch (err) {
      console.error("❌ Webhook handler error:", err);
      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);

// ===============================
// MIDDLEWARE (AFTER WEBHOOK)
// ===============================
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ===============================
// ROOT (FIXES YOUR ORIGINAL ERROR)
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 API is live");
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ===============================
// VALIDATION
// ===============================
function validateLead(body) {
  if (!body.email && !body.phone) {
    return "Email or phone required";
  }
  return null;
}

// ===============================
// CREATE LEAD
// ===============================
app.post("/api/leads", async (req, res) => {
  try {
    const error = validateLead(req.body);

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const { name, email, phone, city } = req.body;

    const { data, error: dbError } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        phone,
        city,
        status: "new",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) throw dbError;

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
            product_data: { name: "Lead Purchase" },
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
    console.error("❌ Stripe error:", err);

    return res.status(500).json({
      success: false,
      error: "Stripe checkout failed",
    });
  }
});

// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  console.warn("❌ Route not found:", req.method, req.url);

  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.url,
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});