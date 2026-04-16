.eq("city", lead.city)

const existing = await supabase
  .from("lead_assignments")
  .select("*")
  .eq("lead_id", lead.id)
  .single();

if (existing.data) return;


async function routeExclusiveLead(lead) {
  // 1. Get eligible contractors
  const { data: contractors } = await supabase
    .from("contractors")
    .select("*")
    .eq("subscription_status", "active")
    .order("subscription_tier", { ascending: false });

  if (!contractors?.length) return;

  // 2. Tier priority system
  const tierWeight = {
    elite: 3,
    pro: 2,
    starter: 1
  };

  // 3. Pick best contractor (highest tier first)
  const sorted = contractors.sort(
    (a, b) => (tierWeight[b.subscription_tier] || 0) - (tierWeight[a.subscription_tier] || 0)
  );

  const selected = sorted[0];

  if (!selected) return;

  // 4. Lock lead (IMPORTANT)
  await supabase.from("lead_assignments").insert([
    {
      lead_id: lead.id,
      contractor_id: selected.id,
      status: "assigned"
    }
  ]);

  // 5. Send ONLY to selected contractor
  await sendSMS(selected.phone, lead);

  console.log("🎯 Lead assigned exclusively to:", selected.email);
}



if (event.type === "checkout.session.completed") {
  const session = event.data.object;
  const email = session.customer_details?.email;

  const tier =
    session.amount_total === 9900 ? "starter" :
    session.amount_total === 29900 ? "pro" :
    "elite";

  await supabase
    .from("contractors")
    .update({
      subscription_status: "active",
      subscription_tier: tier
    })
    .eq("email", email);
}



app.post("/api/create-checkout", async (req, res) => {
  const { email, tier } = req.body;

  const prices = {
    starter: "price_xxx1",
    pro: "price_xxx2",
    elite: "price_xxx3",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price: prices[tier],
        quantity: 1,
      },
    ],
    success_url: "https://your-site.com/dashboard",
    cancel_url: "https://your-site.com/pricing",
  });

  res.json({ url: session.url });
});



import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

// ========================
// APP + SERVICES
// ========================
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

// ========================
// MIDDLEWARE
// ========================
app.use(cors());
app.use(express.json());

app.use(
  "/api/new-lead",
  rateLimit({
    windowMs: 60 * 1000,
    max: 5,
  })
);

// ========================
// LEAD SCORING ENGINE
// ========================
function scoreLead({ city, issue, timeline }) {
  let score = 0;

  const urgencyMap = {
    today: 50,
    this_week: 30,
    this_month: 10,
    researching: 0,
  };

  score += urgencyMap[timeline] || 0;

  const text = (issue || "").toLowerCase();

  if (text.includes("leak")) score += 35;
  if (text.includes("emergency")) score += 40;
  if (text.includes("replacement")) score += 25;
  if (text.includes("insurance")) score += 20;

  const cityLower = (city || "").toLowerCase();
  if (cityLower.includes("edmonton")) score += 20;
  if (cityLower.includes("calgary")) score += 20;

  return Math.min(score, 100);
}

// ========================
// SMS FUNCTION
// ========================
async function sendSMS(to, lead) {
  try {
    await twilioClient.messages.create({
      body: `🔥 NEW ROOFING LEAD

Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
Issue: ${lead.issue || "N/A"}
Timeline: ${lead.timeline || "N/A"}
Score: ${lead.score}`,
      from: process.env.TWILIO_NUMBER,
      to,
    });

    console.log("📨 SMS sent:", to);
  } catch (err) {
    console.error("❌ SMS failed:", err.message);
  }
}

// ========================
// DISPATCH ENGINE
// ========================
async function dispatchLead(lead) {
  const { data: contractors } = await supabase
    .from("contractors")
    .select("email, phone")
    .eq("subscription_status", "active");

  if (!contractors?.length) {
    console.log("No active contractors");
    return;
  }

  for (const c of contractors) {
    if (!c.phone) continue;

    if (lead.score >= 70) {
      console.log("🔥 HOT LEAD → SMS:", c.phone);
      await sendSMS(c.phone, lead);
    } else if (lead.score >= 40) {
      console.log("⚡ WARM LEAD → SMS:", c.phone);
      await sendSMS(c.phone, lead);
    } else {
      console.log("🧊 COLD LEAD ignored for dispatch");
    }
  }
}

// ========================
// STRIPE WEBHOOK
// ========================
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
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
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email;

      if (email) {
        await supabase
          .from("contractors")
          .update({ subscription_status: "active" })
          .eq("email", email);

        console.log("✅ Contractor activated:", email);
      }
    }

    res.json({ received: true });
  }
);

// ========================
// NEW LEAD ENDPOINT
// ========================
app.post("/api/new-lead", async (req, res) => {
  try {
    const { name, phone, city, issue, timeline } = req.body;

    if (!name || !phone || !city) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const score = scoreLead({ city, issue, timeline });

    const lead = {
      name,
      phone,
      city,
      issue,
      timeline,
      score,
      created_at: new Date(),
    };

    const { error } = await supabase.from("leads").insert([lead]);

    if (error) throw error;

    console.log("📥 Lead saved:", score);

    if (score >= 70) {
      console.log("🔥 HOT LEAD");
      await dispatchLead(lead);
    } else if (score >= 40) {
      console.log("⚡ WARM LEAD");
      await dispatchLead(lead);
    } else {
      console.log("🧊 COLD LEAD STORED ONLY");
    }

    res.json({ success: true, score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================
// HEALTH CHECK
// ========================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ========================
// START SERVER
// ========================
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 NorthSky backend running");
});
