const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// HEALTH CHECK (IMPORTANT)
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// LEADS ENDPOINT
app.post("/api/leads", (req, res) => {
  console.log("Lead:", req.body);

  res.json({
    success: true,
    leadId: "lead_" + Date.now(),
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});