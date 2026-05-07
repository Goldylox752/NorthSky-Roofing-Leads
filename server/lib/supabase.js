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
    realtime: {
      enabled: false,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

module.exports = supabase;