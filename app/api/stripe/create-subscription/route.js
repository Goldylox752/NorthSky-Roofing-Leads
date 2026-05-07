const router = require("express").Router();
const stripe = require("../lib/stripe");
const crypto = require("crypto");

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
router.post("/checkout", async (req, res) => {
  try {
    const { email, name, plan, leadId } = req.body;

    /* ===============================
       VALIDATION
    =============================== */
    if (!email || !plan) {
      return res.status(400).json({
        success: false,
        stage: "validation",
        error: "Missing email or plan",
      });
    }

    const prices = {
      starter: 9900,
      growth: 19900,
      elite: 49900,
    };

    const amount = prices[plan];

    if (!amount) {
      return res.status(400).json({
        success: false,
        stage: "validation",
        error: "Invalid plan",
      });
    }

    /* ===============================
       IDEMPOTENCY KEY (PREVENT DUPLICATES)
    =============================== */
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(email + plan)
      .digest("hex");

    /* ===============================
       CREATE STRIPE SESSION
    =============================== */
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: email,

        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Flow OS - ${plan.toUpperCase()}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],

        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,

        /* ===============================
           CRITICAL: WEBHOOK LINKING DATA
        =============================== */
        metadata: {
          email,
          plan,
          leadId: leadId || null,
        },
      },
      {
        idempotencyKey,
      }
    );

    /* ===============================
       RESPONSE (FRONTEND SAFE)
    =============================== */
    return res.json({
      success: true,
      stage: "checkout_created",
      url: session.url,
      amount,
      plan,
    });

  } catch (err) {
    console.error("❌ Stripe checkout error:", err);

    return res.status(500).json({
      success: false,
      stage: "checkout_error",
      error: err.message,
    });
  }
});

module.exports = router;