const express = require("express");
const cors = require("cors");

/* ===============================
   ROUTES
=============================== */
const leadsRoutes = require("./routes/leads.routes");
const paymentsRoutes = require("./routes/payments.routes");
const stripeWebhook = require("./routes/stripe.webhook");

const app = express();

/* ===============================
   SECURITY + CORS
=============================== */
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

/* ===============================
   REQUEST LOGGER (DEV + PROD DEBUGGING)
=============================== */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* ===============================
   STRIPE WEBHOOK ROUTE (RAW HANDLED INSIDE ROUTE FILE)
   IMPORTANT: DO NOT USE express.json BEFORE THIS ROUTE
=============================== */
app.use("/api/stripe/webhook", stripeWebhook);

/* ===============================
   GLOBAL JSON PARSER
=============================== */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===============================
   API ROUTES
=============================== */
app.use("/api/leads", leadsRoutes);
app.use("/api/payments", paymentsRoutes);

/* ===============================
   HEALTH CHECK (RENDER + MONITORING)
=============================== */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "API running 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    healthy: true,
    uptime: process.uptime(),
  });
});

/* ===============================
   404 HANDLER
=============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* ===============================
   GLOBAL ERROR HANDLER (CRITICAL)
=============================== */
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = app;