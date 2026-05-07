const router = require("express").Router();
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   IMPORTANT: RAW BODY REQUIRED
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

    } catch (err) {
      console.error("❌ Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    /* ===============================
       HANDLE EVENT
    =============================== */
    try {
      switch (event.type) {

        /* =========================
           PAYMENT SUCCESS
        ========================= */
        case "checkout.session.completed": {
          const session = event.data.object;

          const email = session.customer_details?.email;
          const plan = session.metadata?.plan || "starter";

          if (!email) {
            throw new Error("Missing email in session");
          }

          // UPSERT USER / LEAD
          const { data, error } = await supabase
            .from("leads")
            .upsert(
              {
                email,
                plan,
                paid: true,
                stripe_customer_id: session.customer,
              },
              { onConflict: "email" }
            )
            .select()
            .single();

          if (error) throw error;

          console.log("✅ User activated:", data);

          break;
        }

        /* =========================
           SUBSCRIPTION UPDATED
        ========================= */
        case "customer.subscription.updated": {
          const sub = event.data.object;

          await supabase
            .from("leads")
            .update({
              subscription_status: sub.status,
              plan: sub.items.data[0]?.price?.nickname || "pro",
            })
            .eq("stripe_customer_id", sub.customer);

          break;
        }

        /* =========================
           SUBSCRIPTION CANCELED
        ========================= */
        case "customer.subscription.deleted": {
          const sub = event.data.object;

          await supabase
            .from("leads")
            .update({
              active: false,
              plan: "free",
            })
            .eq("stripe_customer_id", sub.customer);

          break;
        }

        default:
          console.log("Unhandled event:", event.type);
      }

      res.json({ received: true });

    } catch (err) {
      console.error("❌ Webhook processing error:", err);

      res.status(500).json({
        error: "Webhook handler failed",
      });
    }
  }
);

module.exports = router;