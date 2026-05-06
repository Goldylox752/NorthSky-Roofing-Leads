const API_URL = import.meta.env.VITE_API_URL;

// ===============================
// LEAD CREATE
// ===============================
export async function createLead(data) {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

// ===============================
// STRIPE CHECKOUT
// ===============================
export async function createCheckout(payload) {
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data?.url) {
    throw new Error("Checkout session failed");
  }

  return data;
}