require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3001;

/* ===============================
   START SERVER (PRODUCTION SAFE)
=============================== */
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running
🌎 Port: ${PORT}
🟢 Health: http://localhost:${PORT}/health
  `);
});

/* ===============================
   HANDLE CRASHES SAFELY
=============================== */
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  server.close(() => process.exit(1));
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});