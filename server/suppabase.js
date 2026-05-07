const { createClient } = require("@supabase/supabase-js");

// Fail fast (important on Render)
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Server-side client (FULL ACCESS - never expose this to frontend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

module.exports = supabase;