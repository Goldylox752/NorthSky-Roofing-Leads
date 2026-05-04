"use client";

import { useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async () => {
    if (!email) return;

    // 🔒 safety check (prevents undefined calls)
    if (!API_URL) {
      alert("Backend not connected. Missing API URL.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Request failed");

      alert("Application received. We’ll contact you shortly.");
      setEmail("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.h1}>RoofFlow</h1>

        <p style={styles.subtext}>
          Exclusive roofing leads delivered directly to your pipeline.
          No cold calls. No wasted ad spend.
        </p>

        <div style={styles.ctaBox}>
          <input
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={handleSubmit} style={styles.button}>
            {loading ? "Sending..." : "Get Access"}
          </button>
        </div>

        <p style={styles.micro}>⚡ Limited contractor spots available</p>
      </section>
    </main>
  );
}

// =====================
// STYLES
// =====================
const styles = {
  main: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0b1220",
    color: "white",
    fontFamily: "system-ui",
    textAlign: "center",
    padding: "20px",
  },

  hero: {
    maxWidth: "600px",
  },

  h1: {
    fontSize: "52px",
    marginBottom: "10px",
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
    width: "250px",
    outline: "none",
  },

  button: {
    padding: "14px 18px",
    background: "#4da3ff",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  micro: {
    marginTop: "15px",
    fontSize: "12px",
    opacity: 0.6,
  },
};