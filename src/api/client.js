const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

/* ===============================
   ENV SAFETY CHECK
=============================== */
if (!API_URL) {
  throw new Error("❌ Missing VITE_API_URL in frontend .env");
}

/* ===============================
   CORE FETCH WRAPPER (ROBUST)
=============================== */
async function safeFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  let res;
  let data;

  try {
    res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (err) {
    throw new Error("Network error: backend unreachable");
  }

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}

/* ===============================
   CREATE LEAD
=============================== */
export async function createLead(payload) {
  return safeFetch("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ===============================
   STRIPE CHECKOUT
=============================== */
export async function createCheckout(payload) {
  const data = await safeFetch("/api/payments/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.url) {
    throw new Error("Missing Stripe checkout URL");
  }

  return data;
}