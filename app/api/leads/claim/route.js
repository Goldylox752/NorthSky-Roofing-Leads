import { supabase } from "@/lib/supabase";
import { deductCredit } from "@/lib/wallet";

export async function POST(req) {
  const { leadId, contractorId, price } = await req.json();

  if (!leadId || !contractorId) {
    return Response.json({ error: "Missing data" }, { status: 400 });
  }

  // ===============================
  // STEP 1: CHECK FUNDS
  // ===============================
  const debit = await deductCredit(
    contractorId,
    price,
    leadId
  );

  if (!debit.success) {
    return Response.json(
      { error: debit.error },
      { status: 402 }
    );
  }

  // ===============================
  // STEP 2: CLAIM LEAD (ATOMIC)
  // ===============================
  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "assigned",
      assigned_contractor_id: contractorId,
      locked_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("status", "new")
    .select()
    .single();

  if (error || !data) {
    return Response.json(
      { error: "Lead already claimed" },
      { status: 409 }
    );
  }

  return Response.json({
    success: true,
    lead: data,
  });
}