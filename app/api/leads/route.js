const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/leads", async (req, res) => {
  console.log("Lead received:", req.body);

  res.json({
    success: true,
    leadId: "test_" + Date.now(),
  });
});

app.listen(3001, () => {
  console.log("Server running on 3001");
});