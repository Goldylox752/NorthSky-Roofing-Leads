import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const contractorId = searchParams.get("contractorId");

  let query = supabase.from("leads").select("*");

  if (contractorId) {
    query = query.eq("assigned_contractor_id", contractorId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  return Response.json({
    leads: data || [],
    error,
  });
}