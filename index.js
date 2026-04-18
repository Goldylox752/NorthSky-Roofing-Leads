<script>
/* ===============================
   ROOF FLOW AI → DRONE FUNNEL CORE
   CLEAN + PRODUCTION READY
   =============================== */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabase = null;

/* INIT SUPABASE */
function initSupabase(){
  if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase connected");
  } else {
    console.log("⚠️ Supabase not active");
  }
}
initSupabase();

/* ===============================
   SESSION ID (GLOBAL USER ID)
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
   UTM + ATTRIBUTION
   =============================== */
function getUTMs(){
  const p = new URLSearchParams(window.location.search);

  const utms = {
    utm_source: p.get("utm_source") || "direct",
    utm_campaign: p.get("utm_campaign") || "organic",
    utm_content: p.get("utm_content") || null,
    cpc: parseFloat(p.get("cpc")) || 0
  };

  // persist attribution
  localStorage.setItem("utm_source", utms.utm_source);
  localStorage.setItem("utm_campaign", utms.utm_campaign);

  return utms;
}

/* ===============================
   EVENT TRACKING
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

    console.log("📊 event:", event);

  } catch (err) {
    console.log("❌ tracking error:", err.message);
  }
}

/* ===============================
   LEAD CAPTURE
   =============================== */
async function submitLead(){

  const name = document.getElementById("name")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const city = document.getElementById("city")?.value?.trim();

  if (!name || !email || !city){
    alert("Please fill all fields");
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

  console.log("✅ Lead saved");

  setTimeout(() => {
    sendToDrone();
  }, 600);
}

/* ===============================
   ROOF FLOW → DRONE REDIRECT
   =============================== */
function sendToDrone(){

  const session_id = getSessionId();
  const utm = getUTMs();

  const url = new URL("https://northsky-drones.vercel.app");

  url.searchParams.set("session_id", session_id);
  url.searchParams.set("utm_source", utm.utm_source);
  url.searchParams.set("utm_campaign", utm.utm_campaign);
  url.searchParams.set("utm_content", utm.utm_content || "");
  url.searchParams.set("cpc", utm.cpc);
  url.searchParams.set("from", "roofflow");

  track("funnel_bridge_click", {
    session_id,
    ...utm,
    destination: "drone_funnel"
  });

  console.log("🚀 Redirecting to Drone Funnel");

  window.location.href = url.toString();
}

/* ===============================
   PAGE LOAD
   =============================== */
window.addEventListener("load", () => {

  const utm = getUTMs();

  track("page_view", {
    source: utm.utm_source
  });

  console.log("🌐 RoofFlow AI active:", utm);

});
</script>