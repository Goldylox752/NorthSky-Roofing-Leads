import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { contractorId, amount } = await req.json();

  if (!contractorId || !amount) {
    return Response.json({ error: "Missing data" }, { status: 400 });
  }

  // 1. increment wallet
  const { data: contractor, error } = await supabase
    .from("contractors")
    .select("wallet_balance")
    .eq("id", contractorId)
    .single();

  if (error) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const newBalance = contractor.wallet_balance + amount;

  await supabase
    .from("contractors")
    .update({ wallet_balance: newBalance })
    .eq("id", contractorId);

  // 2. log transaction
  await supabase.from("wallet_transactions").insert({
    contractor_id: contractorId,
    type: "topup",
    amount,
    meta: { source: "stripe" },
  });

  return Response.json({
    success: true,
    balance: newBalance,
  });
}