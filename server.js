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
const twilio = require("twilio");
const Stripe = require("stripe");

// fetch fallback
const fetchFn =
  global.fetch ||
  ((...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args)));

// =====================
// APP INIT
// =====================
const app = express();
app.use(express.json());

const {
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE,
  STRIPE_SECRET_KEY,
  FRONTEND_URL,
  OLLAMA_URL,
  PORT,
} = process.env;

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
// SAFETY CHECK
// =====================
console.log("SYSTEM STATUS", {
  twilio: !!twilioClient,
  stripe: !!stripe,
  ai: !!OLLAMA_URL,
  frontend: !!FRONTEND_URL,
});

// =====================
// CORS
// =====================
app.use(
  cors({
    origin: FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  })
);

// =====================
// HEALTH
// =====================
app.get("/", (_, res) => {
  res.json({ status: "ok", service: "RoofFlow Core Engine" });
});

// ======================================================
// 💰 MONETIZATION ENGINE (CORE)
// ======================================================

// LEAD PRICING (dynamic marketplace)
const LEAD_PRICE_TIERS = {
  low: 1500,   // $15
  mid: 3000,   // $30
  high: 5000,  // $50
};

// SUBSCRIPTIONS
const SUBSCRIPTION_TIERS = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

// CITY EXCLUSIVITY MULTIPLIER
const CITY_MULTIPLIER = {
  basic: 1,
  priority: 1.5,
  exclusive: 3,
};

// =====================
// LEAD VALUE ENGINE
// =====================
function calculateLeadValue(score = 5, cityTier = "basic") {
  let base =
    score >= 8
      ? LEAD_PRICE_TIERS.high
      : score >= 6
      ? LEAD_PRICE_TIERS.mid
      : LEAD_PRICE_TIERS.low;

  const multiplier = CITY_MULTIPLIER[cityTier] || 1;

  return Math.floor(base * multiplier);
}

// =====================
// AI RESPONSE
// =====================
const FALLBACK = "Are you available this week for a quick roof inspection?";

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

// =====================
// DRIP SYSTEM
// =====================
function drip(phone) {
  if (!twilioClient || !phone) return;

  const steps = [
    { delay: 0, text: "We received your request." },
    { delay: 3600000, text: "Contractor availability is limited." },
    { delay: 86400000, text: "Still want a roofing estimate?" },
    { delay: 172800000, text: "Final reminder — slots closing." },
  ];

  steps.forEach((m) => {
    setTimeout(async () => {
      try {
        await twilioClient.messages.create({
          body: m.text,
          from: TWILIO_PHONE,
          to: phone,
        });
      } catch (e) {
        console.error("Drip error:", e.message);
      }
    }, m.delay);
  });
}

// ======================================================
// 📥 LEAD CAPTURE + MARKET VALUE ENGINE
// ======================================================
app.post("/api/lead", async (req, res) => {
  try {
    const { phone, score = 5, cityTier = "basic" } = req.body || {};

    if (!phone) {
      return res.status(400).json({ error: "Missing phone" });
    }

    const value = calculateLeadValue(score, cityTier);

    // SMS confirmation
    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Lead received. Estimated value: $${(value / 100).toFixed(2)}`,
        from: TWILIO_PHONE,
        to: phone,
      });
    }

    drip(phone);

    return res.json({
      success: true,
      leadValue: value,
      tier: cityTier,
    });
  } catch (err) {
    console.error("Lead error:", err.message);
    return res.status(500).json({ error: "Lead error" });
  }
});

// ======================================================
// 💳 STRIPE CHECKOUT (SAAS + LEAD ACCESS)
// ======================================================
app.post("/api/checkout", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe missing" });
    }

    const { plan, email, phone } = req.body || {};
    const amount = SUBSCRIPTION_TIERS[plan];

    if (!amount) {
      return res.status(400).json({ error: "Invalid plan" });
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
              description: "Lead routing + territory access",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cancel`,

      metadata: { plan, email, phone },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(500).json({ error: "Checkout failed" });
  }
});

// ======================================================
// 📩 SMS AI ROUTER
// ======================================================
app.post("/sms", async (req, res) => {
  try {
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

    return res.sendStatus(200);
  } catch (err) {
    console.error("SMS error:", err.message);
    return res.sendStatus(200);
  }
});

// =====================
// START SERVER
// =====================
const port = PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 RoofFlow Core Engine running on ${port}`);
});

module.exports = app;