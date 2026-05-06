import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/* ===============================
   ENV CHECK
=============================== */
const REQUIRED_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing ENV: ${key}`);
  }
}

/* ===============================
   INIT
=============================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   SAFE EVENT LOCK
=============================== */
async function lockEvent(event) {
  const { error } = await supabase.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    status: "processing",
    created_at: new Date().toISOString(),
  });

  if (error) {
    return { locked: false }; // duplicate
  }

  return { locked: true };
}

/* ===============================
   FINALIZE EVENT
=============================== */
async function finalize(eventId, status, error = null) {
  await supabase
    .from("stripe_events")
    .update({
      status,
      error: error?.message || null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

/* ===============================
   EVENT HANDLER
=============================== */
async function handleEvent(event) {
  switch (event.type) {

    /* =========================
       CHECKOUT SUCCESS
    ========================= */
    case "checkout.session.completed": {
      const session = event.data.object;

      const email = session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const city = session.metadata?.city || null;

      if (!email) {
        throw new Error("Missing customer email");
      }

      const { data, error } = await supabase
        .from("contractors")
        .upsert(
          {
            email,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            active: true,
            plan: city ? "city_owner" : "pro",
            city,
          },
          { onConflict: "email" }
        )
        .select()
        .single();

      if (error) throw error;

      await supabase.from("events").insert({
        type: "stripe.checkout.completed",
        contractor_id: data.id,
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
        .from("contractors")
        .update({
          active: sub.status === "active",
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }

    /* =========================
       SUB DELETED
    ========================= */
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

    default:
      console.log("Unhandled Stripe event:", event.type);
  }
}

/* ===============================
   WEBHOOK ROUTE
=============================== */
export async function POST(req) {
  let event;

  try {
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    const rawBody = await req.text();

    /* =========================
       VERIFY STRIPE SIGNATURE
    ========================= */
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    /* =========================
       IDEMPOTENCY CHECK
    ========================= */
    const { data: existing } = await supabase
      .from("stripe_events")
      .select("id, status")
      .eq("id", event.id)
      .maybeSingle();

    if (existing?.status === "completed") {
      return Response.json({ ok: true, duplicate: true });
    }

    const lock = await lockEvent(event);

    if (!lock.locked) {
      return Response.json({ ok: true, duplicate: true });
    }

    /* =========================
       PROCESS
    ========================= */
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