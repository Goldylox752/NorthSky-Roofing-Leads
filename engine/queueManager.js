import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* =========================
   MAIN QUEUE LOOP
========================= */
export async function processQueue(org_id) {
  try {
    // 1. GET ROUTING RULES
    const { data: rules } = await supabase
      .from("routing_rules")
      .select("*")
      .eq("org_id", org_id)
      .maybeSingle();

    const routing = rules || {
      mode: "round_robin",
      max_queue_size: 100,
      priority_boost_enabled: true
    };

    // 2. FETCH QUEUED LEADS
    const { data: queue } = await supabase
      .from("lead_queue")
      .select("*")
      .eq("org_id", org_id)
      .eq("status", "queued")
      .order("priority", { ascending: false })
      .limit(20);

    if (!queue || queue.length === 0) return;

    // 3. GET AVAILABLE AGENTS
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .eq("org_id", org_id)
      .eq("status", "online");

    if (!agents || agents.length === 0) return;

    // 4. PROCESS EACH LEAD
    for (const leadItem of queue) {
      const agent = pickAgent(agents, routing);

      if (!agent) break;

      // capacity check
      if (agent.active_leads >= agent.capacity) continue;

      // 5. ASSIGN LEAD
      await assignLeadToAgent({
        leadItem,
        agent,
        org_id,
        routing
      });
    }

  } catch (err) {
    console.error("QUEUE ERROR:", err);
  }
}

/* =========================
   AGENT SELECTION ENGINE
========================= */
function pickAgent(agents, routing) {
  switch (routing.mode) {

    /* ROUND ROBIN */
    case "round_robin":
      return agents.sort(
        (a, b) => a.active_leads - b.active_leads
      )[0];

    /* PRIORITY / WEIGHTED */
    case "weighted":
      return agents.sort(
        (a, b) =>
          (a.capacity - a.active_leads) -
          (b.capacity - b.active_leads)
      )[0];

    /* AI READY HOOK */
    case "ai_priority":
      return agents.sort(
        (a, b) =>
          (b.capacity - b.active_leads) -
          (a.capacity - a.active_leads)
      )[0];

    default:
      return agents[0];
  }
}

/* =========================
   CORE ASSIGNMENT LOGIC
========================= */
async function assignLeadToAgent({
  leadItem,
  agent,
  org_id,
  routing
}) {
  try {
    // 1. MARK LEAD AS ASSIGNED
    await supabase
      .from("lead_queue")
      .update({
        status: "assigned",
        assigned_agent_id: agent.id
      })
      .eq("id", leadItem.id);

    // 2. UPDATE AGENT LOAD
    await supabase
      .from("agents")
      .update({
        active_leads: agent.active_leads + 1
      })
      .eq("id", agent.id);

    // 3. SAVE ASSIGNMENT HISTORY
    await supabase.from("assignment_history").insert({
      org_id,
      lead_id: leadItem.lead_id,
      agent_id: agent.id,
      method: routing.mode || "round_robin",
      assigned_at: new Date().toISOString()
    });

    // 4. REALTIME EVENT (FOR DASHBOARD)
    await supabase.from("events").insert({
      type: "lead_assigned",
      org_id,
      payload: {
        lead_id: leadItem.lead_id,
        agent_id: agent.id
      }
    });

    console.log(
      `✅ Assigned lead ${leadItem.lead_id} → ${agent.name}`
    );

  } catch (err) {
    console.error("ASSIGNMENT ERROR:", err);
  }
}