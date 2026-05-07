const { createClient } = require("@supabase/supabase-js");

/* ===============================
   ENV SAFETY CHECK
=============================== */
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

/* ===============================
   SUPABASE CLIENT (PRODUCTION SAFE)
=============================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },

    // ✅ IMPORTANT: fully disable realtime (not partial)
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },

    // ✅ ensure no websocket dependency is initialized
    global: {
      headers: {
        "X-Client-Info": "flow-os-backend",
      },
    },
  }
);

module.exports = supabase;