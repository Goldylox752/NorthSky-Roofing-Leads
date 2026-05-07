const router = require("express").Router();
const crypto = require("crypto");

const { supabase } = require("../services/supabase");
const { buildKey } = require("../utils/idempotency");
const { calculateScore, getTier } = require("../utils/scoring");
const { calculatePrice } = require("../services/pricingEngine");

// CREATE LEAD
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone required" });
    }

    const idempotencyKey = buildKey(email, phone, city);

    // CHECK DUPLICATE
    const { data: existing } = await supabase
      .from("leads")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, duplicate: true, lead: existing });
    }

    // SCORE
    const score = calculateScore({ email, phone, city });
    const tier = getTier(score);
    const price = calculatePrice(score, city);

    // INSERT LEAD
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        city,
        status: "new",
        score,
        tier,
        price,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      lead,
      checkout: {
        endpoint: "/api/checkout",
        leadId: lead.id,
        amount: price,
      },
    });

  } catch (err) {
    console.error("LEAD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;