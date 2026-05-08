function calculatePrice(score, city) {
  let base = 50;

  // score-based pricing
  if (score >= 80) base = 150;
  else if (score >= 60) base = 100;
  else base = 50;

  // city adjustment (optional logic)
  if (city === "Calgary") {
    base += 10;
  }

  return base;
}

module.exports = {
  calculatePrice,
};