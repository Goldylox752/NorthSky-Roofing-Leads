import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { leadId, contractorId } = await req.json();

    if (!leadId || !contractorId) {
      return Response.json(
        { success: false, error: "Missing data" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // ===============================
    // 🔐 ATOMIC CLAIM (NO RACE CONDITION)
    // ===============================
    const { data: updated, error } = await supabase
      .from("leads")
      .update({
        status: "assigned",

        assigned_contractor_id: contractorId,
        lock_owner: contractorId,

        locked_at: now,
        lock_expires_at: expiresAt,
      })
      .eq("id", leadId)

      // 🧠 CRITICAL: prevents double-claim
      .or(
        `status.eq.new,and(status.eq.assigned,lock_expires_at.lt.${now})`
      )
      .select()
      .maybeSingle();

    // ===============================
    // ❌ FAILED CLAIM (already owned)
    // ===============================
    if (error || !updated) {
      return Response.json(
        {
          success: false,
          error: "LEAD_ALREADY_CLAIMED",
        },
        { status: 409 }
      );
    }

    // ===============================
    // 📡 EVENT LOG (NON-BLOCKING)
    // ===============================
    supabase.from("events").insert({
      lead_id: leadId,
      type: "lead_claimed",
      payload: {
        contractorId,
        locked_at: now,
      },
    }).catch(() => {});

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      lead: updated,
      lockedBy: contractorId,
      expiresAt,
    });

  } catch (err) {
    console.error("🔥 Lead claim error:", err);

    return Response.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}