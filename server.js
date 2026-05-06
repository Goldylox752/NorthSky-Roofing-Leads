require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();

// ===============================
// ENV SAFETY (NON-FATAL)
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
    console.warn(`⚠️ Missing env var: ${key}`);
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
// REQUEST ID + LOGGING
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
// WEBHOOK MUST BE FIRST (RAW BODY)
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
      console.error("❌ Stripe signature error:", err.message);
      return res.status(400).send("Webhook Error");
    }

    try {
      // ===============================
      // IDEMPOTENCY GUARD (IMPORTANT)
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
      // EVENT HANDLING
      // ===============================
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

      return res.json({ received: true });

    } catch (err) {
      console.error("❌ Webhook handler error:", err);

      return res.status(500).json({
        error: "Webhook failed",
      });
    }
  }
);

// ===============================
// NORMAL MIDDLEWARE
// ===============================
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ===============================
// ROOT
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 API is live");
});

// ===============================
// HEALTH
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
      return res.status(400).json({
        success: false,
        error,
        requestId: req.id,
      });
    }

    const { name, email, phone, city } = req.body;

    const { data, error: dbError } = await supabase
      .from("leads")
      .insert({
        id: crypto.randomUUID(),
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

      metadata: {
        leadId,
      },
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
// 404
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ===============================
// START
// ===============================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});