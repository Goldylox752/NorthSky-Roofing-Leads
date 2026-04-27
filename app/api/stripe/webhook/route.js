import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const event = req.body;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_details.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    await supabase.from("subscribers").upsert([
      {
        email,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: "active",
      },
    ]);
  }

  res.json({ received: true });
}