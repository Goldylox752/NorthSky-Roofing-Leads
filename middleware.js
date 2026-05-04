import { createClient } from "@supabase/supabase-js";

// ===============================
// REUSABLE SUPABASE CLIENT
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🔥 server trust boundary
);

// ===============================
// REQUIRE USER (SAAS-GRADE)
// ===============================
export async function requireUser(req) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      const err = new Error("UNAUTHORIZED");
      err.code = "NO_TOKEN";
      throw err;
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // ===============================
    // VERIFY SESSION
    // ===============================
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      const err = new Error("UNAUTHORIZED");
      err.code = "INVALID_TOKEN";
      throw err;
    }

    // ===============================
    // LOAD SAAS PROFILE (ONE SOURCE OF TRUTH)
    // ===============================
    const { data: profile, error: profileError } = await supabase
      .from("contractors")
      .select("id, role, balance_cents, city, active, name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      const err = new Error("PROFILE_NOT_FOUND");
      err.code = "NO_PROFILE";
      throw err;
    }

    // ===============================
    // RETURN ENRICHED IDENTITY
    // ===============================
    return {
      id: user.id,
      email: user.email,

      role: profile?.role || "contractor",
      contractorId: profile?.id,

      name: profile?.name || null,
      city: profile?.city || null,
      active: profile?.active ?? false,

      balance: profile?.balance_cents || 0,
    };

  } catch (err) {
    // structured error (important for debugging + logs)
    throw {
      message: err.message || "UNAUTHORIZED",
      code: err.code || "AUTH_ERROR",
    };
  }
}