import { createClient } from "@supabase/supabase-js";
import { assignLead } from "../../engine/assignLead";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, city, org_id, source = "web" } = req.body;

    if (!name || !phone || !org_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // =========================
    // 1. DUPLICATE CHECK
    // =========================
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .eq("org_id", org_id)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Lead already exists",
        lead_id: existing.id
      });
    }

    // =========================
    // 2. CREATE LEAD
    // =========================
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        name,
        phone,
        city,
        org_id,
        source,
        status: "new",
        score: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (leadError) {
      console.error(leadError);
      return res.status(500).json({ error: "Lead creation failed" });
    }

    // =========================
    // 3. ASSIGNMENT ENGINE (SAFE)
    // =========================
    let assignment = null;

    try {
      assignment = await assignLead({
        lead,
        org_id,
        supabase
      });

    } catch (err) {
      console.error("Assignment failed:", err);

      // fallback state (IMPORTANT)
      await supabase.from("leads").update({
        status: "unassigned"
      }).eq("id", lead.id);
    }

    // =========================
    // 4. SAVE ASSIGNMENT
    // =========================
    if (assignment?.agent_id) {
      await supabase.from("assignments").insert({
        lead_id: lead.id,
        agent_id: assignment.agent_id,
        org_id,
        status: "active",
        created_at: new Date().toISOString()
      });
    }

    // =========================
    // 5. REALTIME EVENT
    // =========================
    await supabase.from("events").insert({
      type: "lead_assigned",
      org_id,
      payload: {
        lead,
        assignment
      }
    });

    return res.status(200).json({
      success: true,
      lead,
      assigned_to: assignment?.agent_name || null
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}