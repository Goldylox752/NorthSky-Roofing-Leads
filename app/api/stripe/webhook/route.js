const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

/* ===============================
   INIT
=============================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   EVENT HANDLER
=============================== */
async function handleEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      const leadId = session.metadata?.leadId;
      const plan = session.metadata?.plan;

      if (!leadId || !plan || !session.customer) {
        throw new Error("Missing required session metadata");
      }

      const { error, data } = await supabase
        .from("leads")
        .update({
          paid: true,
          plan,
          status: "paid",
          stripe_customer_id: session.customer,
        })
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Lead not found");
      }

      break;
    }

    default:
      console.log("Unhandled event:", event.type);
  }
}

/* ===============================
   WEBHOOK ROUTE
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];
      if (!sig) {
        return res.status(400).json({ error: "Missing Stripe signature" });
      }

      /* ===============================
         VERIFY STRIPE SIGNATURE
      =============================== */
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("[StripeWebhook]", {
        id: event.id,
        type: event.type,
      });

      /* ===============================
         IDEMPOTENCY (RACE-SAFE INSERT)
      =============================== */
      const { error: insertError } = await supabase
        .from("stripe_events")
        .insert({
          id: event.id,
          type: event.type,
          status: "processing",
          created_at: new Date().toISOString(),
        });

      // Duplicate event → already processed or in-flight
      if (insertError && insertError.code === "23505") {
        return res.json({ ok: true, duplicate: true });
      }

      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      /* ===============================
         PROCESS EVENT
      =============================== */
      await handleEvent(event);

      /* ===============================
         MARK COMPLETE
      =============================== */
      await supabase
        .from("stripe_events")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return res.json({ received: true });

    } catch (err) {
      console.error("❌ Webhook error:", err);

      if (event?.id) {
        await supabase
          .from("stripe_events")
          .update({
            status: "failed",
            error: err.message,
          })
          .eq("id", event.id);
      }

      return res.status(500).json({
        error: "Webhook failed",
      });
    }
  }
);

module.exports = router;