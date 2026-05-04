import { createClient } from "@supabase/supabase-js";

// ===============================
// SUPABASE (SERVER ONLY)
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// LEAD ROUTING ENGINE v2
// ===============================
export async function routeLead(lead) {
  try {
    const city = lead.city?.toLowerCase()?.trim();

    if (!city || !lead?.id) {
      console.log("Invalid lead payload");
      return null;
    }

    // ===============================
    // GET CITY CONFIG (MARKET RULES)
    // ===============================
    const { data: cityRow, error: cityError } = await supabase
      .from("cities")
      .select("*")
      .eq("city", city)
      .single();

    if (cityError || !cityRow) {
      console.log("City not found:", city);
      return null;
    }

    // ===============================
    // GET ACTIVE CONTRACTORS
    // ===============================
    const { data: contractors, error: contractorError } = await supabase
      .from("contractors")
      .select("*")
      .eq("active", true)
      .contains("cities_allowed", [city]);

    if (contractorError) {
      console.error("Contractor fetch error:", contractorError.message);
      return null;
    }

    if (!contractors || contractors.length === 0) {
      console.log("No active contractors in city");
      return null;
    }

    // ===============================
    // ENFORCE CITY EXCLUSIVITY
    // ===============================
    let eligible = contractors;

    if (cityRow.tier === "exclusive") {
      eligible = contractors.slice(0, 1);
    } else if (cityRow.tier === "priority") {
      eligible = contractors.slice(0, 2);
    }

    // ===============================
    // SMART CONTRACTOR SELECTION
    // (least loaded wins)
    // ===============================
    const selected = eligible.sort((a, b) => {
      return (a.active_leads || 0) - (b.active_leads || 0);
    })[0];

    if (!selected) {
      console.log("No eligible contractor found");
      return null;
    }

    // ===============================
    // PRICING ENGINE (REAL MODEL)
    // ===============================
    const basePrice = lead.score >= 8 ? 5000 : lead.score >= 6 ? 3000 : 1500;
    const multiplier = cityRow.lead_multiplier || 1;

    const finalPrice = Math.floor(basePrice * multiplier);

    // ===============================
    // UPDATE LEAD (ASSIGNMENT)
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
      console.error("Lead update error:", updateError.message);
      return null;
    }

    // ===============================
    // UPDATE CONTRACTOR LOAD
    // ===============================
    await supabase
      .from("contractors")
      .update({
        active_leads: (selected.active_leads || 0) + 1,
      })
      .eq("id", selected.id);

    // ===============================
    // REVENUE LOG (AUDIT SYSTEM)
    // ===============================
    await supabase.from("revenue_logs").insert({
      contractor_id: selected.id,
      lead_id: lead.id,
      city,
      amount: finalPrice,
      tier: cityRow.tier,
      created_at: new Date().toISOString(),
    });

    // ===============================
    // MARKETPLACE EVENT LOG
    // ===============================
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      event: "assigned",
      metadata: {
        contractor_id: selected.id,
        price: finalPrice,
        city,
      },
    });

    // ===============================
    // RETURN RESULT
    // ===============================
    return {
      success: true,
      contractorId: selected.id,
      price: finalPrice,
      city,
      tier: cityRow.tier,
    };

  } catch (err) {
    console.error("Routing engine crash:", err.message);
    return null;
  }
}