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
  let score = 5;
  if (email) score += 1;
  if (phone) score += 2;
  if (city) score += 1;
  return Math.min(score, 10);
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
    // 1. HARD IDEMPOTENCY CHECK (DB SOURCE OF TRUTH)
    // ===============================
    const { data: existing } = await supabase
      .from("leads")
      .select("id, status, assigned_contractor_id, price")
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
    // 2. CREATE LEAD (UNASSIGNED STATE ONLY)
    // ===============================
    const { data: lead, error: createError } = await supabase
      .from("leads")
      .insert({
        email,
        phone,
        name,
        city: city || null,
        source: source || "direct",

        dedupe_key: dedupeKey,
        score,

        status: "new",
        price: 0,

        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError || !lead) {
      return Response.json(
        { error: "Lead creation failed" },
        { status: 500 }
      );
    }

    // ===============================
    // 3. ROUTING ENGINE (DECISION LAYER)
    // ===============================
    const assignment = await routeLead(lead);

    if (!assignment?.contractorId) {
      await supabase.from("events").insert({
        lead_id: lead.id,
        type: "unassigned",
        payload: { reason: "no_contractor_available" },
      });

      return Response.json({
        success: true,
        routed: false,
        lead,
      });
    }

    const price = calculatePrice(
      score,
      assignment.cityTier || "basic"
    );

    // ===============================
    // 4. ATOMIC CLAIM (CRITICAL RACE PROTECTION)
    // ===============================
    const { data: claimed, error: claimError } = await supabase
      .from("leads")
      .update({
        status: "assigned",
        assigned_contractor_id: assignment.contractorId,

        lock_owner: assignment.contractorId,
        locked_at: new Date().toISOString(),

        price,
      })
      .eq("id", lead.id)
      .eq("status", "new") // 🔥 prevents double claim
      .select()
      .single();

    if (claimError || !claimed) {
      return Response.json(
        { error: "LEAD_ALREADY_CLAIMED" },
        { status: 409 }
      );
    }

    // ===============================
    // 5. EVENT LOG (NON-BLOCKING)
    // ===============================
    supabase.from("events").insert({
      lead_id: lead.id,
      type: "assigned",
      payload: {
        contractorId: assignment.contractorId,
        price,
        city,
      },
    }).catch(() => {});

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      routed: true,
      lead: claimed,
      assignment: {
        contractorId: assignment.contractorId,
        price,
        city,
      },
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