import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ===============================
// INIT CLIENTS
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// CITY STATE CHECK (READ ONLY)
// ===============================
async function getCityState(city) {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("city", city)
    .single();

  if (error) return null;
  return data;
}

// ===============================
// CITY ELIGIBILITY ENGINE
// ===============================
function validateCityAvailability(cityRow, planTier) {
  if (!cityRow) return { ok: true };

  const count = cityRow.active_contractors?.length || 0;

  // EXCLUSIVE = 1 owner only
  if (planTier === "exclusive" && count >= 1) {
    return { ok: false, reason: "exclusive_sold" };
  }

  // PRIORITY = limited pool
  if (planTier === "priority" && count >= 3) {
    return { ok: false, reason: "priority_full" };
  }

  return { ok: true };
}

// ===============================
// TEMP CITY RESERVATION (LOCK)
// ===============================
async function reserveCityIntent({ city, planTier, contractorId }) {
  const { error } = await supabase.from("city_intents").insert({
    city,
    planTier,
    contractorId: contractorId || null,
    status: "pending_payment",
    locked_at: new Date().toISOString(),
    lock_expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 min lock
  });

  if (error) {
    throw new Error("City reservation failed");
  }
}

// ===============================
// MAIN CHECKOUT HANDLER
// ===============================
export async function POST(req) {
  try {
    const {
      priceId,
      email,
      city,
      contractorId,
      planTier = "basic",
      mode = "payment",
      metadata = {},
    } = await req.json();

    // ===============================
    // VALIDATION
    // ===============================
    if (!priceId || !city) {
      return Response.json(
        { success: false, error: "Missing priceId or city" },
        { status: 400 }
      );
    }

    const cityRow = await getCityState(city);

    const validation = validateCityAvailability(cityRow, planTier);

    if (!validation.ok) {
      return Response.json(
        {
          success: false,
          error: "City unavailable",
          reason: validation.reason,
        },
        { status: 409 }
      );
    }

    // ===============================
    // RESERVE CITY BEFORE PAYMENT
    // ===============================
    await reserveCityIntent({
      city,
      planTier,
      contractorId,
    });

    // ===============================
    // CREATE STRIPE SESSION
    // ===============================
    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      customer_email: email || undefined,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,

      // ===============================
      // MARKETPLACE INTENT SYSTEM
      // ===============================
      metadata: {
        system: "roofflow_marketplace",
        city,
        planTier,
        contractorId: contractorId || null,
        intent: "city_purchase",
        lock: "true",
        ...metadata,
      },
    });

    return Response.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      city,
      planTier,
    });

  } catch (err) {
    console.error("🔥 Checkout engine error:", err);

    return Response.json(
      {
        success: false,
        error: "Checkout failed",
      },
      { status: 500 }
    );
  }
}