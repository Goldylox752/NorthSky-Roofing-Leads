require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

// =====================
// CONFIG
// =====================
const PORT = process.env.PORT || 3001;

// =====================
// BASIC SECURITY HEADERS (lightweight)
// =====================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// =====================
// CORS (tighten later)
// =====================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "1mb" }));

// =====================
// REQUEST ID + LOGGER
// =====================
app.use((req, res, next) => {
  req.id = crypto.randomUUID();

  console.log(
    JSON.stringify({
      id: req.id,
      time: new Date().toISOString(),
      method: req.method,
      path: req.url,
    })
  );

  next();
});

// =====================
// SIMPLE IN-MEMORY RATE LIMIT
// (upgrade to Redis later)
// =====================
const ipHits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  const data = ipHits.get(ip) || { count: 0, reset: now + 60000 };

  if (now > data.reset) {
    data.count = 0;
    data.reset = now + 60000;
  }

  data.count += 1;
  ipHits.set(ip, data);

  if (data.count > 30) {
    return res.status(429).json({
      success: false,
      error: "Too many requests",
    });
  }

  next();
}

app.use(rateLimit);

// =====================
// HEALTH CHECK
// =====================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: Date.now(),
  });
});

// =====================
// VALIDATION (STRONGER)
// =====================
function validateLead(body) {
  const { email, phone, name } = body;

  if (!email && !phone) return "Email or phone required";

  if (email && !email.includes("@")) return "Invalid email";

  if (phone && phone.length < 7) return "Invalid phone number";

  if (name && name.length > 80) return "Name too long";

  return null;
}

// =====================
// LEADS ENDPOINT
// =====================
app.post("/api/leads", async (req, res) => {
  try {
    const error = validateLead(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error,
        requestId: req.id,
      });
    }

    const { name, email, phone, city } = req.body;

    const leadId = `lead_${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}`;

    const lead = {
      id: leadId,
      name: name || null,
      email: email || null,
      phone: phone || null,
      city: city || null,
      status: "new",
      createdAt: new Date().toISOString(),
      requestId: req.id,
    };

    // =====================
    // LOG (structured)
    // =====================
    console.log("📩 NEW_LEAD", lead);

    return res.status(200).json({
      success: true,
      message: "Lead created",
      lead,
    });

  } catch (err) {
    console.error("🔥 LEAD_ERROR", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      requestId: req.id,
    });
  }
});

// =====================
// 404 HANDLER
// =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.url,
  });
});

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("💥 UNHANDLED_ERROR", err);

  res.status(500).json({
    success: false,
    error: "Server crash handled safely",
    requestId: req.id,
  });
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});