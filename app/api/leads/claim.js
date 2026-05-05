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

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAtIso = new Date(
      Date.now() + 5 * 60 * 1000
    ).toISOString();

    // ===============================
    // STEP 1: FETCH CURRENT STATE (SAFE CHECK)
    // ===============================
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, status, lock_expires_at")
      .eq("id", leadId)
      .maybeSingle();

    if (fetchError || !lead) {
      return Response.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // ===============================
    // STEP 2: CHECK IF CLAIMABLE (LOGIC LAYER)
    // ===============================
    const isLocked =
      lead.status === "assigned" &&
      lead.lock_expires_at &&
      new Date(lead.lock_expires_at) > now;

    if (lead.status === "assigned" && isLocked) {
      return Response.json(
        {
          success: false,
          error: "Lead already claimed",
        },
        { status: 409 }
      );
    }

    // ===============================
    // STEP 3: CLAIM LEAD (SAFE UPDATE)
    // ===============================
    const { data: updated, error: updateError } = await supabase
      .from("leads")
      .update({
        status: "assigned",
        assigned_contractor_id: contractorId,
        lock_owner: contractorId,
        locked_at: nowIso,
        lock_expires_at: expiresAtIso,
      })
      .eq("id", leadId)
      .select()
      .single();

    if (updateError || !updated) {
      return Response.json(
        {
          success: false,
          error: "Failed to claim lead",
        },
        { status: 500 }
      );
    }

    // ===============================
    // SUCCESS RESPONSE (FRONTEND SAFE)
    // ===============================
    return Response.json({
      success: true,
      lead: updated,
      lockedBy: contractorId,
    });

  } catch (err) {
    console.error("Lead claim error:", err);

    return Response.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}