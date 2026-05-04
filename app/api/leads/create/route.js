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

    const identity = email || phone;
    const normalizedCity = city?.toLowerCase().trim() || "global";

    // ===============================
    // IDEMPOTENCY KEY (HARD SAFETY LAYER)
    // ===============================
    const dedupeKey = `${identity}-${normalizedCity}`;

    const existing = await Lead.findOne({ dedupeKey });

    if (existing) {
      return Response.json({
        success: true,
        lead: existing,
        routed: false,
        duplicate: true,
      });
    }

    // ===============================
    // SCORING ENGINE (V1)
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

      assigned_contractor_id: null,

      locked_at: null,
      lock_owner: null,
      lock_expires_at: null,

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
    // ROUTING ENGINE (MARKET DECISION)
    // ===============================
    const assignment = await routeLead(lead);

    if (!assignment?.contractorId) {
      await Lead.updateOne(
        { _id: lead._id },
        {
          $push: {
            events: {
              type: "unassigned",
              reason: "no_contractor_available",
              timestamp: new Date(),
            },
          },
        }
      );

      return Response.json({
        success: true,
        lead,
        routed: false,
      });
    }

    // ===============================
    // ATOMIC LOCK (CRITICAL SAFETY LAYER)
    // ===============================
    const locked = await lockLead(
      Lead,
      lead._id,
      assignment.contractorId
    );

    if (!locked) {
      return Response.json(
        {
          success: false,
          error: "Lead already locked by another contractor",
        },
        { status: 409 }
      );
    }

    // ===============================
    // PRICE ENGINE
    // ===============================
    const price = calculateLeadPrice(
      score,
      assignment.cityTier || "basic"
    );

    // ===============================
    // SINGLE ATOMIC UPDATE (SOURCE OF TRUTH)
    // ===============================
    const updatedLead = await Lead.findOneAndUpdate(
      {
        _id: lead._id,
        status: "new", // prevents race overwrite
      },
      {
        $set: {
          status: "assigned",
          assigned_contractor_id: assignment.contractorId,
          price,
          locked_at: new Date(),
          lock_owner: assignment.contractorId,
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

    if (!updatedLead) {
      return Response.json(
        {
          success: false,
          error: "State transition failed (race condition)",
        },
        { status: 409 }
      );
    }

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
    console.error("🔥 Lead creation crash:", error);

    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}