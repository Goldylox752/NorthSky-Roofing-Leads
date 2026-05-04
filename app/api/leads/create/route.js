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
    // LEAD SCORING ENGINE (V1)
    // ===============================
    let score = 5;

    if (email) score += 1;
    if (phone) score += 2;
    if (city) score += 1;

    score = Math.min(score, 10);

    // ===============================
    // CREATE LEAD (RAW STATE)
    // ===============================
    const lead = await Lead.create({
      email,
      phone,
      name,
      city: city || null,
      source: source || "direct",

      score,

      status: "new",

      locked_at: null,
      lock_owner: null,
      lock_expires_at: null,

      assigned_contractor_id: null,

      price: 0,
      billed: false,
    });

    // ===============================
    // ROUTING ENGINE (WHO GETS IT)
    // ===============================
    const assignment = await routeLead(lead);

    if (!assignment?.contractorId) {
      return Response.json({
        success: true,
        lead,
        routed: false,
        message: "No contractor available",
      });
    }

    // ===============================
    // ATOMIC LOCK (CRITICAL FIX)
    // prevents double assignment
    // ===============================
    const locked = await lockLead(Lead, lead._id, assignment.contractorId);

    if (!locked) {
      return Response.json({
        success: false,
        error: "Lead already claimed",
      });
    }

    // ===============================
    // PRICE ENGINE (REAL MARKET VALUE)
    // ===============================
    const price = calculateLeadPrice(score, assignment.cityTier || "basic");

    // ===============================
    // FINAL ASSIGNMENT UPDATE
    // ===============================
    lead.status = "assigned";
    lead.assigned_contractor_id = assignment.contractorId;
    lead.price = price;

    await lead.save();

    // ===============================
    // EVENT LOG (AUDIT TRAIL)
    // ===============================
    await Lead.updateOne(
      { _id: lead._id },
      {
        $push: {
          events: {
            type: "assigned",
            contractorId: assignment.contractorId,
            price,
            timestamp: new Date(),
          },
        },
      }
    );

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      lead,
      routed: true,
      assignment: {
        contractorId: assignment.contractorId,
        price,
        city: assignment.city,
      },
    });

  } catch (error) {
    console.error("Lead creation error:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}