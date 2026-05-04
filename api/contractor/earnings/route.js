import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const contractorId = searchParams.get("contractorId");

  const { data } = await supabase
    .from("leads")
    .select("price, billed, status")
    .eq("assigned_contractor_id", contractorId);

  const total = data.reduce((sum, l) => sum + (l.price || 0), 0);
  const billed = data.filter((l) => l.billed).length;

  return Response.json({
    earnings: total,
    billed,
    leads: data.length,
  });
}