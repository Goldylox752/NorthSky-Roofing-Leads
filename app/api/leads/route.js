import { calculateLeadValue } from "@/lib/pricingEngine";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { z } from "zod";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// VALIDATION SCHEMA
// ===============================
const LeadSchema = z.object({
  phone: z.string().min(10),
  score: z.number().min(1).max(10).optional(),
  cityTier: z.string().optional(),
  city: z.string().optional(),
});

// ===============================
// HELPERS
// ===============================
const normalizePhone = (p = "") => p.replace(/\D/g, "");

const hash = (v) =>
  crypto.createHash("sha256").update(v).digest("hex");

const getIP = (req) => {
  const xf = req.headers.get("x-forwarded-for");
  return xf ? xf.split(",")[0].trim() : "unknown";
};

const getFingerprint = (req, body) => {
  const ua = req.headers.get("user-agent") || "";
  return hash(`${ua}:${JSON.stringify(body)}`);
};

// ===============================
// 🔐 ATOMIC RATE LIMIT (FIXED)
// ===============================
async function rateLimitAtomic(ip, fingerprint) {
  const bucket = Math.floor(Date.now() / 60000);
  const id = `${ip}:${fingerprint}:${bucket}`;

  const { data, error } = await supabase
    .from("rate_limits")
    .upsert(
      {
        id,
        ip,
        fingerprint,
        count: 1,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) return { allowed: false };

  // 🔥 SINGLE QUERY increment (no race)
  const { data: updated } = await supabase.rpc("increment_rate_limit", {
    row_id: id,
  });

  return {
    allowed: updated <= 30,
    count: updated,
  };
}

// ===============================
// 🧠 RISK ENGINE (OPTIMIZED)
// ===============================
async function getRiskScore(ip, fingerprint) {
  const { count } =
    (await supabase.rpc("get_attempt_count", {
      ip_input: ip,
      fingerprint_input: fingerprint,
    })) || { count: 0 };

  if (count > 80) return 10;
  if (count > 40) return 7;
  if (count > 20) return 4;
  return 1;
}

// ===============================
// MAIN HANDLER
// ===============================
export async function POST(req) {
  const start = Date.now();

  try {
    const body = await req.json();

    // ===============================
    // VALIDATION
    // ===============================
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      );
    }

    let { phone, score = 5, cityTier = "basic", city } = parsed.data;

    phone = normalizePhone(phone);

    const ip = getIP(req);
    const fingerprint = getFingerprint(req, body);

    const idempotencyKey = hash(`${phone}:${JSON.stringify(body)}`);

    // ===============================
    // RATE LIMIT
    // ===============================
    const rl = await rateLimitAtomic(ip, fingerprint);

    if (!rl.allowed) {
      return Response.json(
        { error: "Rate limited" },
        { status: 429 }
      );
    }

    // ===============================
    // RISK ENGINE
    // ===============================
    const risk = await getRiskScore(ip, fingerprint);

    if (risk >= 9) {
      return Response.json(
        { error: "Bot detected" },
        { status: 403 }
      );
    }

    // ===============================
    // VALUE CALCULATION
    // ===============================
    const leadValue = calculateLeadValue(score, cityTier);

    // ===============================
    // INSERT LEAD (IDEMPOTENT)
    // ===============================
    const { data: lead, error } = await supabase
      .from("leads")
      .upsert(
        {
          phone,
          idempotency_key: idempotencyKey,
          fingerprint,
          ip,
          risk_score: risk,
          score,
          city,
          city_tier: cityTier,
          status: "queued",
          source: "api",
        },
        {
          onConflict: "idempotency_key",
        }
      )
      .select()
      .single();

    if (error) throw error;

    // ===============================
    // QUEUE INSERT (SAFE)
    // ===============================
    const { error: queueError } = await supabase
      .from("lead_queue")
      .upsert(
        {
          lead_id: lead.id,
          status: "pending",
          attempts: 0,
          risk_score: risk,
        },
        {
          onConflict: "lead_id",
        }
      );

    if (queueError) {
      console.error("Queue error:", queueError);
    }

    return Response.json({
      success: true,
      leadId: lead.id,
      leadValue,
      risk_score: risk,
      latency_ms: Date.now() - start,
    });

  } catch (err) {
    console.error("❌ Lead intake crash:", err);

    return Response.json(
      {
        error: "Internal error",
        latency_ms: Date.now() - start,
      },
      { status: 500 }
    );
  }
}