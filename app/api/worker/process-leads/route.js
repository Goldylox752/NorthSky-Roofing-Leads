import {
  markLeadProcessing,
  markLeadDone,
  markLeadFailed,
} from "@/lib/queueLead";

import { aiScoreLead } from "@/lib/aiScoreLead";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// =====================
// CONFIG (ADAPTIVE READY)
// =====================
const BASE_CONCURRENCY = 5;
const MAX_RETRIES = 3;
const BATCH_SIZE = 20;

const WORKER_ID =
  process.env.WORKER_ID ||
  `worker_${Math.random().toString(36).slice(2, 10)}`;

// =====================
// 🧠 ADAPTIVE CONCURRENCY
// =====================
async function getAdaptiveConcurrency() {
  const { data } = await supabase
    .from("lead_queue_metrics")
    .select("queue_depth, failed_rate")
    .single();

  const depth = data?.queue_depth || 0;
  const failedRate = data?.failed_rate || 0;

  if (depth > 200 && failedRate < 0.1) return 12;
  if (depth > 100) return 8;
  if (depth < 20) return 3;

  return BASE_CONCURRENCY;
}

// =====================
// 💀 POISON LEAD DETECTION
// =====================
function isPoisonLead(lead) {
  return (
    lead.attempts >= MAX_RETRIES ||
    lead.status === "permanently_failed"
  );
}

// =====================
// 🔐 ATOMIC CLAIM (STILL SOURCE OF TRUTH)
// =====================
async function claimLeads() {
  const { data, error } = await supabase.rpc("claim_leads", {
    worker_id: WORKER_ID,
    batch_size: BATCH_SIZE,
  });

  if (error) {
    console.error("Claim error:", error.message);
    return [];
  }

  return data || [];
}

// =====================
// 📡 HEARTBEAT (DETECT STUCK WORKERS)
// =====================
async function heartbeat(count = 0) {
  await supabase.from("worker_heartbeats").upsert({
    worker_id: WORKER_ID,
    last_seen: new Date().toISOString(),
    processed_count: count,
  });
}

// =====================
// PROCESS LEAD (HARDENED)
// =====================
async function processLead(lead) {
  if (!lead?.id) {
    return { ok: false, id: lead?.id, reason: "invalid" };
  }

  if (isPoisonLead(lead)) {
    await markLeadFailed(
      lead.id,
      "poison_lead",
      MAX_RETRIES,
      WORKER_ID
    );

    return { ok: false, id: lead.id, reason: "poison" };
  }

  try {
    const locked = await markLeadProcessing(lead.id, WORKER_ID);

    if (!locked) {
      return { ok: false, id: lead.id, reason: "locked" };
    }

    // 🤖 AI SCORING (MAIN INTELLIGENCE LAYER)
    const scored = await aiScoreLead(lead);

    if (!scored) {
      throw new Error("AI scoring failed");
    }

    await markLeadDone(lead.id, scored, WORKER_ID);

    return { ok: true, id: lead.id };
  } catch (err) {
    console.error(`[${WORKER_ID}] fail`, lead.id, err.message);

    await markLeadFailed(
      lead.id,
      err.message,
      MAX_RETRIES,
      WORKER_ID
    );

    return { ok: false, id: lead.id };
  }
}

// =====================
// ⚡ PARALLEL WORK ENGINE
// =====================
async function runWorker(leads, concurrency) {
  let index = 0;
  const results = [];

  async function worker() {
    while (true) {
      const i = index++;
      if (i >= leads.length) break;

      const res = await processLead(leads[i]);
      results.push(res);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, leads.length) },
    () => worker()
  );

  await Promise.all(workers);

  return results;
}

// =====================
// 📊 QUEUE METRICS UPDATE
// =====================
async function updateMetrics(results) {
  const total = results.length;
  const failed = results.filter((r) => !r.ok).length;

  await supabase.from("worker_metrics").insert({
    worker_id: WORKER_ID,
    total,
    failed,
    success: total - failed,
    created_at: new Date().toISOString(),
  });
}

// =====================
// MAIN ENTRY
// =====================
export async function GET() {
  const start = Date.now();

  try {
    const concurrency = await getAdaptiveConcurrency();

    const leads = await claimLeads();

    if (!leads.length) {
      await heartbeat(0);

      return Response.json({
        ok: true,
        worker: WORKER_ID,
        processed: 0,
        concurrency,
      });
    }

    console.log(
      `🚀 ${WORKER_ID} claimed ${leads.length} leads (concurrency=${concurrency})`
    );

    const results = await runWorker(leads, concurrency);

    await updateMetrics(results);
    await heartbeat(results.length);

    const processed = results.filter((r) => r.ok).length;
    const failed = results.length - processed;

    const duration = Date.now() - start;

    console.log(
      `✅ ${WORKER_ID} done ${processed}/${leads.length} in ${duration}ms`
    );

    return Response.json({
      ok: true,
      worker: WORKER_ID,
      total: leads.length,
      processed,
      failed,
      concurrency,
      duration_ms: duration,
    });
  } catch (err) {
    console.error("❌ worker crash:", err);

    return Response.json(
      {
        ok: false,
        worker: WORKER_ID,
        error: "worker_failed",
      },
      { status: 500 }
    );
  }
}