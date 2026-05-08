const router = require("express").Router();
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   VERIFY STRIPE PAYMENT SESSION
=============================== */
router.get("/verify", async (req, res) => {
  let session = null;

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        paid: false,
        error: "Missing session_id",
      });
    }

    /* ===============================
       FETCH STRIPE SESSION
    =============================== */
    session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session?.payment_status === "paid";

    if (!paid) {
      return res.json({
        success: true,
        paid: false,
      });
    }

    /* ===============================
       EXTRACT IDENTITY
    =============================== */
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      null;

    const leadIdFromMeta = session?.metadata?.leadId || null;

    let targetLeadId = leadIdFromMeta;

    /* ===============================
       FALLBACK LOOKUP (SAFE MATCH)
    =============================== */
    if (!targetLeadId && email) {
      const { data, error } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error("Lead lookup error:", error);
      }

      targetLeadId = data?.id || null;
    }

    /* ===============================
       UPDATE LEAD
    =============================== */
    if (targetLeadId) {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          paid: true,
          status: "paid",
          activated_at: new Date().toISOString(),
          stripe_session_id: session_id,
        })
        .eq("id", targetLeadId);

      if (updateError) {
        console.error("Lead update error:", updateError);
      }
    }

    /* ===============================
       RESPONSE
    =============================== */
    return res.json({
      success: true,
      paid: true,
      email,
      leadId: targetLeadId,
    });

  } catch (err) {
    console.error("❌ PAYMENT VERIFY ERROR:", {
      message: err.message,
      session_id: req.query?.session_id,
    });

    return res.status(500).json({
      success: false,
      paid: false,
      error: "verification_failed",
    });
  }
});

module.exports = router;