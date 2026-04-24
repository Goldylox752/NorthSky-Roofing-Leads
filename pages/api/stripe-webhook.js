// /api/webhook.js

import { buffer } from "micro";
import { stripe } from "../lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false
  }
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  let event;

  try {
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {
    console.error("Webhook verification failed:", err.message);

    return res.status(400).send(
      `Webhook Error: ${err.message}`
    );
  }

  try {
    /**
     * SUCCESSFUL CHECKOUT
     */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const sessionId = session.id;
      const email =
        session.customer_email ||
        session.metadata?.email ||
        null;

      const plan =
        session.metadata?.plan ||
        "starter";

      const customerId =
        session.customer || null;

      const subscriptionId =
        session.subscription || null;

      // 30-day access window (adjust if needed)
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase
        .from("verified_sessions")
        .upsert([
          {
            session_id: sessionId,
            email,
            plan,
            customer_id: customerId,
            subscription_id: subscriptionId,
            payment_status: "paid",
            created_at: new Date().toISOString(),
            expires_at: expiresAt
          }
        ]);

      if (error) {
        console.error("Supabase insert error:", error);
      }
    }

    /**
     * SUBSCRIPTION CANCELED
     */
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;

      await supabase
        .from("verified_sessions")
        .update({
          payment_status: "cancelled"
        })
        .eq("subscription_id", subscription.id);
    }

    /**
     * PAYMENT FAILED
     */
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;

      await supabase
        .from("verified_sessions")
        .update({
          payment_status: "past_due"
        })
        .eq("subscription_id", invoice.subscription);
    }

    /**
     * PAYMENT RECOVERED
     */
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      await supabase
        .from("verified_sessions")
        .update({
          payment_status: "paid"
        })
        .eq("subscription_id", invoice.subscription);
    }

    return res.status(200).json({
      received: true
    });

  } catch (err) {
    console.error("Webhook handler error:", err);

    return res.status(500).json({
      error: "Webhook handler failed"
    });
  }
}