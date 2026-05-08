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
   HANDLE EVENT LOGIC
=============================== */
async function handleEvent(event) {
  if (event.type !== "checkout.session.completed") {
    console.log("Ignored event:", event.type);
    return;
  }

  const session = event.data.object;

  const leadId = session.metadata?.leadId;
  const plan = session.metadata?.plan;

  if (!leadId || !plan) {
    console.error("Invalid metadata:", session.metadata);
    throw new Error("Missing leadId or plan in metadata");
  }

  const customerId =
    session.customer ||
    session.customer_details?.email ||
    null;

  const amount = (session.amount_total || 0) / 100;

  /* ===============================
     1. UPDATE LEAD
  =============================== */
  const { error: leadError } = await supabase
    .from("leads")
    .update({
      paid: true,
      plan,
      status: "paid",
      stripe_customer_id: customerId,
    })
    .eq("id", leadId);

  if (leadError) {
    console.error("Lead update failed:", leadError);
    throw leadError;
  }

  /* ===============================
     2. CREATE PAYMENT RECORD
  =============================== */
  const { error: paymentError } = await supabase
    .from("payments")
    .upsert(
      {
        id: session.id,
        lead_id: leadId,
        stripe_customer_id: customerId,
        amount,
        currency: session.currency || "usd",
        status: "paid",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (paymentError) {
    console.error("Payment insert failed:", paymentError);
    throw paymentError;
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
         VERIFY STRIPE EVENT
      =============================== */
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("[StripeWebhook]", event.id, event.type);

      /* ===============================
         IDEMPOTENCY (UPsert = SAFE)
      =============================== */
      const { error: insertError } = await supabase
        .from("stripe_events")
        .upsert(
          {
            id: event.id,
            type: event.type,
            status: "processing",
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (insertError) {
        console.error("Event insert failed:", insertError);
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