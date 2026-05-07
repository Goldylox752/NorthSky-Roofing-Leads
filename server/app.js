const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
}));

app.use(express.json());

// TEST ROUTE (important)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API is running 🚀",
  });
});

// health check for Render
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

module.exports = app;