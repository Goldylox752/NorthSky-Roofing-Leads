// =====================
// ENV SETUP
// =====================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const OpenAI = require("openai");
const Stripe = require("stripe");

const app = express();

// =====================
// ENV
// =====================
const {
  OPENAI_API_KEY,
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  PORT,
} = process.env;

// =====================
// SAFETY CHECK
// =====================
const required = [
  "OPENAI_API_KEY",
  "TWILIO_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE",
  "STRIPE_SECRET_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing env: ${key}`);
    process.exit(1);
  }
}

// =====================
// INIT SERVICES
// =====================
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
const stripe = new Stripe(STRIPE_SECRET_KEY);

// =====================
// MIDDLEWARE (IMPORTANT ORDER)
// =====================
app.use(cors());
app.use(express.json());

// Stripe webhook MUST use raw body BEFORE json middleware
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);

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
    { delay: 3600000, text: "We only accept limited contractors per area." },
    { delay: 86400000, text: "Still interested in exclusive roofing leads?" },
    { delay: 172800000, text: "Final reminder — spots are almost full." },
  ];
}

function sendDrip(phone, messages) {
  messages.forEach((msg) => {
    setTimeout(async () => {
      try {
        await twilioClient.messages.create({
          body: msg.text,
          from: TWILIO_PHONE,
          to: phone,
        });
      } catch (err) {
        console.error("Drip error:", err.message);
      }
    }, msg.delay);
  });
}

// =====================
// HOME (simple status page)
// =====================
app.get("/", (req, res) => {
  res.send("🚀 RoofFlow AI Backend Running");
});

// =====================
// STRIPE CHECKOUT
// =====================
app.post("/api/checkout", async (req, res) => {
  try {
    const { plan, email, phone } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

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

      success_url: "https://your-vercel-domain.com/success",
      cancel_url: "https://your-vercel-domain.com/cancel",

      metadata: { email, phone, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// =====================
// STRIPE WEBHOOK (FIXED + SECURE)
// =====================
app.post("/api/stripe/webhook", (req, res) => {
  let event;

  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).send("Invalid webhook");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const phone = session.metadata?.phone;

    console.log("💰 PAYMENT SUCCESS:", session.metadata);

    if (phone) {
      sendDrip(phone, dripSequence());
    }
  }

  res.json({ received: true });
});

// =====================
// LEAD CAPTURE
// =====================
app.post("/api/lead", async (req, res) => {
  try {
    const { phone } = req.body;

    await twilioClient.messages.create({
      body: "Thanks — we’ll follow up shortly.",
      from: TWILIO_PHONE,
      to: phone,
    });

    sendDrip(phone, dripSequence());

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lead error" });
  }
});

// =====================
// SMS AI BOT
// =====================
app.post("/sms", async (req, res) => {
  try {
    const msg = req.body?.Body;
    const from = req.body?.From;

    if (!msg || !from) return res.sendStatus(200);

    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Short helpful business assistant." },
        { role: "user", content: msg },
      ],
    });

    const reply =
      ai.choices?.[0]?.message?.content || "Thanks — we’ll follow up.";

    await twilioClient.messages.create({
      body: reply,
      from: TWILIO_PHONE,
      to: from,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// =====================
// START SERVER
// =====================
app.listen(PORT || 3000, () => {
  console.log("🚀 RoofFlow AI System Running");
});