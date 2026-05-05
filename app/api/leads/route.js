import { calculateLeadValue } from "@/lib/pricingEngine";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// HELPERS
// ===============================
function normalizePhone(phone = "") {
  return phone.replace(/\D/g, "");
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getIP(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ===============================
// 🚫 STRONG RATE LIMIT (COUNT BASED)
// ===============================
async function rateLimit(ip) {
  const windowMs = 60 * 1000;
  const max = 30;

  const now = Date.now();
  const windowStart = new Date(now - windowMs).toISOString();

  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", windowStart);

  if (count >= max) return false;

  await supabase.from("rate_limits").insert({
    ip,
    created_at: new Date().toISOString(),
  });

  return true;
}

// ===============================
// 🔁 ATOMIC IDEMPOTENCY (NO RACE)
// ===============================
async function insertLeadAtomic(payload) {
  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select()
    .single();

  // unique constraint hit = duplicate
  if (error && error.code === "23505") {
    return { duplicate: true };
  }

  if (error) throw error;

  return { lead: data };
}

// ===============================
// MAIN
// ===============================
export async function POST(req) {
  const start = Date.now();

  try {
    const body = await req.json();

    let { phone, score = 5, cityTier = "basic", city } = body;

    const ip = getIP(req);

    // ===============================
    // RATE LIMIT
    // ===============================
    const allowed = await rateLimit(ip);

    if (!allowed) {
      return Response.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // ===============================
    // VALIDATION
    // ===============================
    if (!phone) {
      return Response.json(
        { error: "Missing phone" },
        { status: 400 }
      );
    }

    phone = normalizePhone(phone);

    if (phone.length < 10) {
      return Response.json(
        { error: "Invalid phone" },
        { status: 400 }
      );
    }

    // ===============================
    // SAFE SCORING
    // ===============================
    score = Math.max(1, Math.min(Number(score) || 5, 10));

    // ===============================
    // IDEMPOTENCY KEY (PHONE + CITY)
    // ===============================
    const identityHash = hash(`${phone}:${city || "global"}`);

    // ===============================
    // VALUE CALCULATION
    // ===============================
    const leadValue = calculateLeadValue(score, cityTier);

    // ===============================
    // ATOMIC INSERT (NO DUPES EVER)
    // ===============================
    const result = await insertLeadAtomic({
      phone,
      identity_hash: identityHash,
      score,
      city,
      city_tier: cityTier,
      status: "queued", // 🔥 NOT "new" anymore
      source: "api",
      created_at: new Date().toISOString(),
    });

    if (result.duplicate) {
      return Response.json({
        success: true,
        duplicate: true,
      });
    }

    const lead = result.lead;

    // ===============================
    // QUEUE PUSH (DECOUPLED SYSTEM)
    // ===============================
    await supabase.from("lead_queue").insert({
      lead_id: lead.id,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    const duration = Date.now() - start;

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      leadId: lead.id,
      leadValue,
      duration_ms: duration,
    });

  } catch (err) {
    console.error("❌ Lead intake error:", err);

    return Response.json(
      { error: "Lead engine error" },
      { status: 500 }
    );
  }
}