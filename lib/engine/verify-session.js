import { stripe } from "../lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(200).json({
        valid: false
      });
    }

    /**
     * STEP 1:
     * Verify directly with Stripe first
     */
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || session.payment_status !== "paid") {
      return res.status(200).json({
        valid: false
      });
    }

    /**
     * STEP 2:
     * Verify against Supabase webhook record
     */
    const { data } = await supabase
      .from("verified_sessions")
      .select("*")
      .eq("session_id", session_id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!data) {
      return res.status(200).json({
        valid: false
      });
    }

    /**
     * STEP 3:
     * Unlock access
     */
    return res.status(200).json({
      valid: true,
      email: data.email,
      plan: data.plan
    });

  } catch (err) {
    console.error("Verify Session Error:", err);

    return res.status(200).json({
      valid: false
    });
  }
}
