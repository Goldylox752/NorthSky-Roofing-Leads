import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { leadId, contractorId } = await req.json();

    if (!leadId || !contractorId) {
      return Response.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ===============================
    // 🔐 ATOMIC CLAIM (FULL LOCK SAFETY)
    // ===============================
    const { data, error } = await supabase
      .from("leads")
      .update({
        status: "assigned",
        assigned_contractor_id: contractorId,

        // 🔒 locking system
        lock_owner: contractorId,
        locked_at: now.toISOString(),
        lock_expires_at: expiresAt.toISOString(),
      })
      .eq("id", leadId)

      // 🧠 critical: only allow claim if:
      // - still new OR
      // - lock expired
      .or(
        `status.eq.new,and(lock_expires_at.lt.${now.toISOString()})`
      )
      .select()
      .single();

    // ===============================
    // 🚫 FAIL SAFE (already taken)
    // ===============================
    if (error || !data) {
      return Response.json(
        {
          success: false,
          error: "Lead already claimed or locked",
        },
        { status: 409 }
      );
    }

    // ===============================
    // SUCCESS
    // ===============================
    return Response.json({
      success: true,
      lead: data,
      lockedBy: contractorId,
    });

  } catch (err) {
    console.error("Lead claim error:", err);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}