require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// =====================
// INIT
// =====================
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================
// MIDDLEWARE
// =====================
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

// =====================
// LOGGING
// =====================
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// =====================
// HEALTH
// =====================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =====================
// VALIDATION
// =====================
function validateLead(body) {
  if (!body.email && !body.phone) {
    return "Email or phone required";
  }
  return null;
}

// =====================
// CREATE LEAD (SUPABASE)
// =====================
app.post("/api/leads", async (req, res) => {
  try {
    const error = validateLead(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    const { name, email, phone, city } = req.body;

    const { data, error: dbError } = await supabase
      .from("leads")
      .insert([
        {
          name,
          email,
          phone,
          city,
          status: "new",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error(dbError);

      return res.status(500).json({
        success: false,
        error: "Failed to store lead",
      });
    }

    return res.json({
      success: true,
      lead: data,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// =====================
// STRIPE CHECKOUT
// =====================
app.post("/api/checkout", async (req, res) => {
  try {
    const { leadId, amount } = req.body;

    if (!leadId || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing leadId or amount",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Lead Purchase",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        leadId,
      },
    });

    return res.json({
      success: true,
      url: session.url,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: "Stripe checkout failed",
    });
  }
});

// =====================
// STRIPE WEBHOOK (CRITICAL)
// =====================
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // =====================
    // PAYMENT SUCCESS
    // =====================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const leadId = session.metadata.leadId;

      await supabase
        .from("leads")
        .update({
          status: "paid",
        })
        .eq("id", leadId);
    }

    res.json({ received: true });
  }
);

// =====================
// 404
// =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// =====================
// START
// =====================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});