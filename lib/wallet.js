import { supabase } from "@/lib/supabase";

/**
 * ===============================
 * GET BALANCE (FAST READ)
 * ===============================
 */
export async function getBalance(contractorId) {
  const { data, error } = await supabase
    .from("contractors")
    .select("balance_cents")
    .eq("id", contractorId)
    .single();

  if (error) throw new Error(error.message);

  return data?.balance_cents ?? 0;
}

/**
 * ===============================
 * 🔐 DEDUCT CREDIT (IDEMPOTENT + SAFE)
 * ===============================
 */
export async function deductCredit(contractorId, amount, leadId) {
  if (!contractorId || !leadId) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const { data, error } = await supabase.rpc("deduct_credit", {
    p_contractor_id: contractorId,
    p_amount: amount,
    p_lead_id: leadId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // expected RPC contract
  if (!data?.success) {
    return {
      success: false,
      error: data?.error || "INSUFFICIENT_FUNDS_OR_LOCKED",
    };
  }

  return {
    success: true,
    balance: data.balance,
    deducted: amount,
  };
}

/**
 * ===============================
 * 💰 ADD CREDIT (TOPUP / STRIPE)
 * ===============================
 */
export async function addCredit(contractorId, amount, source = "manual") {
  if (!contractorId || amount <= 0) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const { data, error } = await supabase.rpc("add_credit", {
    p_contractor_id: contractorId,
    p_amount: amount,
    p_source: source,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "TOPUP_FAILED",
    };
  }

  return {
    success: true,
    balance: data.balance,
    added: amount,
  };
}

/**
 * ===============================
 * 🔍 OPTIONAL: SAFE BALANCE CHECK BEFORE ROUTING
 * ===============================
 */
export async function canAffordLead(contractorId, leadCost) {
  const balance = await getBalance(contractorId);
  return balance >= leadCost;
}