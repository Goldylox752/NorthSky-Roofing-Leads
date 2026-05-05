const API = process.env.NEXT_PUBLIC_API_URL;

// =====================
// CORE FETCH WRAPPER
// =====================
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    const res = await fetch(`${API}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
      body: options.body,
      signal: controller.signal,
      credentials: "include",
    });

    clearTimeout(timeout);

    const contentType = res.headers.get("content-type");

    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      throw new Error(
        data?.message || data || `Request failed (${res.status})`
      );
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timeout — backend too slow");
    }
    throw err;
  }
}

---

# 🧩 LEADS
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

---

# 🤖 AI SCORING
// =====================
export function scoreLead(payload) {
  return apiFetch("/api/score", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

---

# 💳 PAYMENTS (Stripe)
// =====================
export function createCheckoutSession(payload) {
  return apiFetch("/api/payments/create-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

---

# 🧠 HEALTH / DEBUG
// =====================
export function checkHealth() {
  return apiFetch("/health");
}