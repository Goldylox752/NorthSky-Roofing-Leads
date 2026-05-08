const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   TRUST PROXY (RENDER / VERCEL SAFE)
=============================== */
app.set("trust proxy", 1);

/* ===============================
   CORS (PRODUCTION SAFE + FALLBACK)
=============================== */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* ===============================
   HOME PAGE (NEW)
=============================== */
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>NorthSky Flow OS</title>
        <style>
          body {
            margin: 0;
            font-family: Arial;
            background: #0f172a;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .card {
            text-align: center;
            background: #1e293b;
            padding: 40px;
            border-radius: 16px;
            max-width: 500px;
          }
          .btn {
            margin-top: 20px;
            display: inline-block;
            padding: 12px 18px;
            background: #22c55e;
            color: white;
            text-decoration: none;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 NorthSky Flow OS</h1>
          <p>AI Lead Automation + Stripe Payments Engine</p>
          <a class="btn" href="/health">System Status</a>
        </div>
      </body>
    </html>
  `);
});

/* ===============================
   STRIPE WEBHOOK (RAW BODY FIRST)
=============================== */
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);

/* ===============================
   BODY PARSER (AFTER WEBHOOK)
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
   404 HANDLER
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
   GLOBAL ERROR HANDLER
=============================== */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = app;