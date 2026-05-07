require("dotenv").config();

const app = require("./app");

/* ===============================
   PORT
=============================== */
const PORT = process.env.PORT || 3001;

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`
🚀 Server running
🌎 Port: ${PORT}
  `);
});