<script>
/* ===============================
   ROOF FLOW → DRONE BRIDGE CORE
   =============================== */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabase = null;

/* INIT SUPABASE */
function initSupabase(){
  try {
    if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log("Supabase connected");
    }
  } catch (e) {
    console.log("Supabase init failed");
  }
}
initSupabase();

/* ===============================
   SESSION ID (GLOBAL IDENTITY)
   =============================== */
function getSessionId(){
  let id = localStorage.getItem("session_id");

  if (!id){
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }

  return id;
}

/* ===============================
   UTM CAPTURE
   =============================== */
function getUTMs(){
  const p = new URLSearchParams(window.location.search);

  return {
    utm_source: p.get("utm_source") || "roofflow",
    utm_campaign: p.get("utm_campaign") || "organic",
    utm_content: p.get("utm_content") || null,
    cpc: parseFloat(p.get("cpc")) || 0
  };
}

/* ===============================
   ROOF FLOW → DRONE HANDOFF
   =============================== */
function sendToDrone(){

  const session_id = getSessionId();
  const utm = getUTMs();

  const droneUrl = new URL("https://northsky-drones.vercel.app");

  // identity pass-through
  droneUrl.searchParams.set("session_id", session_id);

  // attribution pass-through
  droneUrl.searchParams.set("utm_source", utm.utm_source);
  droneUrl.searchParams.set("utm_campaign", utm.utm_campaign);
  droneUrl.searchParams.set("utm_content", utm.utm_content || "");
  droneUrl.searchParams.set("cpc", utm.cpc);

  droneUrl.searchParams.set("from", "roofflow");

  // analytics event (RoofFlow side)
  track("funnel_bridge_click", {
    session_id,
    ...utm,
    destination: "drone_funnel"
  });

  window.location.href = droneUrl.toString();
}

/* ===============================
   EVENT TRACKING (SAFE)
   =============================== */
async function track(event, meta = {}){

  if (!supabase) return;

  try {
    await supabase.from("events").insert([{
      event,
      meta: {
        ...meta,
        session_id: getSessionId(),
        url: window.location.href,
        referrer: document.referrer || "direct"
      },
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.log("track error");
  }
}

/* ===============================
   LEAD SUBMISSION (ROOF FLOW)
   =============================== */
async function submitLead(){

  const name = document.getElementById("name")?.value;
  const email = document.getElementById("email")?.value;
  const city = document.getElementById("city")?.value;

  if (!name || !email || !city){
    alert("Please complete all fields");
    return;
  }

  const session_id = getSessionId();
  const utm = getUTMs();

  await track("lead_capture", {
    name,
    email,
    city,
    ...utm
  });

  if (supabase){
    await supabase.from("leads").insert([{
      name,
      email,
      city,
      session_id,
      source: utm.utm_source,
      campaign: utm.utm_campaign,
      created_at: new Date().toISOString()
    }]);
  }

  // redirect into drone funnel (IMPORTANT LINK)
  setTimeout(() => {
    sendToDrone();
  }, 800);
}

/* ===============================
   PAGE INIT
   =============================== */
window.addEventListener("load", () => {

  track("page_view", {
    source: getUTMs().utm_source
  });

});
</script>