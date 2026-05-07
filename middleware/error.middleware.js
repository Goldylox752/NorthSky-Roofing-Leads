module.exports = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  res.status(500).json({
    success: false,
    error: err.message || "Server error",
  });
};