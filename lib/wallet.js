import { supabase } from "@/lib/supabase";

// ===============================
// GET BALANCE
// ===============================
export async function getBalance(contractorId) {
  const { data } = await supabase
    .from("contractors")
    .select("balance_cents")
    .eq("id", contractorId)
    .single();

  return data?.balance_cents || 0;
}

// ===============================
// DEDUCT CREDIT (SAFE)
// ===============================
export async function deductCredit(contractorId, amount, leadId) {
  const balance = await getBalance(contractorId);

  if (balance < amount) {
    return { success: false, error: "INSUFFICIENT_FUNDS" };
  }

  // atomic update
  const { error } = await supabase
    .from("contractors")
    .update({
      balance_cents: balance - amount,
    })
    .eq("id", contractorId);

  if (error) {
    return { success: false, error: "UPDATE_FAILED" };
  }

  // log transaction
  await supabase.from("transactions").insert({
    contractor_id: contractorId,
    type: "debit",
    amount_cents: amount,
    lead_id: leadId,
    description: "Lead claim purchase",
  });

  return { success: true };
}

// ===============================
// ADD CREDIT (STRIPE TOPUP)
// ===============================
export async function addCredit(contractorId, amount) {
  const balance = await getBalance(contractorId);

  await supabase
    .from("contractors")
    .update({
      balance_cents: balance + amount,
    })
    .eq("id", contractorId);

  await supabase.from("transactions").insert({
    contractor_id: contractorId,
    type: "credit",
    amount_cents: amount,
    description: "Wallet top-up",
  });
}