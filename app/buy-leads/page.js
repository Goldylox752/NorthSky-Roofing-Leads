"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Buy() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);

  const buy = async (plan) => {
    try {
      setError(null);
      setLoadingPlan(plan);

      const res = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          mode: "payment",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoadingPlan(null);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Buy Roofing Leads</h1>
        <p style={styles.sub}>
          Instant access to live contractor leads marketplace
        </p>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        {/* STARTER */}
        <button
          onClick={() => buy("starter")}
          disabled={loadingPlan}
          style={{
            ...styles.btn,
            opacity: loadingPlan && loadingPlan !== "starter" ? 0.5 : 1,
          }}
        >
          {loadingPlan === "starter"
            ? "Redirecting..."
            : "Starter — $99"}
        </button>

        {/* GROWTH */}
        <button
          onClick={() => buy("growth")}
          disabled={loadingPlan}
          style={{
            ...styles.btn,
            background: "#2563eb",
            opacity: loadingPlan && loadingPlan !== "growth" ? 0.5 : 1,
          }}
        >
          {loadingPlan === "growth"
            ? "Redirecting..."
            : "Growth — $199"}
        </button>

        {/* ELITE */}
        <button
          onClick={() => buy("elite")}
          disabled={loadingPlan}
          style={{
            ...styles.btn,
            background: "#16a34a",
            opacity: loadingPlan && loadingPlan !== "elite" ? 0.5 : 1,
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