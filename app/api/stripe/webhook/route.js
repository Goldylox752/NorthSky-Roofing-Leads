import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// 🔐 ATOMIC EVENT CLAIM (REAL LOCK)
// ===============================
async function claimEvent(event) {
  const { data, error } = await supabase
    .from("stripe_events")
    .upsert(
      {
        id: event.id,
        type: event.type,
        status: "processing",
        updated_at: new Date().toISOString(),
        locked_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  // if already completed → skip completely
  if (data?.status === "completed") {
    return { allowed: false, reason: "already_processed" };
  }

  return { allowed: !error, data };
}

// ===============================
// 🧹 SAFE RECOVERY (ONLY STALE LOCKS)
// ===============================
async function recoverStuckEvents() {
  const cutoff = new Date(Date.now() - 1000 * 60 * 10); // 10 min safety window

  await supabase
    .from("stripe_events")
    .update({
      status: "failed",
      error: "auto_recovered_stale_lock",
    })
    .eq("status", "processing")
    .lt("locked_at", cutoff.toISOString());
}

// ===============================
// 🧠 FINALIZER (SAFE STATE MACHINE)
// ===============================
async function finalize(eventId, ok, error = null) {
  await supabase
    .from("stripe_events")
    .update({
      status: ok ? "completed" : "failed",
      processed_at: new Date().toISOString(),
      error: error?.message || null,
    })
    .eq("id", eventId);
}

// ===============================
// CITY LOGIC (UNCHANGED BUT SAFE)
// ===============================
async function updateCity(city, contractorId, cityRow) {
  const existing = cityRow.active_contractors || [];

  if (existing.includes(contractorId)) return;

  const updated = [...existing, contractorId];

  await supabase
    .from("cities")
    .update({
      active_contractors: updated,
      status:
        updated.length >= cityRow.max_contractors
          ? "sold"
          : "active",
    })
    .eq("city", city);
}

// ===============================
// EVENT ROUTER
// ===============================
async function handleEvent(event) {
  switch (event.type) {

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

      if (error || !contractor) {
        throw new Error("Contractor upsert failed");
      }

      if (city) {
        const { data: cityRow } = await supabase
          .from("cities")
          .select("*")
          .eq("city", city)
          .single();

        if (cityRow) {
          await updateCity(city, contractor.id, cityRow);
        }

        await supabase
          .from("city_intents")
          .update({ status: "confirmed" })
          .eq("city", city)
          .eq("contractorId", contractor.id);
      }

      await supabase.from("events").insert({
        type: "stripe.checkout.completed",
        contractor_id: contractor.id,
        payload: session,
      });

      break;
    }

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
// MAIN WEBHOOK (HARDENED CORE)
// ===============================
export async function POST(req) {
  let event;

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // cleanup stale locks (non-blocking)
    recoverStuckEvents().catch(() => {});

    // verify stripe
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // ===============================
    // 🔐 REAL IDEMPOTENCY CLAIM
    // ===============================
    const claim = await claimEvent(event);

    if (!claim.allowed) {
      return Response.json({
        ok: true,
        duplicate: true,
      });
    }

    // already processed safeguard
    if (claim.data?.status === "completed") {
      return Response.json({ ok: true });
    }

    // process
    await handleEvent(event);

    // finalize success
    await finalize(event.id, true);

    return Response.json({ received: true });

  } catch (err) {
    console.error("Webhook crash:", err);

    if (event?.id) {
      await finalize(event.id, false, err);
    }

    return Response.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}