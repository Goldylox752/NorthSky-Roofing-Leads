"use client";

import { useState } from "react";

export default function Apply() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Email validation
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // ✅ Basic North America phone validation
  const isValidPhone = (phone) => {
    return /^[0-9]{10,15}$/.test(phone.replace(/\D/g, ""));
  };

  // 🎯 SIMPLE LEAD SCORING (BEFORE STRIPE)
  const scoreLead = () => {
    let score = 0;

    if (isValidEmail(email)) score += 50;
    if (isValidPhone(phone)) score += 50;

    return score;
  };

  const handleNext = () => {
    setError("");

    if (!isValidEmail(email)) {
      return setError("Please enter a valid email.");
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      return setError("Please enter a valid phone number.");
    }

    const leadScore = scoreLead();

    // 🚨 BLOCK LOW QUALITY LEADS
    if (leadScore < 80) {
      return setError("Sorry, we can only accept qualified contractors.");
    }

    setLoading(true);

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });

    const data = await res.json();

    setLoading(false);

    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Apply to RoofFlow</h1>

        {/* STEP INDICATOR */}
        <p style={styles.step}>Step {step} of 2</p>

        {/* TRUST BADGES */}
        <p style={styles.badges}>
          🔒 No spam · ⚡ Instant approval · 🏠 Exclusive leads only
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <label style={styles.label}>Email</label>
              <input
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />

              <button
                type="button"
                onClick={handleNext}
                style={styles.button}
              >
                Continue
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <label style={styles.label}>Phone Number</label>
              <input
                placeholder="(555) 555-5555"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />

              <button type="submit" style={styles.button}>
                {loading ? "Processing..." : "Continue to Checkout"}
              </button>
            </>
          )}

          {/* ERROR */}
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0b1220",
    fontFamily: "Arial",
    color: "white",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    background: "#111a2e",
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },

  h1: {
    fontSize: 26,
    marginBottom: 10,
  },

  step: {
    fontSize: 14,
    opacity: 0.7,
  },

  badges: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 20,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  label: {
    fontSize: 12,
    opacity: 0.8,
  },

  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b1220",
    color: "white",
    outline: "none",
  },

  button: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    background: "#3b82f6",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },

  error: {
    color: "#ff6b6b",
    fontSize: 12,
  },
};
