const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

/* ===============================
   REST-ONLY SUPABASE CLIENT
=============================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: "public",
    },

    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },

    realtime: {
      enabled: false,
    },

    global: {
      headers: {
        "X-Client-Info": "flow-os-backend",
      },
    },
  }
);

module.exports = supabase;