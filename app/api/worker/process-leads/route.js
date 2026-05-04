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

// Unique instance identifier (Render multi-worker safe)
const WORKER_ID =
  process.env.WORKER_ID ||
  `worker_${Math.random().toString(36).slice(2, 8)}`;

// =====================
// PROCESS LEAD
// =====================
async function processLead(lead) {
  if (!lead?.id || !lead?.phone) {
    return { ok: false, id: lead?.id, reason: "Invalid lead" };
  }

  try {
    // 🔒 atomic lock (prevents duplicate processing across workers)
    const locked = await markLeadProcessing(lead.id, WORKER_ID);

    if (!locked) {
      return { ok: false, id: lead.id, reason: "Already locked" };
    }

    // 🤖 AI scoring
    const scored = await aiScoreLead(lead);

    if (!scored) {
      throw new Error("AI returned empty result");
    }

    // ✅ success commit
    await markLeadDone(lead.id, scored, WORKER_ID);

    return { ok: true, id: lead.id };
  } catch (err) {
    console.error(`[${WORKER_ID}] Lead ${lead.id} failed:`, err.message);

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
// TRUE PARALLEL WORKER (STABLE PIPELINE)
// =====================
async function runWorker(leads) {
  const results = [];
  const queue = [...leads];
  const active = new Map();

  const startNext = async () => {
    if (queue.length === 0) return;

    const lead = queue.shift();

    const promise = processLead(lead)
      .then((res) => {
        results.push(res);
        active.delete(promise);
      })
      .catch((err) => {
        console.error("Worker error:", err.message);
        active.delete(promise);
      });

    active.set(promise, true);
  };

  // fill initial concurrency slots
  const initial = Math.min(CONCURRENCY, queue.length);
  for (let i = 0; i < initial; i++) {
    await startNext();
  }

  // keep pipeline full
  while (queue.length > 0 || active.size > 0) {
    if (active.size < CONCURRENCY && queue.length > 0) {
      await startNext();
    }

    // wait for any worker slot to finish
    if (active.size > 0) {
      await Promise.race(active.keys());
    }
  }

  return results;
}

// =====================
// MAIN ENDPOINT
// =====================
export async function GET() {
  const start = Date.now();

  try {
    const leads = await getQueuedLeads();

    if (!leads?.length) {
      return Response.json({
        ok: true,
        worker: WORKER_ID,
        processed: 0,
        message: "No leads in queue",
      });
    }

    console.log(
      `🚀 [${WORKER_ID}] processing ${leads.length} leads`
    );

    const results = await runWorker(leads);

    const processed = results.filter((r) => r.ok).length;
    const failed = results.length - processed;

    const duration = Date.now() - start;

    console.log(
      `✅ [${WORKER_ID}] complete: ${processed} success / ${failed} failed (${duration}ms)`
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
        error: "Worker crash",
      },
      { status: 500 }
    );
  }
}