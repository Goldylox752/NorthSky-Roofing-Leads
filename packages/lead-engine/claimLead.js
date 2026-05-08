import { supabase } from "@/lib/supabase";

export async function claimLead({ leadId, contractorId }) {
  const now = new Date().toISOString();

  /* ===============================
     ATOMIC + EXPIRED LOCK SAFE CLAIM
  =============================== */
  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "claimed",
      assigned_contractor_id: contractorId,
      lock_owner: contractorId,
      locked_at: now,
      lock_expires_at: new Date(
        Date.now() + 5 * 60 * 1000
      ).toISOString(),
    })
    .eq("id", leadId)

    // 🔥 only allow if:
    // - lead is new OR lock expired
    .or(
      `status.eq.new,lock_expires_at.lt.${now}`
    )
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}