const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   MIDDLEWARE
=============================== */
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));

app.use(express.json());

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running 🚀",
  });
});

app.get("/health", (req, res) => {
  res.json({
    healthy: true,
  });
});

module.exports = app;