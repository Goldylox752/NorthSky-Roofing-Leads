require("dotenv").config();

const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

// --------------------
// ENV
// --------------------
const {
  OPENAI_API_KEY,
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE,
  BUSINESS_PHONE,
  PORT
} = process.env;

// --------------------
// CLIENTS
// --------------------
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const sms = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

// --------------------
// MEMORY STORE (replace with DB later)
// --------------------
const leads = new Map();

/*
lead structure:
{
  id,
  name,
  phone,
  jobType,
  location,
  status: "new | contacted | hot | dead",
  messages: [],
  createdAt,
  lastContactAt,
  followUpStage: 0
}
*/

// --------------------
// HELPERS
// --------------------
function createLeadId(phone) {
  return phone.replace(/\D/g, "");
}

// --------------------
// AI ENGINE
// --------------------
async function aiReply(lead, stage = 0) {
  const prompts = [
    "First response: short intro + ask ONE question",
    "Follow-up: polite check-in, no pressure",
    "Third follow-up: urgency + offer estimate reminder",
    "Final follow-up: last attempt, friendly close"
  ];

  const prompt = `
You are a roofing sales assistant.

Stage: ${stage}
Instruction: ${prompts[stage] || prompts[0]}

Rules:
- 2–3 sentences max
- ONE question only
- Natural human tone
- Focus: roofing repair, replacement, storm damage

Lead:
Name: ${lead.name}
Job: ${lead.jobType}
Location: ${lead.location}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return res.choices[0].message.content;
}

// --------------------
// SMS SENDER
// --------------------
async function sendSMS(to, body) {
  return sms.messages.create({
    from: TWILIO_PHONE,
    to,
    body,
  });
}

// --------------------
// SAVE / UPDATE LEAD
// --------------------
function saveLead(lead) {
  leads.set(lead.id, lead);
}

// --------------------
// FOLLOW-UP SYSTEM
// --------------------
async function scheduleFollowUp(leadId, delayMs) {
  setTimeout(async () => {
    const lead = leads.get(leadId);
    if (!lead) return;

    // stop if already closed/hot
    if (lead.status === "dead") return;

    lead.followUpStage += 1;

    const message = await aiReply(lead, lead.followUpStage);

    await sendSMS(lead.phone, message);

    lead.messages.push({
      type: "followup",
      stage: lead.followUpStage,
      message,
      at: new Date(),
    });

    lead.lastContactAt = new Date();

    saveLead(lead);

    // chain next follow-up
    if (lead.followUpStage < 3) {
      scheduleFollowUp(
        lead.id,
        [0, 24, 72, 168][lead.followUpStage] * 60 * 60 * 1000
      );
    }

  }, delayMs);
}

// --------------------
// LEAD ENTRY POINT
// --------------------
app.post("/lead", async (req, res) => {
  try {
    const { name, phone, jobType, location } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const id = createLeadId(phone);

    let lead = {
      id,
      name,
      phone,
      jobType,
      location,
      status: "new",
      messages: [],
      createdAt: new Date(),
      lastContactAt: null,
      followUpStage: 0,
    };

    // store lead
    saveLead(lead);

    // AI first message
    const message = await aiReply(lead, 0);

    // send SMS
    await sendSMS(phone, message);

    lead.messages.push({
      type: "initial",
      message,
      at: new Date(),
    });

    lead.status = "contacted";
    lead.lastContactAt = new Date();

    saveLead(lead);

    // notify business
    if (BUSINESS_PHONE) {
      await sendSMS(
        BUSINESS_PHONE,
        `New Lead: ${name} | ${phone} | ${jobType}`
      );
    }

    // start follow-up chain
    scheduleFollowUp(id, 24 * 60 * 60 * 1000); // 24h

    res.json({
      success: true,
      message: "Lead captured + AI activated",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// VIEW LEADS (DEBUG TOOL)
// --------------------
app.get("/leads", (req, res) => {
  res.json([...leads.values()]);
});

// --------------------
// SERVER START
// --------------------
const PORT_NUMBER = PORT || 5000;

app.listen(PORT_NUMBER, () => {
  console.log(`🚀 RoofFlow AI v10 running on port ${PORT_NUMBER}`);
});