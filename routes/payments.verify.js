const router = require("express").Router();
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   VERIFY STRIPE PAYMENT SESSION
=============================== */
router.get("/verify", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ paid: false });
    }

    /* ===============================
       GET STRIPE SESSION
    =============================== */
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session.payment_status === "paid";

    if (!paid) {
      return res.json({ paid: false });
    }

    const email =
      session.customer_details?.email ||
      session.customer_email;

    const leadId = session.metadata?.leadId;

    /* ===============================
       FALLBACK: EMAIL LOOKUP (CRITICAL FIX)
    =============================== */
    let targetLeadId = leadId;

    if (!targetLeadId && email) {
      const { data } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      targetLeadId = data?.id;
    }

    /* ===============================
       UPDATE LEAD (SAFE)
    =============================== */
    if (targetLeadId) {
      const { error } = await supabase
        .from("leads")
        .update({
          paid: true,
          status: "paid",
          activated_at: new Date().toISOString(),
        })
        .eq("id", targetLeadId);

      if (error) {
        console.error("DB update error:", error);
      }
    }

    /* ===============================
       RESPONSE
    =============================== */
    return res.json({
      paid: true,
      email,
      leadId: targetLeadId || null,
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);

    return res.status(500).json({
      paid: false,
      error: "verification_failed",
    });
  }
});

module.exports = router;