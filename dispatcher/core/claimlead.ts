import { supabase } from "@/lib/supabase";

export async function claimLead(leadId: string, workerId: string) {
  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "processing",
      locked_by: workerId,
      locked_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("status", "queued") // prevents double claim
    .select()
    .single();

  if (error || !data) return null;

  return data;
}