const express = require("express");
const cors = require("cors");

const app = express();

// =====================
// CONFIG
// =====================
const PORT = process.env.PORT || 3001;

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
  origin: "*", // lock this later to your frontend domain
  methods: ["GET", "POST"],
}));

app.use(express.json({ limit: "1mb" }));

// =====================
// REQUEST LOGGER (DEBUGGING)
// =====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// =====================
// HEALTH CHECK (RENDER + FRONTEND TEST)
// =====================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// =====================
// LEAD VALIDATION
// =====================
function validateLead(body) {
  const { email, phone } = body;

  if (!email && !phone) {
    return "Email or phone required";
  }

  if (phone && phone.length < 7) {
    return "Invalid phone number";
  }

  return null;
}

// =====================
// LEADS ENDPOINT (PRODUCTION SAFE)
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

    // =====================
    // SIMULATED LEAD CREATION
    // =====================
    const leadId = `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    console.log("📩 Lead received:", {
      leadId,
      name,
      email,
      phone,
      city,
    });

    // =====================
    // RESPONSE CONTRACT (IMPORTANT FOR FRONTEND)
    // =====================
    return res.status(200).json({
      success: true,
      message: "Lead created successfully",
      lead: {
        id: leadId,
        name: name || null,
        email: email || null,
        phone: phone || null,
        city: city || null,
        status: "queued",
        createdAt: new Date().toISOString(),
      },
    });

  } catch (err) {
    console.error("🔥 Lead error:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// =====================
// 404 HANDLER (IMPORTANT)
// =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: "Server crashed safely",
  });
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});