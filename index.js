import express from "express";
import path from "path";

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.static("public"));

/* ================= ROUTES ================= */

/* APPLY PAGE */
app.get("/apply", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/apply.html"));
});

/* APPLY FORM API */
app.post("/api/apply", (req, res) => {
  console.log("APPLICATION:", req.body);

  const qualified = req.body.monthly_jobs === "15+";

  res.json({ qualified });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
