const router = require("express").Router();
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   CREATE BILLING PORTAL SESSION
=============================== */
router.post("/portal", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing email",
      });
    }

    /* ===============================
       FIND USER
    =============================== */
    const { data: user } = await supabase
      .from("leads")
      .select("stripe_customer_id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (!user?.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: "No Stripe customer found",
      });
    }

    /* ===============================
       CREATE STRIPE PORTAL SESSION
    =============================== */
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    return res.json({
      success: true,
      url: session.url,
    });

  } catch (err) {
    console.error("Billing portal error:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to create portal session",
    });
  }
});

module.exports = router;