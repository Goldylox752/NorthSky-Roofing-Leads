import { calculateLeadValue } from "@/lib/pricingEngine";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// 🔐 HELPERS
// ===============================
function normalizePhone(phone = "") {
  return phone.replace(/\D/g, ""); // strip non-numbers
}

function hashIdentity(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// ===============================
// 🚫 SIMPLE RATE LIMIT (PER IP)
// ===============================
async function rateLimit(ip) {
  const windowMs = 60 * 1000; // 1 min
  const max = 30;

  const key = `${ip}:${Math.floor(Date.now() / windowMs)}`;

  const { error } = await supabase
    .from("rate_limits")
    .insert({
      id: key,
      ip,
      created_at: new Date().toISOString(),
    });

  // if insert fails → duplicate key → over limit
  return !error || error.code !== "23505";
}

// ===============================
// 🔁 IDEMPOTENCY (PREVENT DUPES)
// ===============================
async function checkDuplicate(identityHash) {
  const { data } = await supabase
    .from("leads")
    .select("id")
    .eq("identity_hash", identityHash)
    .maybeSingle();

  return !!data;
}

// ===============================
// MAIN
// ===============================
export async function POST(req) {
  try {
    const body = await req.json();

    let { phone, score = 5, cityTier = "basic" } = body;

    // ===============================
    // 🔐 IP EXTRACTION
    // ===============================
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";

    // ===============================
    // 🚫 RATE LIMIT
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
    // IDEMPOTENCY
    // ===============================
    const identityHash = hashIdentity(phone);

    const isDuplicate = await checkDuplicate(identityHash);

    if (isDuplicate) {
      return Response.json({
        success: true,
        duplicate: true,
      });
    }

    // ===============================
    // VALUE CALCULATION
    // ===============================
    const leadValue = calculateLeadValue(score, cityTier);

    // ===============================
    // OPTIONAL: STORE LIGHTWEIGHT LEAD (PRE-QUEUE)
    // ===============================
    await supabase.from("leads").insert({
      phone,
      identity_hash: identityHash,
      score,
      city_tier: cityTier,
      status: "new",
      created_at: new Date().toISOString(),
    });

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      leadValue,
      tier: cityTier,
    });

  } catch (err) {
    console.error("❌ Lead intake error:", err);

    return Response.json(
      { error: "Lead engine error" },
      { status: 500 }
    );
  }
}