import {
  getQueuedLeads,
  markLeadProcessing,
  markLeadDone,
  markLeadFailed,
} from "@/lib/queueLead";

import { aiScoreLead } from "@/lib/aiScoreLead";

// =====================
// CONFIG
// =====================
const CONCURRENCY = 5;
const MAX_RETRIES = 3;

// 👇 IMPORTANT: unique worker ID (helps debugging multi-render instances)
const WORKER_ID = `worker_${Math.random().toString(36).slice(2, 8)}`;

// =====================
// SAFE PROCESSOR
// =====================
async function processLead(lead) {
  if (!lead?.id || !lead?.phone) {
    return { ok: false, reason: "Invalid lead" };
  }

  try {
    // 🔒 atomic lock (critical for multi-worker scaling)
    const locked = await markLeadProcessing(lead.id, WORKER_ID);

    if (!locked) {
      return { ok: false, reason: "Already locked by another worker" };
    }

    // 🤖 AI SCORING
    const scored = await aiScoreLead(lead);

    if (!scored) {
      throw new Error("AI returned empty result");
    }

    // ✅ SUCCESS
    await markLeadDone(lead.id, scored, WORKER_ID);

    return { ok: true, id: lead.id };
  } catch (err) {
    console.error(`[${WORKER_ID}] Lead ${lead.id} error:`, err.message);

    await markLeadFailed(lead.id, err.message, MAX_RETRIES, WORKER_ID);

    return { ok: false, id: lead.id };
  }
}

// =====================
// PARALLEL WORK EXECUTOR
// (no batch blocking anymore)
// =====================
async function runWorker(leads) {
  const results = [];

  const queue = [...leads];
  const active = new Set();

  function runNext() {
    if (queue.length === 0) return null;

    const lead = queue.shift();
    const p = processLead(lead)
      .then((res) => {
        results.push(res);
        active.delete(p);
      })
      .catch((err) => {
        console.error("Unexpected worker error:", err);
        active.delete(p);
      });

    active.add(p);

    return p;
  }

  // initial fill
  for (let i = 0; i < CONCURRENCY; i++) {
    runNext();
  }

  // keep pipeline full
  while (queue.length > 0 || active.size > 0) {
    if (active.size < CONCURRENCY && queue.length > 0) {
      runNext();
    }

    await Promise.race(active);
  }

  return results;
}

// =====================
// AI QUEUE WORKER ENDPOINT
// =====================
export async function GET() {
  const start = Date.now();

  try {
    const leads = await getQueuedLeads();

    if (!leads?.length) {
      return Response.json({
        ok: true,
        worker: WORKER_ID,
        message: "No leads in queue",
        processed: 0,
      });
    }

    console.log(`🚀 [${WORKER_ID}] started with ${leads.length} leads`);

    const results = await runWorker(leads);

    const processed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    const duration = Date.now() - start;

    console.log(
      `✅ [${WORKER_ID}] done: ${processed} success / ${failed} failed in ${duration}ms`
    );

    return Response.json({
      ok: true,
      worker: WORKER_ID,
      total: leads.length,
      processed,
      failed,
      duration_ms: duration,
    });
  } catch (err) {
    console.error(`❌ [${WORKER_ID}] crash:`, err);

    return Response.json(
      {
        ok: false,
        worker: WORKER_ID,
        error: "AI worker failed",
      },
      { status: 500 }
    );
  }
}