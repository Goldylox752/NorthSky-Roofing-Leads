import { supabase } from "@/lib/supabase";

/**
 * ===============================
 * GET BALANCE
 * ===============================
 */
export async function getBalance(contractorId) {
  const { data, error } = await supabase
    .from("contractors")
    .select("balance_cents")
    .eq("id", contractorId)
    .single();

  if (error) throw new Error(error.message);

  return data?.balance_cents || 0;
}

/**
 * ===============================
 * DEDUCT CREDIT (ATOMIC SAFE)
 * ===============================
 */
export async function deductCredit(contractorId, amount, leadId) {
  if (!amount || amount <= 0) {
    return { success: false, error: "INVALID_AMOUNT" };
  }

  // ⚡ ATOMIC UPDATE (NO RACE CONDITIONS)
  const { data, error } = await supabase
    .from("contractors")
    .update({
      balance_cents: supabase.sql`
        balance_cents - ${amount}
      `,
    })
    .eq("id", contractorId)
    .gte("balance_cents", amount) // prevents negative balance
    .select("balance_cents")
    .single();

  if (error || !data) {
    return { success: false, error: "INSUFFICIENT_FUNDS_OR_LOCKED" };
  }

  // 📜 ledger log (always after success)
  await supabase.from("transactions").insert({
    contractor_id: contractorId,
    type: "debit",
    amount_cents: amount,
    lead_id,
    description: "Lead claim purchase",
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    balance: data.balance_cents,
  };
}

/**
 * ===============================
 * ADD CREDIT (TOP UP)
 * ===============================
 */
export async function addCredit(contractorId, amount) {
  if (!amount || amount <= 0) {
    return { success: false, error: "INVALID_AMOUNT" };
  }

  // ⚡ ATOMIC INCREMENT
  const { data, error } = await supabase
    .from("contractors")
    .update({
      balance_cents: supabase.sql`
        balance_cents + ${amount}
      `,
    })
    .eq("id", contractorId)
    .select("balance_cents")
    .single();

  if (error) {
    return { success: false, error: "TOPUP_FAILED" };
  }

  // 📜 ledger log
  await supabase.from("transactions").insert({
    contractor_id: contractorId,
    type: "credit",
    amount_cents: amount,
    description: "Wallet top-up",
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    balance: data.balance_cents,
  };
}