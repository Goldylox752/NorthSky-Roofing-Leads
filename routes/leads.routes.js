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
  try {
    const { name, email, phone, city } = req.body;

    const cleanEmail = email?.trim().toLowerCase();

    /* ===============================
       INPUT VALIDATION (CRITICAL FIX)
    =============================== */
    if (!cleanEmail && !phone) {
      return res.status(400).json({
        success: false,
        error: "Email or phone required",
      });
    }

    if (cleanEmail && !cleanEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    const idempotencyKey = buildKey(cleanEmail, phone, city);

    /* ===============================
       DUPLICATE PREVENTION
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
      });
    }

    /* ===============================
       LEAD SCORING ENGINE
    =============================== */
    const score = calculateScore({
      email: cleanEmail,
      phone,
      city,
    });

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

    /* ===============================
       CREATE STRIPE CHECKOUT SESSION
       (FULL SAFE VERSION)
    =============================== */
    let session;

    try {
      session = await createCheckoutSession({
        email: cleanEmail,
        leadId: lead.id,
        plan: tier,
        amount: price,
      });

    } catch (err) {
      console.error("Stripe checkout failed:", err);

      // rollback lead state
      await supabase
        .from("leads")
        .update({ status: "checkout_failed" })
        .eq("id", lead.id);

      throw err;
    }

    /* ===============================
       MARK PAYMENT STARTED
    =============================== */
    await supabase
      .from("leads")
      .update({
        status: "payment_started",
      })
      .eq("id", lead.id);

    /* ===============================
       RESPONSE TO FRONTEND
    =============================== */
    return res.json({
      success: true,
      lead,
      checkoutUrl: session.url,
      amount: price,
      tier,
    });

  } catch (err) {
    console.error("❌ LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;