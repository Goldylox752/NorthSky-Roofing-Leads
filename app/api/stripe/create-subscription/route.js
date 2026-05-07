const router = require("express").Router();
const stripe = require("../lib/stripe");

/* ===============================
   CREATE CHECKOUT FROM LEAD
=============================== */
router.post("/checkout", async (req, res) => {
  try {
    const { email, name, plan } = req.body;

    if (!email || !plan) {
      return res.status(400).json({
        success: false,
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
        error: "Invalid plan",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Flow OS ${plan}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/success`,
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
    console.error("Stripe checkout error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;