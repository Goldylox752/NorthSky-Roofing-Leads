import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// ===============================
// ⚙️ CONFIG
// ===============================
const MAX_LOAD_PER_CONTRACTOR = 10;

// ===============================
// 🧠 FETCH CANDIDATES
// ===============================
async function getContractors(city) {
  const { data } = await supabase
    .from("contractors")
    .select("id, city, active, performance_score, response_speed, current_load, failed_jobs")
    .eq("active", true)
    .eq("city", city);

  return data || [];
}

// ===============================
// 📊 SCORE ENGINE (AI DISPATCH CORE)
// ===============================
function scoreContractor(c) {
  const performance = c.performance_score || 5;
  const speed = c.response_speed || 5;

  const loadPenalty = (c.current_load || 0) / MAX_LOAD_PER_CONTRACTOR;
  const failurePenalty = (c.failed_jobs || 0) * 0.5;

  const availabilityBonus =
    c.current_load < MAX_LOAD_PER_CONTRACTOR ? 2 : -5;

  return (
    performance * 2 +
    speed +
    availabilityBonus -
    loadPenalty * 5 -
    failurePenalty
  );
}

// ===============================
// 🎯 SELECT BEST CONTRACTOR
// ===============================
function pickBest(contractors) {
  if (!contractors.length) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const c of contractors) {
    const score = scoreContractor(c);

    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}

// ===============================
// 🔁 UPDATE LOAD (REAL-TIME TRACKING)
// ===============================
async function incrementLoad(contractorId) {
  await supabase.rpc("increment_contractor_load", {
    contractor_id: contractorId,
  });
}

// ===============================
// 🚀 MAIN DISPATCH FUNCTION
// ===============================
export async function dispatchJob(job) {
  const city = job.city || "global";

  // 1. fetch candidates
  const contractors = await getContractors(city);

  if (!contractors.length) {
    return null;
  }

  // 2. pick best
  const best = pickBest(contractors);

  if (!best) return null;

  // 3. assign job atomically
  const { data, error } = await supabase
    .from("jobs")
    .update({
      assigned_to: best.id,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("status", "pending") // race protection
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  // 4. update contractor load
  await incrementLoad(best.id);

  return {
    job: data,
    contractor: best.id,
  };
}