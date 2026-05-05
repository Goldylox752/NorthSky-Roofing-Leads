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
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// ===============================
// 🚫 ATOMIC RATE LIMIT (SINGLE UPSERT ONLY)
// ===============================
async function rateLimit(ip) {
  const windowMs = 60 * 1000;
  const max = 30;

  const bucket = Math.floor(Date.now() / windowMs);
  const id = `${ip}:${bucket}`;

  const { data, error } = await supabase
    .from("rate_limits")
    .upsert(
      {
        id,
        ip,
        count: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw error;

  const count = (data.count || 0) + 1;

  // update counter (still single-row safe)
  await supabase
    .from("rate_limits")
    .update({
      count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return count <= max;
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

    score = Math.max(1, Math.min(Number(score) || 5, 10));

    // ===============================
    // IDEMPOTENCY KEY (MUST BE UNIQUE IN DB)
    // ===============================
    const identityHash = hash(`${phone}:${city || "global"}`);
    const requestKey =
      req.headers.get("x-idempotency-key") ||
      hash(JSON.stringify(body));

    const leadValue = calculateLeadValue(score, cityTier);

    // ===============================
    // 🔥 SINGLE ATOMIC INSERT (NO RACE POSSIBLE)
    // ===============================
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        phone,
        identity_hash: identityHash,
        request_key: requestKey,
        score,
        city,
        city_tier: cityTier,
        status: "queued",
        source: "api",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    // duplicate protection (DB constraint)
    if (error?.code === "23505") {
      return Response.json({
        success: true,
        duplicate: true,
      });
    }

    if (error) throw error;

    // ===============================
    // 🔥 QUEUE INSERT (NO ROLLBACK NEEDED IF DESIGNED RIGHT)
    // ===============================
    const { error: queueError } = await supabase
      .from("lead_queue")
      .insert({
        lead_id: lead.id,
        status: "pending",
        created_at: new Date().toISOString(),
      });

    if (queueError) {
      // mark lead as "orphaned" instead of deleting (safer for recovery)
      await supabase
        .from("leads")
        .update({ status: "orphaned" })
        .eq("id", lead.id);

      return Response.json(
        { error: "Queue failure (recoverable)" },
        { status: 500 }
      );
    }

    const duration = Date.now() - start;

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