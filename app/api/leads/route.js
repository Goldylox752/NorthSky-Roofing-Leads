const express = require("express");
const cors = require("cors");

const app = express();

// =====================
// MIDDLEWARE (IMPORTANT)
// =====================
app.use(cors({
  origin: "*", // tighten later to your frontend domain
  methods: ["GET", "POST"],
}));

app.use(express.json());

// =====================
// HEALTH CHECK (fixes "Not Found" confusion)
// =====================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =====================
// LEADS ENDPOINT (FRONTEND SAFE)
// =====================
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "Email or phone required",
      });
    }

    // =====================
    // SIMULATED PROCESSING
    // =====================
    const leadId = "lead_" + Date.now();

    console.log("Lead received:", {
      leadId,
      name,
      email,
      phone,
      city,
    });

    // =====================
    // RESPONSE (FRONTEND EXPECTS THIS FORMAT)
    // =====================
    return res.status(200).json({
      success: true,
      lead: {
        id: leadId,
        name: name || null,
        email: email || null,
        phone: phone || null,
        city: city || null,
        status: "queued",
      },
    });

  } catch (err) {
    console.error("Lead error:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// =====================
// GLOBAL ERROR SAFETY
// =====================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: "Server crash protected",
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});