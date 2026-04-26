import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/sendSMS";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const now = new Date();

    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "active");

    if (error || !leads) {
      return Response.json({ ok: false, error: "No leads found" });
    }

    const updates = [];

    for (const lead of leads) {
      const created = new Date(lead.created_at);
      const days = Math.floor(
        (now - created) / (1000 * 60 * 60 * 24)
      );

      // =========================
      // DAY 1 FOLLOW-UP
      // =========================
      if (days === 1 && lead.stage !== "day1") {
        await sendSMS(
          lead.phone,
          "RoofFlow reminder: spots are filling fast this week. Book your onboarding."
        );

        updates.push(
          supabase
            .from("leads")
            .update({ stage: "day1" })
            .eq("id", lead.id)
        );
      }

      // =========================
      // DAY 3 URGENCY
      // =========================
      if (days === 3 && lead.stage !== "day3") {
        await sendSMS(
          lead.phone,
          "Final reminder: we may close your territory soon. Book now: https://calendly.com/yourlink"
        );

        updates.push(
          supabase
            .from("leads")
            .update({ stage: "day3" })
            .eq("id", lead.id)
        );
      }
    }

    // execute updates safely
    await Promise.all(updates);

    return Response.json({
      ok: true,
      processed: leads.length,
    });

  } catch (err) {
    return Response.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}