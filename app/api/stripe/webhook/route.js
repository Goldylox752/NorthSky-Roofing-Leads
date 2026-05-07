const router = require("express").Router();
const express = require("express");
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
   EVENT HANDLER (SEPARATED)
=============================== */
async function handleEvent(event) {
  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object;

      const email = session.metadata?.email;
      const leadId = session.metadata?.leadId;
      const plan = session.metadata?.plan;

      if (!leadId) throw new Error("Missing leadId");

      const { error } = await supabase
        .from("leads")
        .update({
          paid: true,
          plan,
          status: "paid",
          stripe_customer_id: session.customer,
        })
        .eq("id", leadId);

      if (error) throw error;

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
        return res.status(400).json({
          error: "Missing Stripe signature",
        });
      }

      /* ===============================
         VERIFY SIGNATURE
      =============================== */
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      /* ===============================
         IDEMPOTENCY CHECK
      =============================== */
      const { data: existing } = await supabase
        .from("stripe_events")
        .select("id, status")
        .eq("id", event.id)
        .maybeSingle();

      if (existing?.status === "completed") {
        return res.json({
          ok: true,
          duplicate: true,
        });
      }

      /* ===============================
         INSERT EVENT LOCK
      =============================== */
      await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        status: "processing",
        created_at: new Date().toISOString(),
      });

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