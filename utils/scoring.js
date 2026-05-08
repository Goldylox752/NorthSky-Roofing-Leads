function calculateScore({ email, phone, city }) {
  let score = 50;

  if (email) score += 20;
  if (phone) score += 20;
  if (city === "Calgary") score += 10;

  return Math.min(score, 100);
}

function getTier(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

module.exports = {
  calculateScore,
  getTier,
};