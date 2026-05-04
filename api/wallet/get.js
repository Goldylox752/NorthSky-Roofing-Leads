import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const { contractorId } = await req.json();

  const { data, error } = await supabase
    .from("contractors")
    .select("wallet_balance, total_spent")
    .eq("id", contractorId)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    balance: data.wallet_balance,
    spent: data.total_spent,
  });
}