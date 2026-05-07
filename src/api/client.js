const API_URL = import.meta.env.VITE_API_URL;

// safety check (prevents silent undefined bugs)
if (!API_URL) {
  console.error("❌ Missing VITE_API_URL in frontend .env");
}

// ===============================
// CREATE LEAD
// ===============================
export async function createLead(data) {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || "Failed to create lead");
  }

  return json;
}

// ===============================
// STRIPE CHECKOUT
// ===============================
export async function createCheckout(payload) {
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || "Checkout failed");
  }

  if (!json?.url) {
    throw new Error("Missing Stripe checkout URL");
  }

  return json;
}