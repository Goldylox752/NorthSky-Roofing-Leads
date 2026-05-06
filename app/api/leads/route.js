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
// SECURITY HEADERS
// =====================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Powered-By", "none");
  next();
});

// =====================
// CORS (safer default)
// =====================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    methods: ["GET", "POST"],
  })
);

// =====================
// BODY PARSER (must be early)
// =====================
app.use(express.json({ limit: "1mb" }));

// =====================
// REQUEST ID + LOGGER
// =====================
app.use((req, res, next) => {
  const id =
    req.headers["x-request-id"] ||
    crypto.randomUUID();

  req.id = id;

  console.log(
    JSON.stringify({
      id,
      time: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    })
  );

  next();
});

// =====================
// SIMPLE RATE LIMIT (IMPROVED)
// =====================
const ipHits = new Map();

function rateLimit(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  const now = Date.now();

  let data = ipHits.get(ip);

  if (!data || now > data.reset) {
    data = { count: 0, reset: now + 60_000 };
  }

  data.count++;
  ipHits.set(ip, data);

  if (data.count > 30) {
    return res.status(429).json({
      success: false,
      error: "Too many requests",
      requestId: req.id,
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
// VALIDATION
// =====================
function validateLead(body) {
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const name = body.name?.trim();

  if (!email && !phone) return "Email or phone required";

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Invalid email";
  }

  if (phone && phone.length < 7) {
    return "Invalid phone number";
  }

  if (name && name.length > 80) {
    return "Name too long";
  }

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

    const leadId = crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 18);

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

    console.log("📩 NEW_LEAD", lead);

    return res.status(200).json({
      success: true,
      message: "Lead created successfully",
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
    path: req.originalUrl,
    requestId: req.id,
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
// GRACEFUL SHUTDOWN
// =====================
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down...");
  process.exit(0);
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});