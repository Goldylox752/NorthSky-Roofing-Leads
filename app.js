const express = require("express");
const cors = require("cors");

/* ===============================
   ROUTES
=============================== */
const leadsRoutes = require("./routes/leads.routes");
const stripeWebhook = require("./routes/stripe.webhook");

const app = express();

/* ===============================
   WEBHOOK MUST BE RAW (IMPORTANT)
=============================== */
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

/* ===============================
   GLOBAL MIDDLEWARE
=============================== */
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));

app.use(express.json());

/* ===============================
   ROUTES
=============================== */
app.use("/api/leads", leadsRoutes);
app.use("/api/stripe/webhook", stripeWebhook);

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running 🚀",
  });
});

app.get("/health", (req, res) => {
  res.json({
    healthy: true,
  });
});

/* ===============================
   404 HANDLER
=============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

module.exports = app;