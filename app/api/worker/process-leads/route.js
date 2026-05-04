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

// =====================
// SAFE PROCESSOR
// =====================
async function processLead(lead) {
  if (!lead?.id || !lead?.phone) {
    return { ok: false, reason: "Invalid lead" };
  }

  try {
    // 🔒 Try lock (prevents double processing race)
    const locked = await markLeadProcessing(lead.id);

    if (!locked) {
      return { ok: false, reason: "Already processing" };
    }

    // 🤖 AI SCORING
    const scored = await aiScoreLead(lead);

    if (!scored) {
      throw new Error("AI returned empty result");
    }

    // ✅ COMPLETE
    await markLeadDone(lead.id, scored);

    return { ok: true, id: lead.id };
  } catch (err) {
    console.error(`Lead ${lead.id} error:`, err.message);

    // 🔁 retry-aware failure handling
    await markLeadFailed(lead.id, err.message, MAX_RETRIES);

    return { ok: false, id: lead.id };
  }
}

// =====================
// CONTROLLED CONCURRENCY RUNNER
// =====================
async function runWorker(leads) {
  const results = [];

  for (let i = 0; i < leads.length; i += CONCURRENCY) {
    const batch = leads.slice(i, i + CONCURRENCY);

    const batchResults = await Promise.allSettled(
      batch.map((lead) => processLead(lead))
    );

    for (const r of batchResults) {
      results.push(r.status === "fulfilled" ? r.value : { ok: false });
    }

    console.log(
      `⚙️ Processed batch ${i / CONCURRENCY + 1} / ${Math.ceil(
        leads.length / CONCURRENCY
      )}`
    );
  }

  return results;
}

// =====================
// AI QUEUE WORKER
// =====================
export async function GET() {
  const start = Date.now();

  try {
    const leads = await getQueuedLeads();

    if (!leads?.length) {
      return Response.json({
        ok: true,
        message: "No leads in queue",
        processed: 0,
      });
    }

    console.log(`🚀 Worker started: ${leads.length} leads`);

    const results = await runWorker(leads);

    const processed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    const duration = Date.now() - start;

    console.log(
      `✅ Worker complete: ${processed} success / ${failed} failed in ${duration}ms`
    );

    return Response.json({
      ok: true,
      total: leads.length,
      processed,
      failed,
      duration_ms: duration,
    });
  } catch (err) {
    console.error("❌ AI worker crash:", err);

    return Response.json(
      {
        ok: false,
        error: "AI worker failed",
      },
      { status: 500 }
    );
  }
}