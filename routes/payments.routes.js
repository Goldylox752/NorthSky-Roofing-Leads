const router = require("express").Router();
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   CHECKOUT SESSION
=============================== */
router.post("/checkout", async (req, res) => {
  try {
    const { email, name, plan = "starter" } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing email",
      });
    }

    // Simple pricing map (adjust later)
    const amountMap = {
      starter: 100,
      pro: 200,
    };

    const amount = amountMap[plan] || 100;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Flow OS - ${plan}`,
              description: "Automated lead system access",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,

      metadata: {
        email,
        plan,
      },
    });

    return res.json({
      success: true,
      url: session.url,
    });

  } catch (err) {
    console.error("Checkout error:", err);

    return res.status(500).json({
      success: false,
      error: "checkout_failed",
    });
  }
});

/* ===============================
   VERIFY SESSION
=============================== */
router.get("/verify", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        paid: false,
        error: "Missing session_id",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session.payment_status === "paid";

    if (!paid) {
      return res.json({
        success: true,
        paid: false,
      });
    }

    const email = session.customer_details?.email || session.customer_email;

    if (email) {
      await supabase
        .from("leads")
        .update({
          paid: true,
          status: "paid",
          activated_at: new Date().toISOString(),
        })
        .eq("email", email.toLowerCase().trim());
    }

    return res.json({
      success: true,
      paid: true,
      email,
    });

  } catch (err) {
    console.error("Verify error:", err);

    return res.status(500).json({
      success: false,
      paid: false,
      error: "verification_failed",
    });
  }
});

module.exports = router;