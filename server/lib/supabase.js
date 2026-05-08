const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

/* ===============================
   FORCE REST-ONLY MODE
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

    realtime: {
      enabled: false,
      params: {}, // ensures no websocket config is created
    },

    global: {
      headers: {
        "X-Client-Info": "flow-os-backend",
      },
    },
  }
);

module.exports = supabase;