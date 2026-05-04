import Lead from "@/models/Lead";
import dbConnect from "@/lib/db";
import { routeLead } from "@/lib/routeLead";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const { email, phone, name, city, source } = body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!email && !phone) {
      return Response.json(
        { success: false, error: "Email or phone required" },
        { status: 400 }
      );
    }

    // ===============================
    // BASIC LEAD SCORING ENGINE
    // (upgrade later with AI model)
    // ===============================
    let score = 5;

    if (email) score += 1;
    if (phone) score += 2;
    if (city) score += 1;

    score = Math.min(score, 10);

    // ===============================
    // CREATE LEAD (STATE MACHINE INIT)
    // ===============================
    const lead = await Lead.create({
      email,
      phone,
      name,
      city: city || null,

      score,

      status: "new",

      // 🔒 STATE LOCK SYSTEM INIT
      locked_at: null,
      lock_owner: null,
      lock_expires_at: null,

      // 💰 billing hooks (future stripe binding)
      price: 0,
      billed: false,

      source: source || "direct",
    });

    // ===============================
    // ROUTING ENGINE TRIGGER
    // (assign contractor immediately)
    // ===============================
    const routingResult = await routeLead(lead);

    // ===============================
    // OPTIONAL: update lead if routed
    // ===============================
    if (routingResult?.contractorId) {
      lead.status = "assigned";
      lead.assigned_contractor_id = routingResult.contractorId;
      await lead.save();
    }

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      lead,
      routed: !!routingResult,
    });

  } catch (error) {
    console.error("Lead creation error:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}