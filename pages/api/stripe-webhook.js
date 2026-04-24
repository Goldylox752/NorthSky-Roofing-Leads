import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { PLAN_RULES } from "../../engine/planRules";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* =========================
   PLAN RESOLVER (SOURCE OF TRUTH)
========================= */
function getPlanFromPayment(session) {
  const linkId =
    session.payment_link ||
    session.payment_link_id ||
    session.metadata?.link_id;

  const match = Object.entries(PLAN_RULES).find(
    ([plan, config]) => config.stripeLink === linkId
  );

  return match?.[0] || "starter";
}

/* =========================
   PLAN CONFIG ENGINE
========================= */
function getPlanConfig(plan) {
  const config = {
    starter: {
      max_agents: 1,
      priority_level: 1,
      lead_speed: "standard",
      routing_mode: "basic_round_robin",
      agent_capacity: 5
    },

    pro: {
      max_agents: 5,
      priority_level: 2,
      lead_speed: "fast",
      routing_mode: "balanced",
      agent_capacity: 15
    },

    elite: {
      max_agents: 20,
      priority_level: 3,
      lead_speed: "instant",
      routing_mode: "ai_priority",
      agent_capacity: 50
    }
  };

  return config[plan] || config.starter;
}

/* =========================
   WEBHOOK HANDLER
========================= */
export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /* =========================
     IDEMPOTENCY (NO DUPLICATES)
  ========================= */
  const eventId = event.id;

  const { data: exists } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (exists) {
    return res.json({ skipped: true });
  }

  await supabase.from("stripe_events").insert({
    id: eventId,
    processed: true
  });

  /* =========================
     PAYMENT SUCCESS
  ========================= */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_details?.email;
    const plan = getPlanFromPayment(session);

    console.log("💰 Payment received:", email, plan);

    /* =========================
       USER UPSERT
    ========================= */
    await supabase.from("users").upsert({
      email,
      paid: true,
      plan,
      stripe_customer: session.customer
    });

    /* =========================
       CREATE ORGANIZATION
    ========================= */
    const { data: org } = await supabase
      .from("organizations")
      .insert({
        owner_email: email,
        plan,
        status: "active"
      })
      .select()
      .single();

    /* =========================
       APPLY PLAN CONFIG (OS BRAIN)
    ========================= */
    const planConfig = getPlanConfig(plan);

    await supabase.from("org_settings").insert({
      org_id: org.id,
      plan,
      max_agents: planConfig.max_agents,
      priority_level: planConfig.priority_level,
      lead_speed: planConfig.lead_speed,
      routing_mode: planConfig.routing_mode
    });

    /* =========================
       OPTIONAL AUTO AGENT
    ========================= */
    if (plan !== "starter") {
      await supabase.from("agents").insert({
        org_id: org.id,
        name: "Auto Agent 1",
        status: "online",
        capacity: planConfig.agent_capacity
      });
    }

    console.log("✅ OS provisioned for:", email);
  }

  return res.json({ received: true });
}