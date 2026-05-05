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
const BATCH_SIZE = 20;

// Worker identity (multi-instance safe)
const WORKER_ID =
  process.env.WORKER_ID ||
  `worker_${Math.random().toString(36).slice(2, 8)}`;

// =====================
// PROCESS SINGLE LEAD
// =====================
async function processLead(lead) {
  if (!lead?.id) {
    return { ok: false, id: lead?.id, reason: "Invalid lead" };
  }

  try {
    // 🔒 HARD ATOMIC LOCK (CRITICAL)
    const locked = await markLeadProcessing(lead.id, WORKER_ID);

    if (!locked) {
      return { ok: false, id: lead.id, reason: "Already claimed" };
    }

    // 🤖 AI PROCESSING
    const scored = await aiScoreLead(lead);

    if (!scored) {
      throw new Error("AI failed to score lead");
    }

    // ✅ COMMIT SUCCESS
    await markLeadDone(lead.id, scored, WORKER_ID);

    return { ok: true, id: lead.id };
  } catch (err) {
    console.error(`[${WORKER_ID}] failed lead ${lead.id}`, err.message);

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
// SAFE CONCURRENT WORKER
// =====================
async function runWorker(leads) {
  const results = [];

  // simple pointer-based concurrency (more stable than Promise race map)
  let index = 0;

  async function worker() {
    while (index < leads.length) {
      const current = leads[index++];

      if (!current) break;

      const res = await processLead(current);
      results.push(res);
    }
  }

  // spawn fixed workers
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, leads.length) },
    () => worker()
  );

  await Promise.all(workers);

  return results;
}

// =====================
// MAIN ENTRY (CRON)
// =====================
export async function GET() {
  const start = Date.now();

  try {
    // 🧠 batch fetch (prevents memory spike)
    const leads = await getQueuedLeads(BATCH_SIZE);

    if (!leads?.length) {
      return Response.json({
        ok: true,
        worker: WORKER_ID,
        processed: 0,
        message: "No queued leads",
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
      `✅ [${WORKER_ID}] done: ${processed}/${leads.length} (${duration}ms)`
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
    console.error(`❌ Worker crash:`, err);

    return Response.json(
      {
        ok: false,
        worker: WORKER_ID,
        error: "Worker failure",
      },
      { status: 500 }
    );
  }
}