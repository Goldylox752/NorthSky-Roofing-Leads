"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(
        `${API_URL}/api/payments/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert("Checkout failed. Please try again.");

    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div>

      {/* HERO */}
      <header style={{
        padding: "100px 20px",
        textAlign: "center",
        background: "linear-gradient(135deg, #1a2a6c, #0f172a)"
      }}>
        <h1 style={{ fontSize: 48 }}>
          Automate Leads. Collect Payments. Grow Fast.
        </h1>

        <p style={{
          maxWidth: 700,
          margin: "20px auto",
          color: "#cbd5e1",
          fontSize: 18
        }}>
          NorthSky Flow OS turns traffic into <b>paid customers automatically</b>.
          Built for contractors, agencies, and local service businesses.
        </p>

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            marginTop: 20,
            padding: "15px 30px",
            fontSize: 18,
            background: loading ? "#64748b" : "#22c55e",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            color: "white",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Redirecting..." : "Get Access Now"}
        </button>
      </header>

      {/* FEATURES */}
      <section style={{ padding: "60px 20px", maxWidth: 1000, margin: "auto" }}>
        <h2>What This System Does</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
          marginTop: 20
        }}>

          <div style={{ background: "#111827", padding: 20, borderRadius: 10 }}>
            ⚡ Instant Stripe Payments
          </div>

          <div style={{ background: "#111827", padding: 20, borderRadius: 10 }}>
            📥 Automated Lead Capture
          </div>

          <div style={{ background: "#111827", padding: 20, borderRadius: 10 }}>
            🔁 No Duplicate Payments
          </div>

          <div style={{ background: "#111827", padding: 20, borderRadius: 10 }}>
            📊 Built for Contractors & Agencies
          </div>

        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ padding: "60px 20px", maxWidth: 900, margin: "auto" }}>
        <h2>Who This Is For</h2>

        <ul style={{ lineHeight: 2 }}>
          <li>🏠 Roofing companies</li>
          <li>❄️ HVAC contractors</li>
          <li>⚡ Solar installers</li>
          <li>📞 Lead generation agencies</li>
          <li>💼 Local service businesses</li>
        </ul>
      </section>

      {/* FINAL CTA */}
      <section style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2>Start Automating Your Business Today</h2>

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            marginTop: 20,
            padding: "15px 30px",
            fontSize: 18,
            background: loading ? "#64748b" : "#22c55e",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            color: "white"
          }}
        >
          {loading ? "Processing..." : "Get Started — $29+"}
        </button>
      </section>

    </div>
  );
}