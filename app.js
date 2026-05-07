const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   TRUST PROXY (IMPORTANT FOR RENDER / PRODUCTION)
=============================== */
app.set("trust proxy", 1);

/* ===============================
   CORS (SAFE + PRODUCTION READY)
=============================== */
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

/* ===============================
   STRIPE WEBHOOK (MUST BE RAW FIRST)
   ⚠️ DO NOT MOVE THIS BELOW express.json()
=============================== */
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);

/* ===============================
   JSON PARSER (AFTER WEBHOOK ONLY)
=============================== */
app.use(express.json());

/* ===============================
   ROUTES
=============================== */
app.use("/api/leads", require("./routes/leads.routes"));
app.use("/api/payments", require("./routes/payments.routes"));
app.use("/api/stripe/webhook", require("./routes/stripe.webhook"));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "northsky-flow-os",
    time: new Date().toISOString(),
  });
});

/* ===============================
   404 HANDLER (IMPORTANT FOR DEBUGGING)
=============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

module.exports = app;