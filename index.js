async function dispatchLead(lead) {
  const { data: contractors } = await supabase
    .from("contractors")
    .select("*")
    .eq("subscription_status", "active");

  if (!contractors?.length) return;

  for (const c of contractors) {
    console.log("Sending lead to:", c.email);

    // Twilio / email / dashboard push here
  }
}



function scoreLead({ city, issue, timeline }) {
  let score = 0;

  // urgency = highest value
  const urgency = {
    today: 50,
    this_week: 30,
    this_month: 10,
    researching: 0
  };

  score += urgency[timeline] || 0;

  // intent strength
  if (issue?.toLowerCase().includes("leak")) score += 35;
  if (issue?.toLowerCase().includes("emergency")) score += 40;
  if (issue?.toLowerCase().includes("replacement")) score += 25;

  // geo value
  const highValueCities = ["edmonton", "calgary"];
  if (highValueCities.includes(city.toLowerCase())) score += 20;

  return Math.min(score, 100);
}







import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);




app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 💳 PAYMENT SUCCESS
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const customerId = session.customer;
    const email = session.customer_email;

    // 🔓 ACTIVATE CONTRACTOR
    await supabase
      .from("contractors")
      .update({ subscription_status: "active" })
      .eq("email", email);

    console.log("🔥 Contractor activated:", email);
  }

  res.json({ received: true });
});


app.post("/api/create-checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    res.json({ url: session.url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});







import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// 🔒 Rate limit (anti-spam)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 10
}));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_KEY = process.env.API_KEY;

// 🔐 API protection
app.use((req, res, next) => {
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// 🧠 LEAD SCORING ENGINE
function scoreLead({ city, issue, timeline }) {
  let score = 0;

  if (timeline === "today") score += 40;
  if (timeline === "this_week") score += 25;

  if (issue?.includes("leak")) score += 30;
  if (issue?.includes("replacement")) score += 20;

  if (city?.toLowerCase().includes("edmonton")) score += 20;
  if (city?.toLowerCase().includes("calgary")) score += 20;

  return score;
}

// 🚀 MAIN ENDPOINT
app.post("/api/new-lead", async (req, res) => {
  try {
    const { name, phone, city, issue, timeline } = req.body;

    if (!name || !phone || !city) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const score = scoreLead({ city, issue, timeline });

    const lead = {
      name,
      phone,
      city,
      issue,
      timeline,
      score,
      created_at: new Date()
    };

    // 💾 Save lead
    const { error } = await supabase
      .from("leads")
      .insert([lead]);

    if (error) throw error;

    // 🚨 DISPATCH LOGIC
    if (score >= 60) {
      console.log("🔥 HOT LEAD → send SMS to contractors");
      // Twilio trigger here
    } else if (score >= 30) {
      console.log("⚡ WARM LEAD → email only");
    } else {
      console.log("🧊 COLD LEAD → stored only");
    }

    res.json({ success: true, score });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => console.log("SaaS engine running"));



require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// =========================
// INIT
// =========================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =========================
// SECURITY MIDDLEWARE (ORDER MATTERS)
// =========================
app.use(cors({
  origin: "*"
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60
}));

app.use(express.json({ limit: "1mb" }));

// =========================
// HEALTH CHECK
// =========================
app.get("/", (_, res) => {
  res.status(200).send("🚀 RoofFlow API Running");
});

// =========================
// LEAD SCORING
// =========================
function scoreLead(issue = "") {
  const text = issue.toLowerCase();

  if (text.includes("leak")) return 95;
  if (text.includes("storm")) return 90;
  if (text.includes("replacement")) return 85;

  return 75;
}

// =========================
// STRIPE CHECKOUT
// =========================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email, name, phone, city } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "RoofFlow Lead System" },
          unit_amount: 49700,
          recurring: { interval: "month" }
        },
        quantity: 1
      }],
      metadata: { email, name, phone, city },
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL
    });

    res.json({ id: session.id });

  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// =========================
// STRIPE WEBHOOK (FIXED ORDER)
// =========================
app.post(
  "/api/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send("Invalid signature");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { email } = session.metadata || {};

        if (email) {
          await supabase
            .from("contractors")
            .update({
              active: true,
              stripe_customer_id: session.customer
            })
            .eq("email", email);
        }
      }

      res.json({ received: true });

    } catch (err) {
      console.error("Webhook error:", err.message);
      res.status(500).json({ error: "Webhook failed" });
    }
  }
);

// =========================
// NEW LEAD ROUTER (SCALABLE)
// =========================
app.post("/api/new-lead", async (req, res) => {
  try {
    const { name, phone, city, issue } = req.body;

    if (!name || !phone || !city) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const score = scoreLead(issue);

    // 1. Save lead
    const { data: lead, error } = await supabase
      .from("homeowner_leads")
      .insert([{ name, phone, city, issue, score }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // 2. Get contractors (fair distribution)
    const { data: contractors } = await supabase
      .from("contractors")
      .select("*")
      .eq("city", city)
      .eq("active", true)
      .order("leads_received", { ascending: true });

    if (!contractors?.length) {
      return res.json({ success: true, message: "No contractors" });
    }

    const contractor = contractors.find(
      c => (c.leads_received || 0) < (c.max_leads || 20)
    );

    if (!contractor) {
      return res.json({ success: true, message: "All full" });
    }

    // 3. Async SMS (NON BLOCKING)
    fetch(process.env.SMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: contractor.phone,
        message: `🔥 Lead ${score}/100\n${city}\n${issue}\n${phone}`
      })
    }).catch(console.error);

    // 4. Update usage
    await supabase
      .from("contractors")
      .update({
        leads_received: (contractor.leads_received || 0) + 1
      })
      .eq("id", contractor.id);

    res.json({ success: true, routed: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lead routing failed" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 RoofFlow running on port ${PORT}`);
});
