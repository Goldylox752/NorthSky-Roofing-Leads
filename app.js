const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   TRUST PROXY (RENDER / VERCEL SAFE)
=============================== */
app.set("trust proxy", 1);

/* ===============================
   CORS (PRODUCTION SAFE)
=============================== */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* ===============================
   STRIPE WEBHOOK (RAW BODY FIRST)
   ⚠️ MUST BE BEFORE express.json()
=============================== */
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);

/* ===============================
   BODY PARSER (AFTER WEBHOOK ONLY)
=============================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   ROUTES
=============================== */
app.use("/api/leads", require("./routes/leads.routes"));
app.use("/api/payments", require("./routes/payments.routes"));
app.use("/api/billing", require("./routes/billing.routes"));
app.use("/api/stripe/webhook", require("./routes/stripe.webhook"));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "northsky-flow-os",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

/* ===============================
   404 HANDLER (DEBUG FRIENDLY)
=============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

/* ===============================
   GLOBAL ERROR HANDLER (IMPORTANT FIX)
=============================== */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = app;