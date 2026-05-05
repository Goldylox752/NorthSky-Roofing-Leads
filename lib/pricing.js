export const LEAD_TIERS = {
  low: 1500,
  mid: 3000,
  high: 5000,
};

// renamed for clarity (this is NOT final price anymore)
export const CITY_MULTIPLIER = {
  basic: 1,
  priority: 1.5,
  exclusive: 3,
};

// ===============================
// 🧠 BASE LEAD VALUE ENGINE (UPGRADED)
// ===============================
export function calculateLeadValue(score = 5, cityTier = "basic") {
  const tier = getScoreTier(score);

  const base = LEAD_TIERS[tier];

  const cityMultiplier =
    CITY_MULTIPLIER[cityTier] ?? CITY_MULTIPLIER.basic;

  return Math.floor(base * cityMultiplier);
}

// ===============================
// 🧠 SCORE NORMALIZATION LAYER
// ===============================
function getScoreTier(score) {
  if (score >= 8) return "high";
  if (score >= 6) return "mid";
  return "low";
}