"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// map frontend plans → backend-safe pricing
const PLAN_PRICES = {
  starter: 99,
  growth: 199,
  elite: 499,
};

export default function Buy() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  const buy = async (plan) => {
    try {
      setError("");
      setLoadingPlan(plan);

      if (!API_URL) {
        throw new Error("API URL not configured");
      }

      const price = PLAN_PRICES[plan];

      if (!price) {
        throw new Error("Invalid plan selected");
      }

      const res = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          amount: price,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoadingPlan(null);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Buy Roofing Leads</h1>

        <p style={styles.sub}>
          Instant access to contractor lead marketplace
        </p>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        {/* STARTER */}
        <button
          onClick={() => buy("starter")}
          disabled={!!loadingPlan}
          style={{
            ...styles.btn,
            opacity:
              loadingPlan && loadingPlan !== "starter" ? 0.5 : 1,
          }}
        >
          {loadingPlan === "starter"
            ? "Redirecting..."
            : "Starter — $99"}
        </button>

        {/* GROWTH */}
        <button
          onClick={() => buy("growth")}
          disabled={!!loadingPlan}
          style={{
            ...styles.btn,
            background: "#2563eb",
            opacity:
              loadingPlan && loadingPlan !== "growth" ? 0.5 : 1,
          }}
        >
          {loadingPlan === "growth"
            ? "Redirecting..."
            : "Growth — $199"}
        </button>

        {/* ELITE */}
        <button
          onClick={() => buy("elite")}
          disabled={!!loadingPlan}
          style={{
            ...styles.btn,
            background: "#16a34a",
            opacity:
              loadingPlan && loadingPlan !== "elite" ? 0.5 : 1,
          }}
        >
          {loadingPlan === "elite"
            ? "Redirecting..."
            : "Elite — $499"}
        </button>

        <p style={styles.note}>
          Secure Stripe checkout • Instant access after payment
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    padding: 60,
    fontFamily: "system-ui",
  },
  container: {
    maxWidth: 600,
    margin: "0 auto",
  },
  title: {
    fontSize: 40,
    marginBottom: 10,
  },
  sub: {
    opacity: 0.7,
    marginBottom: 20,
  },
  btn: {
    width: "100%",
    padding: 14,
    marginBottom: 10,
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  note: {
    marginTop: 15,
    fontSize: 13,
    opacity: 0.6,
  },
};