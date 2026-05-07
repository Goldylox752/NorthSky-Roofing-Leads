const router = require("express").Router();

const {
  createLead,
} = require("../services/leads.service");

/* ===============================
   CREATE LEAD
=============================== */
router.post("/", async (req, res) => {
  try {
    const lead = await createLead(req.body);

    return res.status(201).json({
      success: true,
      lead,
    });

  } catch (err) {
    console.error("Create lead error:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create lead",
    });
  }
});

/* ===============================
   TEST GET ROUTE
=============================== */
router.get("/", async (req, res) => {
  return res.json({
    success: true,
    message: "Leads route working 🚀",
  });
});

module.exports = router;