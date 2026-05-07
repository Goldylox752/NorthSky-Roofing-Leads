const router = require("express").Router();
const crypto = require("crypto");

const supabase = require("../lib/supabase");
const { buildKey } = require("../utils/idempotency");
const { calculateScore, getTier } = require("../utils/scoring");
const { calculatePrice } = require("../services/pricingEngine");

/* ===============================
   CREATE LEAD
=============================== */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail && !phone) {
      return res.status(400).json({
        success: false,
        error: "Email or phone required",
      });
    }

    /* ===============================
       IDEMPOTENCY KEY
    =============================== */
    const idempotencyKey = buildKey(cleanEmail, phone, city);

    /* ===============================
       CHECK EXISTING LEAD
    =============================== */
    const { data: existing, error: findError } = await supabase
      .from("leads")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (findError) {
      console.error("Lookup error:", findError);
      throw findError;
    }

    if (existing) {
      return res.json({
        success: true,
        duplicate: true,
        lead: existing,
      });
    }

    /* ===============================
       SCORING ENGINE
    =============================== */
    const score = calculateScore({ email: cleanEmail, phone, city });
    const tier = getTier(score);
    const price = calculatePrice(score, city);

    /* ===============================
       CREATE LEAD
    =============================== */
    const { data: lead, error } = await supabase
      .from("leads")
      .insert([
        {
          id: crypto.randomUUID(),
          name: name || null,
          email: cleanEmail || null,
          phone: phone || null,
          city: city || null,

          status: "new",
          score,
          tier,
          price,

          idempotency_key: idempotencyKey,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }

    /* ===============================
       RESPONSE
    =============================== */
    return res.json({
      success: true,
      lead,
      checkout: {
        endpoint: "/api/payments/checkout",
        leadId: lead.id,
        amount: price,
        tier,
      },
    });

  } catch (err) {
    console.error("LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;