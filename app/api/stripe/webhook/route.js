import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ===============================
// ENV VALIDATION
// ===============================
const REQUIRED_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing ${key}`);
  }
});

// ===============================
// INIT
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// SAFE DB HELPERS
// ===============================
async function getEvent(eventId) {
  const { data, error } = await supabase
    .from("stripe_events")
    .select("id, status")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    console.error("getEvent error:", error);
    return null;
  }

  return data;
}

async function createEventLock(event) {
  const { error } = await supabase.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    status: "processing",
    locked_at: new Date().toISOString(),
  });

  if (error) {
    // duplicate event
    return { duplicate: true };
  }

  return { duplicate: false };
}

async function finalize(eventId, status, err = null) {
  const { error } = await supabase
    .from("stripe_events")
    .update({
      status,
      processed_at: new Date().toISOString(),
      error: err?.message || null,
    })
    .eq("id", eventId);

  if (error) {
    console.error("finalize error:", error);
  }
}

// ===============================
// EVENT HANDLER
// ===============================
async function handleEvent(event) {
  try {
    switch (event.type) {

      // =========================
      // PAYMENT SUCCESS
      // =========================
      case "checkout.session.completed": {
        const session = event.data.object;

        const email = session.customer_details?.email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const city = session.metadata?.city;

        if (!email) {
          console.warn("⚠️ Missing email in session");
          return;
        }

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

        await supabase.from("events").insert({
          type: "stripe.checkout.completed",
          contractor_id: contractor.id,
          payload: session,
        });

        break;
      }

      // =========================
      // SUB UPDATED
      // =========================
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

      // =========================
      // SUB DELETED
      // =========================
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
        console.log("Unhandled event:", event.type);
    }
  } catch (err) {
    console.error("❌ Handler error:", err);
    throw err;
  }
}

// ===============================
// WEBHOOK ENDPOINT
// ===============================
export async function POST(req) {
  let event;

  try {
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    const body = await req.text();

    // ===============================
    // VERIFY STRIPE SIGNATURE
    // ===============================
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // ===============================
    // IDEMPOTENCY CHECK
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
    console.error("❌ Webhook error:", err);

    if (event?.id) {
      await finalize(event.id, "failed", err);
    }

    return Response.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}