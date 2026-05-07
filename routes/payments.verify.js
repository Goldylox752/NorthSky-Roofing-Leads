const router = require("express").Router();
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

router.get("/verify", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ paid: false });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session.payment_status === "paid";

    if (!paid) {
      return res.json({ paid: false });
    }

    const email =
      session.customer_details?.email ||
      session.customer_email;

    const leadId = session.metadata?.leadId;

    if (leadId) {
      await supabase
        .from("leads")
        .update({
          paid: true,
          status: "paid",
        })
        .eq("id", leadId);
    }

    return res.json({
      paid: true,
      email,
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ paid: false });
  }
});

module.exports = router;