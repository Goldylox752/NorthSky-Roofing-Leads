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
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
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

      switch (event.type) {

        case "checkout.session.completed": {
          const session = event.data.object;

          const email =
            session.customer_details?.email ||
            session.customer_email ||
            null;

          if (!email) throw new Error("Missing email");

          const { error } = await supabase.from("leads").upsert({
            email,
            plan: session.metadata?.plan || "starter",
            paid: true,
            stripe_customer_id: session.customer,
          });

          if (error) throw error;

          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object;

          await supabase.from("leads").update({
            subscription_status: sub.status,
            plan: sub.items.data[0]?.price?.id || "pro",
          }).eq("stripe_customer_id", sub.customer);

          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object;

          await supabase.from("leads").update({
            active: false,
            plan: "free",
          }).eq("stripe_customer_id", sub.customer);

          break;
        }
      }

      await supabase.from("stripe_events").update({
        status: "completed",
        processed_at: new Date().toISOString(),
      }).eq("id", event.id);

      return res.json({ received: true });

    } catch (err) {
      await supabase.from("stripe_events").update({
        status: "failed",
        error: err.message,
      }).eq("id", event.id);

      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);