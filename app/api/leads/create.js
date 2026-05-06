import { supabase } from "@/lib/supabase";
import { calculatePrice } from "@/lib/pricingEngine";
import { routeLead } from "@/lib/routingEngine";

// ===============================
// HELPERS
// ===============================
function buildDedupeKey(email, phone, city) {
  const identity = email || phone;
  return `${identity}:${city?.toLowerCase().trim() || "global"}`;
}

function safeScore(email, phone, city) {
  return Math.min(
    10,
    5 +
      (email ? 1 : 0) +
      (phone ? 2 : 0) +
      (city ? 1 : 0)
  );
}

// ===============================
// MAIN
// ===============================
export async function POST(req) {
  const start = Date.now();

  try {
    const body = await req.json();
    const { email, phone, name, city, source } = body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!email && !phone) {
      return Response.json(
        { error: "Email or phone required" },
        { status: 400 }
      );
    }

    const dedupeKey = buildDedupeKey(email, phone, city);
    const score = safeScore(email, phone, city);

    // ===============================
    // 1. STRONG IDEMPOTENCY (RACE SAFE)
    // ===============================
    const { data: existing } = await supabase
      .from("leads")
      .select("id, status, assigned_contractor_id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existing) {
      return Response.json({
        success: true,
        duplicate: true,
        lead: existing,
      });
    }

    // ===============================
    // 2. PRE-CALCULATE PRICE (IMPORTANT FIX)
    // ===============================
    const tempPrice = calculatePrice(score, "basic");

    // ===============================
    // 3. CREATE LEAD (ATOMIC INSERT)
    // ===============================
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        email,
        phone,
        name,
        city: city || "unknown",
        source: source || "direct",
        dedupe_key: dedupeKey,

        score,
        price: tempPrice,

        status: "new",

        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !lead) {
      return Response.json(
        { error: "Lead creation failed" },
        { status: 500 }
      );
    }

    // ===============================
    // 4. ROUTING (WITH FALLBACK)
    // ===============================
    let assignment = null;

    try {
      assignment = await routeLead(lead);
    } catch (err) {
      console.error("Routing error:", err);
    }

    // ===============================
    // 5. NO CONTRACTOR CASE (SAFE EXIT)
    // ===============================
    if (!assignment?.contractorId) {
      await supabase.from("events").insert({
        lead_id: lead.id,
        type: "unassigned",
        payload: {
          reason: "no_contractor_available",
        },
      });

      return Response.json({
        success: true,
        routed: false,
        lead,
      });
    }

    // ===============================
    // 6. FINAL PRICE (AFTER ROUTING)
    // ===============================
    const finalPrice = calculatePrice(
      score,
      assignment.cityTier || "basic"
    );

    // ===============================
    // 7. ATOMIC ASSIGNMENT (RACE SAFE)
    // ===============================
    const { data: claimed } = await supabase
      .from("leads")
      .update({
        status: "assigned",

        assigned_contractor_id: assignment.contractorId,

        lock_owner: assignment.contractorId,
        locked_at: new Date().toISOString(),

        price: finalPrice,
      })
      .eq("id", lead.id)
      .eq("status", "new") // CRITICAL RACE GUARD
      .select()
      .maybeSingle();

    if (!claimed) {
      return Response.json(
        {
          error: "LEAD_ALREADY_CLAIMED",
        },
        { status: 409 }
      );
    }

    // ===============================
    // 8. EVENT LOG (NON-BLOCKING)
    // ===============================
    supabase.from("events").insert({
      lead_id: lead.id,
      type: "assigned",
      payload: {
        contractorId: assignment.contractorId,
        price: finalPrice,
        score,
      },
    }).catch(() => {});

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      routed: true,
      lead: claimed,
      assignment,
      latency_ms: Date.now() - start,
    });

  } catch (err) {
    console.error("🔥 Lead engine crash:", err);

    return Response.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}