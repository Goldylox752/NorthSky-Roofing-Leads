"use client";

import { useState } from "react";
import { getAllPlans } from "@/lib/pricing";

export default function PricingButton() {
  const plans = getAllPlans();

  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError("No checkout URL returned");
    } catch (err) {
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Choose Your Plan</h2>

      {/* PLAN SELECTOR (NOW DYNAMIC) */}
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        style={styles.select}
        disabled={loading}
      >
        {plans.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label} — ${p.price}/mo
          </option>
        ))}
      </select>

      <button
        onClick={handleCheckout}
        style={{
          ...styles.button,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Continue to Checkout"}
      </button>

      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}
