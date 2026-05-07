require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   BASIC SECURITY / MIDDLEWARE
=============================== */
app.use(cors({
  origin: process.env.FRONTEND_URL,
}));

app.use(express.json());

/* ===============================
   HEALTH CHECK (IMPORTANT)
=============================== */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Flow OS API",
    time: new Date().toISOString(),
  });
});

/* ===============================
   ROUTES
=============================== */

// Example routes (you will plug yours in)
const leadsRoutes = require("./routes/leads.routes");
const paymentsRoutes = require("./routes/payments.routes");
const stripeWebhook = require("./routes/stripe.webhook");

app.use("/api/leads", leadsRoutes);
app.use("/api/payments", paymentsRoutes);

/* Stripe webhook MUST use raw body */
app.use("/api/stripe/webhook", stripeWebhook);

/* ===============================
   START SERVER
=============================== */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});