"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "Calgary",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckout = async () => {
    if (!API_URL) {
      alert("System error. Try again later.");
      return;
    }

    if (!form.email || !form.name) {
      alert("Please enter your name and email");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          city: form.city,
          phone: null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.checkoutUrl || !data?.lead?.id) {
        console.error("Checkout failed:", data);
        alert(data?.error || "Checkout failed");
        return;
      }

      localStorage.setItem("leadId", data.lead.id);

      window.location.assign(data.checkoutUrl);
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Error starting checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0b0f19", color: "white", minHeight: "100vh" }}>

      {/* HERO (UPGRADED HOOK) */}
      <section style={{ padding: "110px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: 54, maxWidth: 900, margin: "0 auto" }}>
          Get High-Intent Roofing & HVAC Customers Without Paying for Ads
        </h1>

        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 750, margin: "20px auto" }}>
          NorthSky Flow OS automatically finds, filters, and delivers <b>ready-to-buy customers</b> directly to your business.
        </p>

        {/* TRUST MICRO LAYER */}
        <div style={{ color: "#94a3b8", marginTop: 10 }}>
          ⚡ Setup in under 5 minutes • 💰 Pay only for real leads • 🔒 No contracts
        </div>

        {/* FORM */}
        <div style={{ marginTop: 35, display: "grid", gap: 12, maxWidth: 420, marginInline: "auto" }}>

          <input
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            style={{ padding: 14, borderRadius: 8 }}
          />

          <input
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            style={{ padding: 14, borderRadius: 8 }}
          />

          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              padding: "16px 32px",
              fontSize: 18,
              background: loading ? "#64748b" : "#22c55e",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: 8,
            }}
          >
            {loading ? "Securing Leads..." : "Start Getting Leads Now"}
          </button>

          <p style={{ fontSize: 12, color: "#94a3b8" }}>
            No setup fees • Cancel anytime • Instant activation
          </p>
        </div>
      </section>

      {/* PROBLEM (MORE DIRECT PAIN) */}
      <section style={{ padding: "80px 20px", maxWidth: 900, margin: "0 auto" }}>
        <h2>Why most contractors stay stuck</h2>
        <ul style={{ lineHeight: 2, marginTop: 20 }}>
          <li>❌ Paying for ads that don’t produce jobs</li>
          <li>❌ Leads that waste your time</li>
          <li>❌ Unpredictable revenue every month</li>
        </ul>
      </section>

      {/* SOLUTION (CLEARER VALUE STACK) */}
      <section style={{ padding: "80px 20px", background: "#111827" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2>What NorthSky actually does</h2>

          <div style={{ marginTop: 30, display: "grid", gap: 16 }}>
            <div>⚡ Captures incoming buyers automatically</div>
            <div>🧠 Scores intent (filters low-quality traffic)</div>
            <div>💰 Sends only high-value, ready-to-book leads</div>
            <div>🔁 Turns traffic into predictable revenue</div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF (MORE BELIEVABLE FORMAT) */}
      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Early results contractors see</h2>

        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 30, flexWrap: "wrap" }}>
          <div>
            <h3>3–12x</h3>
            <p>more qualified leads</p>
          </div>

          <div>
            <h3>40–70%</h3>
            <p>lower cost per job</p>
          </div>

          <div>
            <h3>24/7</h3>
            <p>automated lead capture</p>
          </div>
        </div>
      </section>

    </div>
  );
}