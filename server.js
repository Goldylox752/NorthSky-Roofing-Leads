require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3001;

/* ===============================
   START SERVER (SAFE)
=============================== */
try {
  app.listen(PORT, () => {
    console.log(`
🚀 Server running
🌎 Port: ${PORT}
🟢 Health: http://localhost:${PORT}/health
    `);
  });
} catch (err) {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
}