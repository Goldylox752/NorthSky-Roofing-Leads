"use strict";

// =====================
// ENV BOOTSTRAP
// =====================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// =====================
// IMPORTS
// =====================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const twilio = require("twilio");
const Stripe = require("stripe");

// =====================
// SAFE FETCH
// =====================
const fetchFn =
  global.fetch ||
  ((...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args)));

// =====================
// APP INIT
// =====================
const app = express();

// =====================
// SECURITY MIDDLEWARE (IMPORTANT)
// =====================
app.use(helmet());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120, // prevents abuse
  })
);

app.use(express.json());

// =====================
// ENV VALIDATION (FAIL FAST)
// =====================
const {
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE,
  STRIPE_SECRET_KEY,
  FRONTEND_URL,
  OLLAMA_URL,
  PORT,
} = process.env;

if (!FRONTEND_URL) {
  console.warn("⚠️ FRONTEND_URL missing");
}

// =====================
// CLIENTS
// =====================
const twilioClient =
  TWILIO_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_SID, TWILIO_AUTH_TOKEN)
    : null;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

// =====================
// CORS (HARDENED)
// =====================
app.use(
  cors({
    origin: FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// =====================
// SAFE RESPONSE WRAPPER
// =====================
const asyncHandler = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error("🔥 Unhandled error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  });

// =====================
// SYSTEM STATUS
// =====================
console.log("🚀 RoofFlow Core Boot:", {
  twilio: !!twilioClient,
  stripe: !!stripe,
  ai: !!OLLAMA_URL,
});

// =====================
// HEALTH CHECK
// =====================
app.get("/", (_, res) => {
  res.json({
    status: "ok",
    service: "RoofFlow Core Engine",
  });
});

// ======================================================
// 🧠 PRICING ENGINE
// ======================================================
const LEAD_TIERS = {
  low: 1500,
  mid: 3000,
  high: 5000,
};

const SUBSCRIPTIONS = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

const CITY_MULTIPLIER = {
  basic: 1,
  priority: 1.5,
  exclusive: 3,
};

function calculateLeadValue(score = 5, cityTier = "basic") {
  const base =
    score >= 8
      ? LEAD_TIERS.high
      : score >= 6
      ? LEAD_TIERS.mid
      : LEAD_TIERS.low;

  const multiplier = CITY_MULTIPLIER[cityTier] || 1;

  return Math.floor(base * multiplier);
}

// ======================================================
// 🧠 AI ROUTER
// ======================================================
const FALLBACK = "Are you available this week for a roof inspection?";

async function aiReply(prompt) {
  if (!OLLAMA_URL) return FALLBACK;

  try {
    const res = await fetchFn(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          {
            role: "system",
            content:
              "You are a roofing sales assistant. Ask ONE short booking question.",
          },
          { role: "user", content: prompt || "" },
        ],
      }),
    });

    const data = await res.json();
    return data?.message?.content || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

// ======================================================
// 📥 LEAD ENGINE
// ======================================================
app.post(
  "/api/lead",
  asyncHandler(async (req, res) => {
    const { phone, score = 5, cityTier = "basic" } = req.body || {};

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Missing phone",
      });
    }

    const leadValue = calculateLeadValue(score, cityTier);

    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Lead received. Value: $${(leadValue / 100).toFixed(2)}`,
        from: TWILIO_PHONE,
        to: phone,
      });
    }

    return res.json({
      success: true,
      leadValue,
      tier: cityTier,
    });
  })
);

// ======================================================
// 💳 STRIPE CHECKOUT
// ======================================================
app.post(
  "/api/checkout",
  asyncHandler(async (req, res) => {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        error: "Stripe not configured",
      });
    }

    const { plan, email, phone } = req.body || {};
    const amount = SUBSCRIPTIONS[plan];

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `RoofFlow ${plan}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      success_url: `${FRONTEND_URL}/success`,
      cancel_url: `${FRONTEND_URL}/cancel`,
    });

    res.json({ success: true, url: session.url });
  })
);

// ======================================================
// 📩 SMS ROUTER
// ======================================================
app.post(
  "/sms",
  asyncHandler(async (req, res) => {
    const msg = req.body?.Body;
    const from = req.body?.From;

    if (!msg || !from) return res.sendStatus(200);

    const reply = await aiReply(msg);

    if (twilioClient) {
      await twilioClient.messages.create({
        body: reply,
        from: TWILIO_PHONE,
        to: from,
      });
    }

    res.sendStatus(200);
  })
);

// =====================
// START SERVER
// =====================
const port = PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 RoofFlow Core Engine running on ${port}`);
});

module.exports = app;