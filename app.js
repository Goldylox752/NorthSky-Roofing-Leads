const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   CORS (CRITICAL FOR NEXT.JS)
=============================== */
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

/* ===============================
   STRIPE WEBHOOK (RAW FIRST)
=============================== */
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

/* ===============================
   JSON PARSER (AFTER WEBHOOK)
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
  res.json({ ok: true });
});

module.exports = app;