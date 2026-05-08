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

    /* ===============================
       🔥 CRITICAL FIX
       FULLY DISABLE REALTIME
    =============================== */
    realtime: {
      enabled: false,
    },
  }
);

module.exports = supabase;