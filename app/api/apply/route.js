import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

/* ================= SUPABASE ================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // use SERVICE ROLE on backend
);

/* ================= APPLY ROUTE ================= */
router.post("/apply", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      city,
      monthly_jobs,
      lead_spend,
      team_size
    } = req.body;

    if (!name || !phone || !email || !city) {
      return res.status(400).json({ error: "Missing fields" });
    }

    /* ================= QUALIFICATION LOGIC ================= */
    let qualified = true;

    if (monthly_jobs === "0–5") qualified = false;
    if (lead_spend === "$0") qualified = false;

    /* ================= INSERT INTO SUPABASE ================= */
    const { error } = await supabase.from("applications").insert([
      {
        name,
        phone,
        email,
        city,
        monthly_jobs,
        lead_spend,
        team_size,
        qualified,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "DB insert failed" });
    }

    return res.json({ qualified });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;
