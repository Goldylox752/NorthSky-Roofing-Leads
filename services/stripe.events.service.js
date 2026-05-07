const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handleEvent(event) {
  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object;

      const email = session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const plan = session.metadata?.plan || "unknown";

      if (!email) throw new Error("Missing email");

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

      await supabase.from("billing_events").insert({
        type: "checkout.completed",
        email,
        payload: session,
      });

      break;
    }

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

    case "customer.subscription.deleted": {
      const sub = event.data.object;

      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          active: false,
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }

    default:
      console.log("Unhandled event:", event.type);
  }
}

module.exports = { handleEvent };