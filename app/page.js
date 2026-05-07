"use client";

export default function Home() {
  const handleCheckout = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com", // replace with real input later
          city: "Calgary",
          name: "User",
        }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting checkout");
    }
  };

  return (
    <div style={{ background: "#0b0f19", color: "white" }}>

      {/* HERO (OUTCOME-FIRST) */}
      <section style={{ padding: "120px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: 52, maxWidth: 900, margin: "0 auto" }}>
          Get Paying Roofing & HVAC Customers Without Running Ads
        </h1>

        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 700, margin: "20px auto" }}>
          NorthSky Flow OS automatically turns your website traffic into <b>booked jobs and paid leads</b>.
          No ads manager. No funnels. No guessing.
        </p>

        <button
          onClick={handleCheckout}
          style={{
            marginTop: 30,
            padding: "16px 32px",
            fontSize: 18,
            background: "#22c55e",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Start Getting Leads Today
        </button>

        <p style={{ marginTop: 10, color: "#94a3b8" }}>
          Setup in under 5 minutes • Cancel anytime
        </p>
      </section>

      {/* PROBLEM SECTION */}
      <section style={{ padding: "80px 20px", maxWidth: 900, margin: "0 auto" }}>
        <h2>Most contractors struggle with 3 things:</h2>

        <ul style={{ lineHeight: 2, marginTop: 20 }}>
          <li>❌ Paying for ads that don’t convert</li>
          <li>❌ Leads that never turn into jobs</li>
          <li>❌ Agencies charging $1,000+ with no results</li>
        </ul>
      </section>

      {/* SOLUTION SECTION */}
      <section style={{ padding: "80px 20px", background: "#111827" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2>Here’s what NorthSky does differently</h2>

          <div style={{ marginTop: 30, display: "grid", gap: 20 }}>
            <div>⚡ Instantly captures leads from your traffic</div>
            <div>🧠 Scores & filters high-value customers automatically</div>
            <div>💰 Sends only buyers ready to book jobs</div>
            <div>🔁 Charges only when real leads are generated</div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF (PLACEHOLDER BUT IMPORTANT) */}
      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Contractors using this are seeing:</h2>

        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 30 }}>
          <div>
            <h3>3–12x</h3>
            <p>more qualified leads</p>
          </div>

          <div>
            <h3>40–70%</h3>
            <p>lower ad cost per job</p>
          </div>

          <div>
            <h3>24/7</h3>
            <p>automated lead capture</p>
          </div>
        </div>
      </section>

      {/* PRICING HOOK */}
      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Start for as low as $29</h2>

        <p style={{ color: "#cbd5e1" }}>
          Scale up as your lead volume grows
        </p>

        <button
          onClick={handleCheckout}
          style={{
            marginTop: 20,
            padding: "16px 32px",
            fontSize: 18,
            background: "#22c55e",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Get Instant Access
        </button>
      </section>

    </div>
  );
}