<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Access Granted | NorthSky</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">

<style>
body{
  font-family:'Inter',sans-serif;
  background:#0b1220;
  color:#fff;
  text-align:center;
  padding:60px 20px;
}

.container{
  max-width:700px;
  margin:auto;
}

h1{
  font-size:36px;
  margin-bottom:10px;
}

p{
  opacity:0.75;
  margin-bottom:25px;
}

.box{
  background:#111827;
  padding:25px;
  border-radius:12px;
  margin-top:25px;
  border:1px solid rgba(255,255,255,0.08);
}

button{
  padding:14px 20px;
  border:none;
  border-radius:8px;
  background:#22c55e;
  color:#fff;
  font-weight:600;
  cursor:pointer;
  width:100%;
  margin-top:15px;
}

.small{
  font-size:12px;
  opacity:0.6;
  margin-top:15px;
}
</style>
</head>

<body>

<div class="container">

<h1>You're In 🚀</h1>
<p>Your territory is being activated. Check your email shortly.</p>

<!-- STEP GUIDE -->
<div class="box">
  <h2>Next Steps</h2>
  <p>1. We prepare your AI lead system</p>
  <p>2. You receive incoming opportunities</p>
  <p>3. You close jobs using drone inspections</p>
</div>

<!-- 🔥 UPSELL -->
<div class="box">
  <h2>Recommended: Inspection Drone Kit</h2>
  <p>This is the exact system contractors use to inspect roofs safely and close $1K–$5K jobs.</p>

  <button onclick="goToDrone()">
    Get My Inspection Kit
  </button>

  <div class="small">
    Most members recover the cost in 1–2 jobs
  </div>
</div>

<!-- CONTINUE -->
<div class="box">
  <h2>Skip for Now</h2>
  <button onclick="continueApp()">
    Continue to Dashboard
  </button>
</div>

</div>

<script>

// 🔓 Unlock main app
localStorage.setItem("paid_access","true");

// optional: track plan if you pass it later
// localStorage.setItem("plan","pro");

// 🚁 Upsell redirect
function goToDrone(){
  window.location.href = "https://northsky-drones.vercel.app?bundle=inspection-kit";
}

// ➡️ Continue
function continueApp(){
  window.location.href = "/";
}

</script>

</body>
</html>
