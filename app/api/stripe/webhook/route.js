import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ===============================
// INIT
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// 🔐 IDEMPOTENCY CHECK (FIXED)
// ===============================
async function getEvent(eventId) {
  const { data } = await supabase
    .from("stripe_events")
    .select("id, status")
    .eq("id", eventId)
    .maybeSingle();

  return data;
}

async function createEventLock(event) {
  const { error } = await supabase
    .from("stripe_events")
    .insert({
      id: event.id,
      type: event.type,
      status: "processing",
      locked_at: new Date().toISOString(),
    });

  // if already exists → treat as duplicate safely
  if (error && error.code === "23505") {
    return { duplicate: true };
  }

  return { duplicate: false };
}

// ===============================
// FINALIZE STATE
// ===============================
async function finalize(eventId, status, error = null) {
  await supabase
    .from("stripe_events")
    .update({
      status,
      processed_at: new Date().toISOString(),
      error: error?.message || null,
    })
    .eq("id", eventId);
}

// ===============================
// STRIPE EVENT HANDLER
// ===============================
async function handleEvent(event) {
  switch (event.type) {

    // ===============================
    // PAYMENT SUCCESS
    // ===============================
    case "checkout.session.completed": {
      const session = event.data.object;

      const email = session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const city = session.metadata?.city;

      if (!email) return;

      const { data: contractor, error } = await supabase
        .from("contractors")
        .upsert(
          {
            email,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            active: true,
            plan: city ? "city_owner" : "pro",
            city: city || null,
          },
          { onConflict: "email" }
        )
        .select()
        .single();

      if (error) throw error;

      // log event (lightweight)
      await supabase.from("events").insert({
        type: "stripe.checkout.completed",
        contractor_id: contractor.id,
        payload: session,
      });

      break;
    }

    // ===============================
    // SUB UPDATED
    // ===============================
    case "customer.subscription.updated": {
      const sub = event.data.object;

      await supabase
        .from("contractors")
        .update({
          active: sub.status === "active",
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }

    // ===============================
    // SUB DELETED
    // ===============================
    case "customer.subscription.deleted": {
      const sub = event.data.object;

      await supabase
        .from("contractors")
        .update({
          active: false,
          plan: "free",
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }
  }
}

// ===============================
// MAIN WEBHOOK
// ===============================
export async function POST(req) {
  let event;

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // verify stripe signature
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // ===============================
    // IDEMPOTENCY GUARD (CLEAN VERSION)
    // ===============================
    const existing = await getEvent(event.id);

    if (existing?.status === "completed") {
      return Response.json({ ok: true, duplicate: true });
    }

    const lock = await createEventLock(event);

    if (lock.duplicate) {
      return Response.json({ ok: true, duplicate: true });
    }

    // ===============================
    // PROCESS EVENT
    // ===============================
    await handleEvent(event);

    await finalize(event.id, "completed");

    return Response.json({ received: true });

  } catch (err) {
    console.error("❌ Stripe webhook error:", err);

    if (event?.id) {
      await finalize(event.id, "failed", err);
    }

    return Response.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}