const router = require("express").Router();
const crypto = require("crypto");

const supabase = require("../lib/supabase");
const { buildKey } = require("../utils/idempotency");
const { calculateScore, getTier } = require("../utils/scoring");
const { calculatePrice } = require("../services/pricingEngine");
const { createCheckoutSession } = require("../services/stripeCheckout");

/* ===============================
   CREATE LEAD + STRIPE CHECKOUT
=============================== */
router.post("/", async (req, res) => {
  let leadId = null;

  try {
    const { name, email, phone, city } = req.body;

    const cleanEmail = email?.trim().toLowerCase();

    /* ===============================
       VALIDATION
    =============================== */
    if (!cleanEmail && !phone) {
      return res.status(400).json({
        success: false,
        stage: "validation",
        error: "Email or phone required",
      });
    }

    if (cleanEmail && !cleanEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        stage: "validation",
        error: "Invalid email format",
      });
    }

    const idempotencyKey = buildKey(cleanEmail, phone, city);

    /* ===============================
       DUPLICATE CHECK
    =============================== */
    const { data: existing } = await supabase
      .from("leads")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      return res.json({
        success: true,
        duplicate: true,
        lead: existing,
        checkoutUrl: null,
      });
    }

    /* ===============================
       SCORING + PRICING
    =============================== */
    const score = calculateScore({ email: cleanEmail, phone, city });
    const tier = getTier(score);
    const price = calculatePrice(score, city);

    /* ===============================
       CREATE LEAD (PENDING PAYMENT)
    =============================== */
    const { data: lead, error } = await supabase
      .from("leads")
      .insert([
        {
          id: crypto.randomUUID(),
          name: name || null,
          email: cleanEmail,
          phone: phone || null,
          city: city || null,

          status: "pending_payment",
          score,
          tier,
          price,

          idempotency_key: idempotencyKey,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    leadId = lead.id;

    /* ===============================
       CREATE STRIPE SESSION
    =============================== */
    const session = await createCheckoutSession({
      email: cleanEmail,
      leadId: lead.id,
      plan: tier,
      amount: price,
    });

    if (!session?.url) {
      throw new Error("Stripe session failed to return URL");
    }

    /* ===============================
       UPDATE STATE → PAYMENT STARTED
    =============================== */
    await supabase
      .from("leads")
      .update({
        status: "payment_started",
      })
      .eq("id", lead.id);

    /* ===============================
       SUCCESS RESPONSE (CONSISTENT)
    =============================== */
    return res.json({
      success: true,
      stage: "checkout_created",
      lead,
      checkoutUrl: session.url,
      tier,
      amount: price,
    });

  } catch (err) {
    console.error("❌ LEAD FLOW ERROR:", err);

    /* ===============================
       SAFE FAILURE STATE UPDATE
    =============================== */
    if (leadId) {
      await supabase
        .from("leads")
        .update({
          status: "checkout_failed",
        })
        .eq("id", leadId);
    }

    return res.status(500).json({
      success: false,
      stage: "server_error",
      error: err.message || "Server error",
    });
  }
});

module.exports = router;