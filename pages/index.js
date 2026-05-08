import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!API_URL) {
      alert("System not configured");
      return;
    }

    try {
      setLoading(true);

      /* ===============================
         CREATE LEAD + CHECKOUT FLOW
      =============================== */
      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com", // replace later with real input
          name: "Test User",
          city: "Calgary",
          phone: null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.checkout?.leadId) {
        throw new Error(data?.error || "Checkout failed");
      }

      /* ===============================
         STORE LEAD FOR WEBHOOK MATCHING
      =============================== */
      localStorage.setItem("leadId", data.checkout.leadId);

      /* ===============================
         REDIRECT TO STRIPE
      =============================== */
      if (data.checkout?.url) {
        window.location.href = data.checkout.url;
      } else {
        throw new Error("Missing checkout URL");
      }

    } catch (err) {
      console.error("Checkout error:", err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>NorthSky Flow OS</h1>

      <p>Automate leads. Collect payments. Scale fast.</p>

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          background: loading ? "#6b7280" : "#22c55e",
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: 6,
          fontSize: 16,
        }}
      >
        {loading ? "Redirecting..." : "Get Access"}
      </button>
    </div>
  );
}