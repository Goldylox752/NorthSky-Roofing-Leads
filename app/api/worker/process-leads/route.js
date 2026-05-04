import { getQueuedLeads } from "@/lib/queueLead";
import { aiScoreLead } from "@/lib/aiScoreLead";

// =====================
// AI QUEUE WORKER
// =====================
export async function GET() {
  try {
    const leads = await getQueuedLeads();

    if (!leads || leads.length === 0) {
      return Response.json({
        ok: true,
        message: "No leads in queue",
        processed: 0,
      });
    }

    const results = [];

    // =====================
    // PROCESS LEADS SAFELY
    // =====================
    for (const lead of leads) {
      if (!lead) continue;

      try {
        const scoredLead = await aiScoreLead(lead);

        if (scoredLead) {
          results.push(scoredLead);
        }
      } catch (err) {
        console.error(
          `AI scoring failed for lead ${lead?.id || "unknown"}:`,
          err.message
        );
      }
    }

    return Response.json({
      ok: true,
      processed: results.length,
      total: leads.length,
    });
  } catch (err) {
    console.error("AI worker crash:", err);

    return Response.json(
      {
        ok: false,
        error: "AI worker failed",
      },
      { status: 500 }
    );
  }
}