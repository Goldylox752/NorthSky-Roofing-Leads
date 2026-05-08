// =====================
// CONFIG
// =====================
const API = process.env.NEXT_PUBLIC_API_URL;

if (typeof window !== "undefined" && !API) {
  console.warn("Missing NEXT_PUBLIC_API_URL");
}

const BASE_URL = (API || "").replace(/\/$/, "");

// =====================
// TOKEN HELPERS
// =====================
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

// =====================
// CORE FETCH WRAPPER
// =====================
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const token = getToken();

    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        (data && data.message) || data || `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error("Request timeout — server not responding");
    }

    throw err;
  }
}

// =====================
// LEADS
// =====================
export function createLead(payload) {
  return apiFetch("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getLeads() {
  return apiFetch("/api/leads");
}

// =====================
// AI SCORING
// =====================
export function scoreLead(payload) {
  return apiFetch("/api/score", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// =====================
// STRIPE
// =====================
// NOTE: make sure this matches your Render backend route exactly
export function createCheckoutSession(payload) {
  return apiFetch("/api/payments/create-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// =====================
// HEALTH CHECK
// =====================
export function checkHealth() {
  return apiFetch("/health");
}