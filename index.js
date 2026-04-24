/* =========================================
   NORTHSKY OS - CORE ENGINE (PRODUCTION)
========================================= */

/* ========== CONFIG ========== */
const CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",
  SUPABASE_KEY: "YOUR_SUPABASE_ANON_KEY",
  DRONE_URL: "https://northsky-drones.vercel.app"
};

/* ========== GLOBAL STATE ========== */
let supabase;
let currentUser = null;
let userPlan = null;

/* ========== INIT SYSTEM ========== */
(async function init() {

  if (!window.supabase) {
    console.error("Supabase not loaded");
    return;
  }

  supabase = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_KEY
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("No session");
    return;
  }

  currentUser = user;

  await loadUserAccess(user.email);

  if (userPlan?.paid !== true) {
    console.log("Access blocked (unpaid)");
    return;
  }

  unlockApp();

})();

/* ========== LOAD USER FROM DB ========== */
async function loadUserAccess(email) {

  const { data, error } = await supabase
    .from("users")
    .select("paid, plan")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.warn("DB error:", error);
    userPlan = { paid: false };
    return;
  }

  userPlan = data || { paid: false };

  console.log("User plan:", userPlan);
}

/* ========== UNLOCK APP ========== */
function unlockApp() {

  const paywall = document.getElementById("paywall");
  const app = document.getElementById("app");

  if (paywall) paywall.style.display = "none";
  if (app) app.classList.remove("hidden");

  window.submitLead = submitLead;
}

/* ========== SESSION ID ========== */
function sessionId() {
  let id = localStorage.getItem("session_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }

  return id;
}

/* ========== LOGIN ========== */
async function login(email) {

  if (!email) return alert("Enter email");

  const { error } = await supabase.auth.signInWithOtp({
    email
  });

  if (error) {
    console.error(error);
    return alert("Login failed");
  }

  alert("Check email for login link");
}

window.login = login;

/* ========== LEAD SUBMISSION ========== */
async function submitLead() {

  if (!currentUser) {
    alert("Login required");
    return;
  }

  if (!userPlan?.paid) {
    alert("Upgrade required");
    return;
  }

  const name = document.getElementById("name")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const city = document.getElementById("city")?.value?.trim();

  if (!name || !email || !city) {
    alert("Fill all fields");
    return;
  }

  const lead = {
    name,
    email,
    city,
    user_email: currentUser.email,
    session_id: sessionId(),
    created_at: new Date().toISOString(),
    plan: userPlan.plan || "unknown"
  };

  const { error } = await supabase.from("leads").insert([lead]);

  if (error) {
    console.error("Insert error:", error);
    return alert("Failed to submit lead");
  }

  // tracking hook (safe)
  trackEvent("lead_created", lead);

  window.location.href = CONFIG.DRONE_URL + "?bundle=inspection-kit";
}

/* ========== TRACKING SYSTEM ========== */
function trackEvent(event, data = {}) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      data,
      user: currentUser?.email,
      session: sessionId(),
      url: location.href,
      ts: Date.now()
    })
  }).catch(() => {});
}

window.trackEvent = trackEvent;