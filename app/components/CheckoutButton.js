"use client";

import { useState } from "react";

export default function CheckoutButton({
  priceId,
  email,
  mode = "subscription", // default SaaS mode
  metadata = {},
}) {
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleCheckout = async () => {
    if (!API_URL) {
      alert("Backend not connected");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          email,
          mode,
          metadata,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.url) {
        throw new Error("Checkout failed");
      }

      // =====================
      // REDIRECT TO STRIPE
      // =====================
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Payment setup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} style={styles.button}>
      {loading ? "Redirecting..." : "Get Access Now"}
    </button>
  );
}

const styles = {
  button: {
    padding: "16px 20px",
    background: "#4da3ff",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
};