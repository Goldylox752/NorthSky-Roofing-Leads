import OpenAI from "openai";
import Lead from "./models/Lead.js";
import dbConnect from "./lib/db.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const scoreLead = async (req, res) => {
  try {
    await dbConnect();

    const { leadId, message } = req.body;

    if (!leadId) {
      return res.status(400).json({ success: false, error: "Missing leadId" });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a roofing lead qualification system. Score purchase intent from 1-10. ONLY return a number.",
        },
        {
          role: "user",
          content: message?.trim() || "No message provided",
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const parsedScore = parseInt(raw.match(/\d+/)?.[0]);

    const score = Number.isNaN(parsedScore)
      ? 5
      : Math.max(1, Math.min(10, parsedScore));

    lead.score = score;

    if (score >= 8) {
      lead.status = "hot";
    } else if (score >= 6) {
      lead.status = "qualified";
    } else {
      lead.status = "new";
    }

    await lead.save();

    return res.json({
      success: true,
      score,
      status: lead.status,
    });
  } catch (error) {
    console.error("Scoring error:", error);

    return res.status(500).json({
      success: false,
      error: "Lead scoring failed",
    });
  }
};