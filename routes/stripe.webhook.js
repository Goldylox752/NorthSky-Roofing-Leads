const express = require("express");
const router = express.Router();

const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   STRIPE WEBHOOK
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        return res.status(400).json({ error: "Missing signature" });
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("Webhook:", event.type);

      /* ===============================
         ONLY HANDLE SUCCESS PAYMENTS
      =============================== */
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const leadId = session.metadata?.leadId;

        if (leadId) {
          await supabase
            .from("leads")
            .update({
              paid: true,
              status: "paid",
              activated_at: new Date().toISOString(),
            })
            .eq("id", leadId);
        }
      }

      return res.json({ received: true });

    } catch (err) {
      console.error("Webhook error:", err.message);

      return res.status(500).json({
        error: "webhook_failed",
      });
    }
  }
);

module.exports = router;