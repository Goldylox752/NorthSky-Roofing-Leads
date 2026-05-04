"use strict";

// =====================
// ENV SETUP
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

// Fetch fallback (Render-safe)
const fetchFn =
  global.fetch ||
  ((...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args)));

// =====================
// INIT
// =====================
const app = express();

// =====================
// ENV VARS
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

// =====================
// DEBUG CHECK
// =====================
console.log("ENV STATUS:", {
  TWILIO: Boolean(TWILIO_SID && TWILIO_AUTH_TOKEN),
  STRIPE: Boolean(STRIPE_SECRET_KEY),
  OLLAMA: Boolean(OLLAMA_URL),
  FRONTEND: Boolean(FRONTEND_URL),
});

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
// MIDDLEWARE
// =====================
app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_URL || "*",
  })
);

// =====================
// HELPERS
// =====================
const FALLBACK_REPLY =
  "Are you available this week for a quick roof inspection?";

async function askOllama(prompt) {
  if (!OLLAMA_URL) return FALLBACK_REPLY;

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
              "You are a roofing sales assistant. Ask ONE short question and guide toward booking an inspection.",
          },
          {
            role: "user",
            content: prompt || "",
          },
        ],
        stream: false,
      }),
    });

    if (!res.ok) throw new Error("Ollama request failed");

    const data = await res.json();
    return data?.message?.content || FALLBACK_REPLY;
  } catch (err) {
    console.error("Ollama error:", err.message);
    return FALLBACK_REPLY;
  }
}

// =====================
// PRICING
// =====================
const PLANS = {
  starter: 49900,
  growth: 99900,
  domination: 199900,
};

// =====================
// DRIP SYSTEM
// =====================
function dripSequence() {
  return [
    { delay: 0, text: "Thanks — we received your request." },
    { delay: 60 * 60 * 1000, text: "Limited contractor slots in your area." },
    {
      delay: 24 * 60 * 60 * 1000,
      text: "Still interested in exclusive roofing leads?",
    },
    {
      delay: 48 * 60 * 60 * 1000,
      text: "Final reminder — spots are nearly full.",
    },
  ];
}

function sendDrip(phone, messages) {
  if (!twilioClient || !phone) return;

  messages.forEach((msg) => {
    setTimeout(async () => {
      try {
        await twilioClient.messages.create({
          body: msg.text,
          from: TWILIO_PHONE,
          to: phone,
        });
      } catch (err) {
        console.error("Drip send error:", err.message);
      }
    }, msg.delay);
  });
}

// =====================
// ROUTES
// =====================

// Health check
app.get("/", (_, res) => {
  res.status(200).send("🚀 RoofFlow API LIVE");
});

// =====================
// CHECKOUT
// =====================
app.post("/api/checkout", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const { plan, email, phone } = req.body || {};

    if (!plan || !PLANS[plan]) {
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
              name: `RoofFlow AI - ${plan}`,
            },
            unit_amount: PLANS[plan],
          },
          quantity: 1,
        },
      ],

      success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cancel`,

      metadata: { email, phone, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// =====================
// LEAD CAPTURE
// =====================
app.post("/api/lead", async (req, res) => {
  try {
    const { phone } = req.body || {};

    if (!phone) {
      return res.status(400).json({ error: "Missing phone" });
    }

    if (twilioClient) {
      await twilioClient.messages.create({
        body: "Thanks — we’ll follow up shortly.",
        from: TWILIO_PHONE,
        to: phone,
      });
    }

    sendDrip(phone, dripSequence());

    res.json({ success: true });
  } catch (err) {
    console.error("Lead error:", err.message);
    res.status(500).json({ error: "Lead error" });
  }
});

// =====================
// SMS WEBHOOK
// =====================
app.post("/sms", async (req, res) => {
  try {
    const msg = req.body?.Body;
    const from = req.body?.From;

    if (!msg || !from) return res.sendStatus(200);

    const reply = await askOllama(msg);

    if (twilioClient) {
      await twilioClient.messages.create({
        body: reply,
        from: TWILIO_PHONE,
        to: from,
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("SMS error:", err.message);
    res.sendStatus(200);
  }
});

// =====================
// START SERVER
// =====================
const serverPort = PORT || 3000;

app.listen(serverPort, () => {
  console.log(`🚀 Server running on port ${serverPort}`);
});

// =====================
// EXPORT
// =====================
module.exports = app;