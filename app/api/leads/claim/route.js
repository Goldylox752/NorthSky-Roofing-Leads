import { supabase } from "@/lib/supabase";
import { deductCredit } from "@/lib/wallet";

export async function POST(req) {
  try {
    const { leadId, contractorId, price } = await req.json();

    if (!leadId || !contractorId || !price) {
      return Response.json(
        { success: false, error: "Missing data" },
        { status: 400 }
      );
    }

    // ===============================
    // STEP 1: ATOMIC CLAIM CHECK FIRST
    // ===============================
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, status")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return Response.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    if (lead.status !== "new") {
      return Response.json(
        { success: false, error: "Already claimed" },
        { status: 409 }
      );
    }

    // ===============================
    // STEP 2: DEDUCT CREDIT (SAFE CHECK)
    // ===============================
    const debit = await deductCredit(
      contractorId,
      price,
      leadId
    );

    if (!debit.success) {
      return Response.json(
        { success: false, error: debit.error },
        { status: 402 }
      );
    }

    // ===============================
    // STEP 3: CLAIM LEAD (FINAL ATOMIC WRITE)
    // ===============================
    const { data: updated, error } = await supabase
      .from("leads")
      .update({
        status: "assigned",
        assigned_contractor_id: contractorId,
        locked_at: new Date().toISOString(),
        lock_owner: contractorId,
        price
      })
      .eq("id", leadId)
      .eq("status", "new") // prevents race condition
      .select()
      .single();

    // ===============================
    // STEP 4: ROLLBACK SAFETY (CRITICAL FIX)
    // ===============================
    if (error || !updated) {
      // refund money automatically
      await supabase
        .from("contractors")
        .update({
          // restore balance (simple rollback pattern)
          wallet_balance: supabase.raw(
            "wallet_balance + ?",
            [price]
          )
        })
        .eq("id", contractorId);

      return Response.json(
        {
          success: false,
          error: "Lead was already taken. Refund issued."
        },
        { status: 409 }
      );
    }

    // ===============================
    // STEP 5: LOG EVENT (AUDIT LAYER)
    // ===============================
    await supabase.from("events").insert({
      lead_id: leadId,
      type: "claimed",
      payload: {
        contractorId,
        price
      }
    });

    return Response.json({
      success: true,
      lead: updated
    });

  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}