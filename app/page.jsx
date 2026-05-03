"use client";

import { useState } from "react";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    // funnel hook (connect to backend later)
    console.log("Lead captured:", email);

    setTimeout(() => {
      setLoading(false);
      alert("Application received. We’ll contact you shortly.");
    }, 1200);
  };

  return (
    <main style={styles.main}>
      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.badge}>⚡ Exclusive Roofing Lead System</div>

        <h1 style={styles.h1}>
          Get <span style={styles.highlight}>Booked Roofing Appointments</span>{" "}
          Sent Directly to Your Calendar
        </h1>

        <p style={styles.subtext}>
          RoofFlow delivers high-intent homeowners actively requesting roofing
          estimates in your area. No cold leads. No shared lists. No wasted ad spend.
        </p>

        <div style={styles.ctaBox}>
          <input
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={handleSubmit} style={styles.button}>
            {loading ? "Processing..." : "Get Access"}
          </button>
        </div>

        <p style={styles.micro}>
          ⚡ Limited contractor slots per region
        </p>
      </section>

      {/* ================= PROBLEM ================= */}
      <section style={styles.sectionDark}>
        <h2>Most roofing companies are leaking revenue every day</h2>

        <div style={styles.grid}>
          <div style={styles.card}>
            ❌ Paying for unqualified leads
          </div>
          <div style={styles.card}>
            ❌ No-shows and tire kickers
          </div>
          <div style={styles.card}>
            ❌ Slow response times losing deals
          </div>
          <div style={styles.card}>
            ❌ No automation or follow-up system
          </div>
        </div>
      </section>

      {/* ================= SOLUTION ================= */}
      <section style={styles.section}>
        <h2>The RoofFlow System</h2>

        <p style={styles.subtext}>
          We don’t sell leads. We deliver pre-qualified homeowners who already
          requested roofing estimates.
        </p>

        <div style={styles.steps}>
          <div style={styles.step}>
            <h3>1. Capture</h3>
            <p>We attract high-intent homeowners in your service area</p>
          </div>

          <div style={styles.step}>
            <h3>2. Qualify</h3>
            <p>AI filters out low-quality or irrelevant inquiries</p>
          </div>

          <div style={styles.step}>
            <h3>3. Book</h3>
            <p>Appointments are sent directly into your calendar</p>
          </div>
        </div>
      </section>

      {/* ================= SOCIAL PROOF ================= */}
      <section style={styles.sectionDark}>
        <h2>Results from contractors using systems like this</h2>

        <div style={styles.grid}>
          <div style={styles.card}>
            📈 3.2x increase in booked appointments
          </div>
          <div style={styles.card}>
            💰 $25K → $87K/month pipeline growth
          </div>
          <div style={styles.card}>
            ⚡ 80% faster lead response time
          </div>
          <div style={styles.card}>
            🔥 Higher close rates from pre-qualified leads
          </div>
        </div>
      </section>

      {/* ================= OFFER ================= */}
      <section style={styles.section}>
        <h2>Get Access to RoofFlow</h2>

        <p style={styles.subtext}>
          We only onboard a limited number of contractors per region to protect lead quality.
        </p>

        <div style={styles.ctaBox}>
          <input
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={handleSubmit} style={styles.button}>
            Request Access
          </button>
        </div>

        <p style={styles.micro}>
          🔒 Application required — not open to everyone
        </p>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        © {new Date().getFullYear()} RoofFlow. All rights reserved.
      </footer>
    </main>
  );
}

const styles = {
  main: {
    background: "#070b14",
    color: "white",
    fontFamily: "system-ui",
  },

  hero: {
    padding: "120px 20px",
    textAlign: "center",
    maxWidth: "900px",
    margin: "0 auto",
  },

  badge: {
    display: "inline-block",
    padding: "8px 14px",
    background: "#111c33",
    borderRadius: "999px",
    fontSize: "12px",
    marginBottom: "20px",
  },

  h1: {
    fontSize: "48px",
    lineHeight: "1.1",
    marginBottom: "20px",
  },

  highlight: {
    color: "#4da3ff",
  },

  subtext: {
    fontSize: "18px",
    opacity: 0.8,
    marginBottom: "30px",
  },

  ctaBox: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  input: {
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    width: "260px",
  },

  button: {
    padding: "14px 20px",
    background: "#4da3ff",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  micro: {
    marginTop: "12px",
    fontSize: "12px",
    opacity: 0.6,
  },

  section: {
    padding: "80px 20px",
    textAlign: "center",
    maxWidth: "1000px",
    margin: "0 auto",
  },

  sectionDark: {
    padding: "80px 20px",
    background: "#0b1220",
    textAlign: "center",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },

  card: {
    background: "#111c33",
    padding: "20px",
    borderRadius: "10px",
  },

  steps: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "30px",
  },

  step: {
    background: "#111c33",
    padding: "20px",
    borderRadius: "10px",
    width: "260px",
  },

  footer: {
    padding: "40px",
    textAlign: "center",
    fontSize: "12px",
    opacity: 0.5,
  },
};