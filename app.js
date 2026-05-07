const express = require("express");
const cors = require("cors");

const leadsRoutes = require("./routes/leads.routes");
const paymentsRoutes = require("./routes/payments.routes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
}));

app.use(express.json());

// Routes
app.use("/api/leads", leadsRoutes);
app.use("/api/payments", paymentsRoutes);

module.exports = app;