const API_URL = import.meta.env.VITE_API_URL;

/* ===============================
   ENV SAFETY CHECK
=============================== */
if (!API_URL) {
  throw new Error("❌ Missing VITE_API_URL in frontend .env");
}

/* ===============================
   SAFE FETCH WRAPPER
=============================== */
async function safeFetch(url, options) {
  const res = await fetch(url, options);

  let data = null;

  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

/* ===============================
   CREATE LEAD
=============================== */
export async function createLead(data) {
  return await safeFetch(`${API_URL}/api/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

/* ===============================
   STRIPE CHECKOUT (FIXED ROUTE)
=============================== */
export async function createCheckout(payload) {
  const data = await safeFetch(
    `${API_URL}/api/payments/checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!data?.url) {
    throw new Error("Missing Stripe checkout URL");
  }

  return data;
}