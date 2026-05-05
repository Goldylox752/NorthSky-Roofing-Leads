import {
  markLeadProcessing,
  markLeadDone,
  markLeadFailed,
} from "@/lib/queueLead";

import { aiScoreLead } from "@/lib/aiScoreLead";
import { supabase } from "@/lib/supabase";

// =====================
// CONFIG
// =====================
const CONCURRENCY = 5;
const MAX_RETRIES = 3;
const BATCH_SIZE = 20;

const WORKER_ID =
  process.env.WORKER_ID ||
  `worker_${Math.random().toString(36).slice(2, 8)}`;

// =====================
// 🔐 ATOMIC CLAIM (CRITICAL FIX)
// =====================
// This replaces getQueuedLeads completely
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
// PROCESS LEAD
// =====================
async function processLead(lead) {
  if (!lead?.id) {
    return { ok: false, id: lead?.id, reason: "Invalid lead" };
  }

  try {
    // already locked by RPC, but double-safe guard
    const locked = await markLeadProcessing(lead.id, WORKER_ID);

    if (!locked) {
      return { ok: false, id: lead.id, reason: "Already claimed" };
    }

    // 🤖 AI SCORING
    const scored = await aiScoreLead(lead);

    if (!scored) {
      throw new Error("AI failed scoring");
    }

    // ✅ COMMIT SUCCESS
    await markLeadDone(lead.id, scored, WORKER_ID);

    return { ok: true, id: lead.id };
  } catch (err) {
    console.error(`[${WORKER_ID}] lead failed`, lead.id, err.message);

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
// SAFE PARALLEL EXECUTION
// =====================
async function runWorker(leads) {
  const results = [];
  let index = 0;

  async function worker() {
    while (true) {
      const i = index++;
      if (i >= leads.length) break;

      const lead = leads[i];
      const res = await processLead(lead);

      results.push(res);
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, leads.length) },
    () => worker()
  );

  await Promise.all(workers);

  return results;
}

// =====================
// MAIN ENTRY
// =====================
export async function GET() {
  const start = Date.now();

  try {
    // 🔥 ATOMIC CLAIM (NO RACE CONDITIONS EVER)
    const leads = await claimLeads();

    if (!leads.length) {
      return Response.json({
        ok: true,
        worker: WORKER_ID,
        processed: 0,
        message: "No queued leads",
      });
    }

    console.log(
      `🚀 [${WORKER_ID}] claimed ${leads.length} leads`
    );

    const results = await runWorker(leads);

    const processed = results.filter((r) => r.ok).length;
    const failed = results.length - processed;

    const duration = Date.now() - start;

    console.log(
      `✅ [${WORKER_ID}] done ${processed}/${leads.length} (${duration}ms)`
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
    console.error("❌ Worker crash:", err);

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