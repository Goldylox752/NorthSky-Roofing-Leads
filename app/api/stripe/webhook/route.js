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
   HANDLE EVENT
=============================== */
async function handleEvent(event) {
  if (event.type !== "checkout.session.completed") {
    return;
  }

  const session = event.data.object;

  const leadId = session.metadata?.leadId;
  const plan = session.metadata?.plan;

  if (!leadId || !plan) {
    throw new Error("Missing leadId or plan in metadata");
  }

  /* ===============================
     1. UPDATE LEAD
  =============================== */
  const { error: leadError } = await supabase
    .from("leads")
    .update({
      paid: true,
      plan,
      status: "paid",
      stripe_customer_id: session.customer || null,
    })
    .eq("id", leadId);

  if (leadError) throw leadError;

  /* ===============================
     2. CREATE PAYMENT RECORD (SOURCE OF TRUTH)
  =============================== */
  const { error: paymentError } = await supabase
    .from("payments")
    .insert({
      id: session.id,
      lead_id: leadId,
      stripe_customer_id: session.customer || null,
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      status: "paid",
      created_at: new Date().toISOString(),
    });

  if (paymentError && paymentError.code !== "23505") {
    // ignore duplicates, but fail real errors
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
         IDEMPOTENCY (SAFE FIRST INSERT)
      =============================== */
      const { data: existing } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("id", event.id)
        .maybeSingle();

      if (existing) {
        return res.json({ ok: true, duplicate: true });
      }

      const { error: insertError } = await supabase
        .from("stripe_events")
        .insert({
          id: event.id,
          type: event.type,
          status: "processing",
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        // if duplicate race happens
        if (insertError.code === "23505") {
          return res.json({ ok: true, duplicate: true });
        }
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