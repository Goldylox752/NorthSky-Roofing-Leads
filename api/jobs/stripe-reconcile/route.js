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
// 🔁 SYNC CONTRACTOR SUBSCRIPTIONS
// ===============================
async function syncSubscriptions() {
  const subscriptions = await stripe.subscriptions.list({
    limit: 100,
    status: "all",
  });

  for (const sub of subscriptions.data) {
    const customerId = sub.customer;

    const { data: contractor } = await supabase
      .from("contractors")
      .select("*")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!contractor) continue;

    const shouldBeActive =
      sub.status === "active" || sub.status === "trialing";

    const dbMatches =
      contractor.active === shouldBeActive &&
      contractor.stripe_subscription_id === sub.id;

    if (dbMatches) continue;

    // 🔧 FIX DRIFT
    await supabase
      .from("contractors")
      .update({
        active: shouldBeActive,
        stripe_subscription_id: sub.id,
      })
      .eq("id", contractor.id);

    console.log(
      `🔄 Reconciled contractor ${contractor.id} → ${shouldBeActive ? "active" : "inactive"}`
    );
  }
}

// ===============================
// 💳 SYNC LATEST CHECKOUTS (OPTIONAL SAFETY NET)
// ===============================
async function syncRecentCheckouts() {
  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
  });

  for (const session of sessions.data) {
    if (session.payment_status !== "paid") continue;

    const email = session.customer_details?.email;
    if (!email) continue;

    const { data: contractor } = await supabase
      .from("contractors")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!contractor) {
      // 🧠 self-heal missing webhook insert
      await supabase.from("contractors").insert({
        email,
        stripe_customer_id: session.customer,
        active: true,
        plan: "pro",
      });

      console.log(`🧠 Recovered missing contractor: ${email}`);
    }
  }
}

// ===============================
// 🧹 OPTIONAL: CLEAN STRIPE EVENT DRIFT
// ===============================
async function reconcileEvents() {
  const { data: failedEvents } = await supabase
    .from("stripe_events")
    .select("*")
    .eq("status", "failed")
    .limit(50);

  for (const event of failedEvents || []) {
    console.log(`⚠️ Retry needed for event ${event.id}`);
    // optional: reprocess logic here later
  }
}

// ===============================
// MAIN JOB
// ===============================
export async function GET() {
  try {
    console.log("🚀 Stripe reconciliation job started");

    await syncSubscriptions();
    await syncRecentCheckouts();
    await reconcileEvents();

    console.log("✅ Stripe reconciliation complete");

    return Response.json({
      ok: true,
      message: "reconciled",
    });
  } catch (err) {
    console.error("❌ Reconciliation error:", err);

    return Response.json(
      { ok: false, error: "reconciliation failed" },
      { status: 500 }
    );
  }
}