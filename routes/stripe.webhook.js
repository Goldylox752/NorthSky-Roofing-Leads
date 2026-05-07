router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        return res.status(400).send("Missing Stripe signature");
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Stripe signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      /* ===============================
         IDEMPOTENCY LOCK (CRITICAL)
      =============================== */
      const { data: existing } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("id", event.id)
        .maybeSingle();

      if (existing) {
        return res.json({ received: true, duplicate: true });
      }

      await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        status: "processing",
        created_at: new Date().toISOString(),
      });

      /* ===============================
         EVENT HANDLER
      =============================== */
      switch (event.type) {

        /* =========================
           PAYMENT SUCCESS
        ========================= */
        case "checkout.session.completed": {
          const session = event.data.object;

          const email =
            session.customer_details?.email ||
            session.customer_email;

          const leadId = session.metadata?.leadId;
          const plan = session.metadata?.plan || "starter";

          if (!email || !leadId) {
            throw new Error("Missing required webhook data");
          }

          const { error } = await supabase
            .from("leads")
            .update({
              email,
              plan,
              paid: true,
              status: "paid",
              stripe_customer_id: session.customer,
              activated_at: new Date().toISOString(),
            })
            .eq("id", leadId);

          if (error) throw error;

          console.log("✅ Payment confirmed:", email);

          break;
        }

        /* =========================
           SUBSCRIPTION UPDATED
        ========================= */
        case "customer.subscription.updated": {
          const sub = event.data.object;

          const plan =
            sub.items?.data?.[0]?.price?.nickname ||
            sub.items?.data?.[0]?.price?.id ||
            "pro";

          await supabase
            .from("leads")
            .update({
              subscription_status: sub.status,
              plan,
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
              status: "canceled",
              plan: "free",
            })
            .eq("stripe_customer_id", sub.customer);

          break;
        }

        default:
          console.log("Unhandled Stripe event:", event.type);
      }

      /* ===============================
         MARK EVENT COMPLETE
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
      console.error("❌ Webhook processing error:", err.message);

      await supabase
        .from("stripe_events")
        .update({
          status: "failed",
          error: err.message,
        })
        .eq("id", event.id);

      return res.status(500).json({
        error: "Webhook failed",
      });
    }
  }
);