import Lead from "@/models/Lead";
import dbConnect from "@/lib/db";
import { routeLead } from "@/lib/routeLead";
import { lockLead } from "@/lib/leadLock";
import { calculateLeadPrice } from "@/lib/pricingEngine";

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
    // IDEMPOTENCY KEY (ANTI-DUPLICATE)
    // ===============================
    const dedupeKey = `${email || phone}-${city || "global"}`;

    const existing = await Lead.findOne({ dedupeKey });

    if (existing) {
      return Response.json({
        success: true,
        lead: existing,
        routed: false,
        message: "Duplicate lead prevented",
      });
    }

    // ===============================
    // LEAD SCORING ENGINE (V1)
    // ===============================
    let score = 5;

    if (email) score += 1;
    if (phone) score += 2;
    if (city) score += 1;

    score = Math.min(score, 10);

    // ===============================
    // CREATE LEAD (INITIAL STATE)
    // ===============================
    const lead = await Lead.create({
      email,
      phone,
      name,
      city: city || null,
      source: source || "direct",

      dedupeKey,

      score,
      status: "new",

      locked_at: null,
      lock_owner: null,
      lock_expires_at: null,

      assigned_contractor_id: null,

      price: 0,
      billed: false,

      events: [
        {
          type: "created",
          timestamp: new Date(),
          source: source || "direct",
        },
      ],
    });

    // ===============================
    // ROUTING ENGINE
    // ===============================
    const assignment = await routeLead(lead);

    if (!assignment?.contractorId) {
      lead.events.push({
        type: "unassigned",
        timestamp: new Date(),
        reason: "no_contractor_available",
      });

      await lead.save();

      return Response.json({
        success: true,
        lead,
        routed: false,
        message: "No contractor available",
      });
    }

    // ===============================
    // HARD LOCK (ATOMIC STATE TRANSITION)
    // ===============================
    const locked = await lockLead(
      Lead,
      lead._id,
      assignment.contractorId
    );

    if (!locked) {
      return Response.json(
        { success: false, error: "Lead already locked" },
        { status: 409 }
      );
    }

    // ===============================
    // PRICE ENGINE (MARKET VALUE)
    // ===============================
    const price = calculateLeadPrice(
      score,
      assignment.cityTier || "basic"
    );

    // ===============================
    // FINAL STATE UPDATE (SINGLE WRITE)
    // ===============================
    const updatedLead = await Lead.findByIdAndUpdate(
      lead._id,
      {
        $set: {
          status: "assigned",
          assigned_contractor_id: assignment.contractorId,
          price,
          locked_at: new Date(),
        },
        $push: {
          events: {
            type: "assigned",
            contractorId: assignment.contractorId,
            price,
            city: assignment.city,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      routed: true,

      lead: updatedLead,

      assignment: {
        contractorId: assignment.contractorId,
        price,
        city: assignment.city,
      },
    });

  } catch (error) {
    console.error("🔥 Lead creation error:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}