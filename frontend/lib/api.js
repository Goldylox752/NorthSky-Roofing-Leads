// =====================
// CONFIG
// =====================
const API = process.env.NEXT_PUBLIC_API_URL;

if (!API) {
  throw new Error("Missing NEXT_PUBLIC_API_URL");
}

// remove trailing slash to prevent double slashes
const BASE_URL = API.replace(/\/$/, "");

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
      credentials: "include",
    });

    clearTimeout(timeout);

    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");

    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        (data && data.message) || data || `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data;
  } catch (err) {
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