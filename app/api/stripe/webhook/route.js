const router = require("express").Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   RAW BODY REQUIRED (CRITICAL)
=============================== */
router.post(
  "/",
  require("express").raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        return res.status(400).send("Missing signature");
      }

      /* ===============================
         VERIFY STRIPE SIGNATURE
      =============================== */
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      /* ===============================
         IDENTITY LOCK (NO DUPLICATES EVER)
      =============================== */
      const { data: existing } = await supabase
        .from("stripe_events")
        .select("*")
        .eq("id", event.id)
        .maybeSingle();

      if (existing?.status === "completed") {
        return res.json({ ok: true, duplicate: true });
      }

      /* insert event lock */
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

      await supabase
        .from("stripe_events")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      return res.json({ received: true });

    } catch (err) {
      console.error("Webhook error:", err);

      if (event?.id) {
        await supabase
          .from("stripe_events")
          .update({
            status: "failed",
            error: err.message,
          })
          .eq("id", event.id);
      }

      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);