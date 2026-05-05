"use client";

import { useMemo, useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ===============================
  // 🧠 BASIC EMAIL VALIDATION
  // ===============================
  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  // ===============================
  // 🚀 SUBMIT LEAD
  // ===============================
  const handleSubmit = async () => {
    if (loading) return;

    if (!email || !isValidEmail) {
      setStatus("invalid");
      return;
    }

    if (!API_URL) {
      setStatus("no_backend");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_URL}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🔐 lightweight bot signal tracking (backend can use this)
          "x-source": "landing_page_v2",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: "landing",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setStatus(data?.duplicate ? "duplicate" : "success");
      setEmail("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI STATE MESSAGE
  // ===============================
  const statusMessage = {
    invalid: "Please enter a valid email.",
    no_backend: "Backend not connected.",
    success: "Application received. We’ll contact you shortly.",
    duplicate: "You’re already in the system.",
    error: "Something went wrong. Try again.",
  }[status];

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* HERO */}
        <h1 style={styles.h1}>RoofFlow</h1>

        <p style={styles.subtext}>
          High-intent roofing leads delivered directly to contractors.
          No shared leads. No wasted ads. Just booked jobs.
        </p>

        {/* CTA */}
        <div style={styles.ctaBox}>
          <input
            style={{
              ...styles.input,
              border: status === "invalid" ? "2px solid red" : "none",
            }}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <button
            onClick={handleSubmit}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : "Get Exclusive Access"}
          </button>
        </div>

        {/* STATUS */}
        {statusMessage && (
          <p
            style={{
              ...styles.micro,
              color:
                status === "success"
                  ? "#4ade80"
                  : status === "error"
                  ? "#f87171"
                  : "#fbbf24",
            }}
          >
            {statusMessage}
          </p>
        )}

        {/* TRUST */}
        <div style={styles.section}>
          <h2>How it works</h2>
          <p style={styles.text}>
            1. Homeowners request roofing quotes <br />
            2. AI qualifies and scores each lead <br />
            3. Only high-intent jobs get delivered to contractors
          </p>
        </div>

        {/* VALUE */}
        <div style={styles.section}>
          <h2>Why contractors switch</h2>
          <p style={styles.text}>
            • No competing contractors <br />
            • No wasted ad spend <br />
            • Higher close rates through AI filtering
          </p>
        </div>

        {/* SOCIAL PROOF */}
        <div style={styles.section}>
          <h2>Early Results</h2>
          <p style={styles.text}>
            Contractors are closing jobs within days of joining the system.
          </p>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "white",
    fontFamily: "system-ui",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "700px",
    margin: "0 auto",
    textAlign: "center",
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
    marginBottom: "10px",
  },

  input: {
    padding: "14px",
    borderRadius: "8px",
    width: "260px",
    outline: "none",
  },

  button: {
    padding: "14px 18px",
    background: "#4da3ff",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "bold",
  },

  micro: {
    fontSize: "12px",
    opacity: 0.8,
    marginBottom: "40px",
  },

  section: {
    marginTop: "40px",
  },

  text: {
    opacity: 0.8,
    lineHeight: "1.6",
  },
};