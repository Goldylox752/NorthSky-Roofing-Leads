// ===============================
// 🌐 FLOW OS API CLIENT (PRODUCTION READY)
// ===============================

const FLOW_API =
  process.env.NEXT_PUBLIC_FLOW_API ||
  "https://northsky-flow-os.onrender.com";

const TIMEOUT = 12000;

// ===============================
// ⏱️ TIMEOUT WRAPPER
// ===============================
function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), ms)
  );
}

// ===============================
// 🔧 CORE REQUEST ENGINE
// ===============================
async function request(url, options = {}) {
  const controller = new AbortController();

  try {
    const res = await Promise.race([
      fetch(`${FLOW_API}${url}`, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        body: options.body,
        signal: controller.signal,
      }),
      timeoutPromise(TIMEOUT),
    ]);

    const data = await res.json();

    if (!res.ok) {
      console.error("API ERROR:", url, data);

      return {
        success: false,
        error: data?.error || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      data,
    };

  } catch (err) {
    console.error("NETWORK ERROR:", url, err);

    return {
      success: false,
      error: err.message || "Network error",
    };
  } finally {
    controller.abort();
  }
}