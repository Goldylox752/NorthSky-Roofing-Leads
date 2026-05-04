import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { contractorId, leadId, price } = await req.json();

  if (!contractorId || !leadId || !price) {
    return Response.json({ error: "Missing data" }, { status: 400 });
  }

  // 1. get contractor
  const { data: contractor } = await supabase
    .from("contractors")
    .select("*")
    .eq("id", contractorId)
    .single();

  if (!contractor) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // 2. check balance
  if (contractor.wallet_balance < price) {
    return Response.json(
      { error: "Insufficient funds" },
      { status: 402 }
    );
  }

  // 3. atomic deduction
  const newBalance = contractor.wallet_balance - price;

  await supabase
    .from("contractors")
    .update({
      wallet_balance: newBalance,
      total_spent: contractor.total_spent + price,
    })
    .eq("id", contractorId);

  // 4. log transaction
  await supabase.from("wallet_transactions").insert({
    contractor_id: contractorId,
    type: "lead_purchase",
    amount: price,
    meta: { leadId },
  });

  // 5. assign lead
  await supabase
    .from("leads")
    .update({
      assigned_contractor_id: contractorId,
      status: "assigned",
      price,
    })
    .eq("id", leadId);

  return Response.json({
    success: true,
    balance: newBalance,
  });
}