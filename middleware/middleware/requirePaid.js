const supabase = require("../lib/supabase");

/* ===============================
   PAID ACCESS MIDDLEWARE
=============================== */
module.exports = async function requirePaid(req, res, next) {
  try {
    const email =
      req.body?.email ||
      req.query?.email ||
      req.headers["x-user-email"];

    if (!email) {
      return res.status(401).json({
        success: false,
        error: "Missing user email",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from("leads")
      .select("paid, plan, active")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!data.paid) {
      return res.status(403).json({
        success: false,
        error: "Payment required",
      });
    }

    // attach user to request
    req.user = data;

    next();

  } catch (err) {
    console.error("Access control error:", err);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};