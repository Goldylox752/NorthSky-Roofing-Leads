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
      alert("Please enter name and email");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      // store for verification / success page
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

      {/* HERO */}
      <section style={{ padding: "120px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: 52, maxWidth: 900, margin: "0 auto" }}>
          Get High-Value Roofing & HVAC Customers Automatically
        </h1>

        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 700, margin: "20px auto" }}>
          NorthSky Flow OS turns your traffic into <b>paying customers and booked jobs</b> using automated lead scoring + checkout.
        </p>

        {/* FORM */}
        <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 400, marginInline: "auto" }}>
          <input
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            style={{ padding: 12, borderRadius: 8 }}
          />

          <input
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            style={{ padding: 12, borderRadius: 8 }}
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
              marginTop: 10,
            }}
          >
            {loading ? "Processing..." : "Start Getting Leads"}
          </button>
        </div>

        <p style={{ marginTop: 10, color: "#94a3b8" }}>
          Setup in under 5 minutes • Cancel anytime
        </p>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: "80px 20px", maxWidth: 900, margin: "0 auto" }}>
        <h2>Why contractors struggle</h2>
        <ul style={{ lineHeight: 2, marginTop: 20 }}>
          <li>❌ Expensive ads with low ROI</li>
          <li>❌ Leads that don’t convert</li>
          <li>❌ Unpredictable monthly revenue</li>
        </ul>
      </section>

      {/* SOLUTION */}
      <section style={{ padding: "80px 20px", background: "#111827" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2>What NorthSky does</h2>
          <div style={{ marginTop: 30, display: "grid", gap: 20 }}>
            <div>⚡ Captures leads instantly</div>
            <div>🧠 Scores intent automatically</div>
            <div>💰 Filters high-value customers</div>
            <div>🔁 Sends only paying-ready leads</div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Results contractors want</h2>

        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 30 }}>
          <div>
            <h3>3–12x</h3>
            <p>more qualified leads</p>
          </div>
          <div>
            <h3>40–70%</h3>
            <p>lower acquisition cost</p>
          </div>
          <div>
            <h3>24/7</h3>
            <p>automated system</p>
          </div>
        </div>
      </section>
    </div>
  );
}