import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.metadata?.email;
    const phone = session.metadata?.phone;
    const plan = session.metadata?.plan;

    // 🚨 ONLY ACCEPT VALID PLANS
    const validPlans = ["starter", "elite"];

    if (!email || !validPlans.includes(plan)) {
      return new Response("Invalid data", { status: 400 });
    }

    // 🔥 UPSERT USER / LEAD
    const { error } = await supabase.from("leads").upsert({
      email,
      phone,
      plan,
      status: "active",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase error:", error.message);
    }
  }

  return new Response("OK");
}
