async function handleEvent(event) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  switch (event.type) {

    /* =========================
       PAYMENT SUCCESS
    ========================= */
    case "checkout.session.completed": {
      const session = event.data.object;

      const email = session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription || null;
      const plan = session.metadata?.plan || "unknown";

      if (!email) throw new Error("Missing email in session");

      /* UPSERT SUBSCRIPTION */
      const { data, error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            email,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: "active",
            active: true,
          },
          { onConflict: "email" }
        )
        .select()
        .single();

      if (error) throw error;

      /* AUDIT LOG */
      await supabase.from("billing_events").insert({
        type: "checkout.completed",
        email,
        payload: session,
      });

      break;
    }

    /* =========================
       SUB UPDATED
    ========================= */
    case "customer.subscription.updated": {
      const sub = event.data.object;

      await supabase
        .from("subscriptions")
        .update({
          status: sub.status,
          active: sub.status === "active",
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }

    /* =========================
       SUB CANCELLED
    ========================= */
    case "customer.subscription.deleted": {
      const sub = event.data.object;

      await supabase
        .from("subscriptions")
        .update({
          active: false,
          status: "canceled",
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }

    default:
      console.log("Unhandled event:", event.type);
  }
}

module.exports = router;