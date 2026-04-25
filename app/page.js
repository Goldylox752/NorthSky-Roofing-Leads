<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>Apply | RoofFlow</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 40px 20px;
  font-family: Inter, sans-serif;
  background: #0b1220;
  color: white;
}

.container {
  max-width: 650px;
  margin: auto;
}

h2 {
  margin-bottom: 10px;
}

p {
  opacity: 0.8;
  margin-bottom: 30px;
}

input,
select,
button {
  width: 100%;
  padding: 14px;
  margin: 10px 0;
  border-radius: 10px;
  border: none;
  font-size: 15px;
}

input,
select {
  background: white;
  color: #111;
}

button {
  background: #4f46e5;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  opacity: 0.95;
}

.hidden-field {
  display: none;
}

.notice {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 15px;
}
</style>
</head>

<body>

<div class="container">

  <h2>Apply For Your City</h2>
  <p>We only onboard serious roofing contractors ready to scale.</p>

  <form id="applyForm">

    <input name="name" placeholder="Full Name" required />
    <input name="phone" placeholder="Phone Number" required />
    <input type="email" name="email" placeholder="Business Email" required />
    <input name="company" placeholder="Company Name" required />
    <input name="city" placeholder="Primary Service City" required />

    <select name="monthly_jobs" required>
      <option value="">Monthly Jobs Completed</option>
      <option>0–5</option>
      <option>5–15</option>
      <option>15+</option>
    </select>

    <select name="lead_spend" required>
      <option value="">Monthly Ad Spend</option>
      <option>$0</option>
      <option>$500–$2,000</option>
      <option>$2,000+</option>
    </select>

    <select name="team_size" required>
      <option value="">Team Size</option>
      <option>Solo</option>
      <option>2–5</option>
      <option>5+</option>
    </select>

    <!-- Honeypot -->
    <input type="text" name="website" class="hidden-field" tabindex="-1" />

    <button type="submit" id="submitBtn">Apply Now</button>

    <div class="notice">
      Qualified applicants will be redirected to onboarding.
    </div>

  </form>

</div>

<script>
const form = document.getElementById("applyForm");
const btn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  btn.disabled = true;
  btn.innerText = "Submitting...";

  const data = Object.fromEntries(new FormData(form));

  try {
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.qualified) {
      window.location.href = "/book-call.html";
    } else {
      alert("Thanks! We’ll review your application.");
    }

  } catch (err) {
    console.error(err);
    alert("Error submitting form.");
  }

  btn.disabled = false;
  btn.innerText = "Apply Now";
});
</script>

</body>
</html>
