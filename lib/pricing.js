export const LEAD_TIERS = {
  low: 1500,
  mid: 3000,
  high: 5000,
};

export const CITY_MULTIPLIER = {
  basic: 1,
  priority: 1.5,
  exclusive: 3,
};

export function calculateLeadValue(score = 5, cityTier = "basic") {
  const base =
    score >= 8
      ? LEAD_TIERS.high
      : score >= 6
      ? LEAD_TIERS.mid
      : LEAD_TIERS.low;

  return Math.floor(base * (CITY_MULTIPLIER[cityTier] || 1));
}