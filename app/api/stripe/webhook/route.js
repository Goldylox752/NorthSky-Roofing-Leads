if (event.type === "checkout.session.completed") {
  const session = event.data.object;

  const userId = session.metadata.userId;
  const plan = session.metadata.plan;

  await supabase.from("profiles").update({
    subscription_status: "active",
    role: plan,
  }).eq("id", userId);
}

if (event.type === "customer.subscription.deleted") {
  const sub = event.data.object;

  await supabase.from("profiles").update({
    subscription_status: "inactive",
    role: "buyer",
  }).eq("stripe_subscription_id", sub.id);
}