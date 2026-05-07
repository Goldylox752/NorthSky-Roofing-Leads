import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/payments/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com", // replace with real input later
          name: "Test User",
          plan: "starter",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
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
          background: loading ? "#999" : "#22c55e",
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