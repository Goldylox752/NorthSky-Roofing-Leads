import { createClient } from "@supabase/supabase-js";

// ===============================
// SUPABASE (SERVER ONLY)
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// optional plug-in (you add later)
import { chargeContractor } from "@/lib/chargeContractor";

// ===============================
// LEAD ROUTING ENGINE v3
// ===============================
export async function routeLead(lead) {
  try {
    const city = lead.city?.toLowerCase()?.trim();

    if (!city || !lead?.id) {
      return null;
    }

    // ===============================
    // 1. LOCK LEAD (PREVENT DOUBLE ROUTING)
    // ===============================
    const { data: lock } = await supabase
      .from("leads")
      .update({ status: "processing" })
      .eq("id", lead.id)
      .eq("status", "new")
      .select()
      .single();

    if (!lock) {
      console.log("Lead already processed");
      return null;
    }

    // ===============================
    // 2. GET CITY CONFIG
    // ===============================
    const { data: cityRow } = await supabase
      .from("cities")
      .select("*")
      .eq("city", city)
      .single();

    if (!cityRow) return null;

    // ===============================
    // 3. GET ELIGIBLE CONTRACTORS
    // ===============================
    const { data: contractors } = await supabase
      .from("contractors")
      .select("*")
      .eq("active", true)
      .contains("cities_allowed", [city]);

    if (!contractors?.length) {
      await supabase
        .from("leads")
        .update({ status: "unassigned" })
        .eq("id", lead.id);

      return null;
    }

    // ===============================
    // 4. ENFORCE CITY TIER RULES
    // ===============================
    let pool = contractors;

    if (cityRow.tier === "exclusive") {
      pool = contractors.slice(0, 1);
    } else if (cityRow.tier === "priority") {
      pool = contractors.slice(0, 2);
    }

    // ===============================
    // 5. SMART SCORING SELECTION
    // (load + performance weighting)
    // ===============================
    const selected = pool
      .map((c) => ({
        ...c,
        score:
          (c.active_leads || 0) * 1.2 +
          (c.success_rate || 1) * -1,
      }))
      .sort((a, b) => a.score - b.score)[0];

    if (!selected) return null;

    // ===============================
    // 6. PRICING ENGINE
    // ===============================
    const basePrice =
      lead.score >= 8 ? 5000 :
      lead.score >= 6 ? 3000 :
      1500;

    const finalPrice = Math.floor(
      basePrice * (cityRow.lead_multiplier || 1)
    );

    // ===============================
    // 7. ASSIGN LEAD
    // ===============================
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        assigned_contractor_id: selected.id,
        price: finalPrice,
        status: "assigned",
      })
      .eq("id", lead.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // ===============================
    // 8. UPDATE CONTRACTOR LOAD
    // ===============================
    await supabase
      .from("contractors")
      .update({
        active_leads: (selected.active_leads || 0) + 1,
      })
      .eq("id", selected.id);

    // ===============================
    // 9. AUTO BILLING (STRIPE HOOK)
    // ===============================
    let billingResult = null;

    if (selected.stripe_customer_id) {
      billingResult = await chargeContractor({
        contractorId: selected.id,
        leadId: lead.id,
        amount: finalPrice,
        description: `Lead in ${city}`,
      });
    }

    // ===============================
    // 10. REVENUE LOG
    // ===============================
    await supabase.from("revenue_logs").insert({
      contractor_id: selected.id,
      lead_id: lead.id,
      city,
      amount: finalPrice,
      tier: cityRow.tier,
      billed: !!billingResult?.success,
    });

    // ===============================
    // 11. EVENT LOG
    // ===============================
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      event: "assigned_and_billed",
      metadata: {
        contractor_id: selected.id,
        price: finalPrice,
        city,
        billing: billingResult,
      },
    });

    // ===============================
    // RESULT
    // ===============================
    return {
      success: true,
      contractorId: selected.id,
      price: finalPrice,
      billed: !!billingResult?.success,
      city,
      tier: cityRow.tier,
    };

  } catch (err) {
    console.error("Routing engine crash:", err.message);

    await supabase
      .from("leads")
      .update({ status: "error" })
      .eq("id", lead?.id);

    return null;
  }
}