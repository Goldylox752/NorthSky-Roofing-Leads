import { calculateFinalPrice } from "@/lib/pricingEngine";

const LEAD_BASE_BY_SCORE = {
  high: 5000,  // 8–10
  mid: 3000,   // 6–7
  low: 1500,   // 1–5
};

function getBaseLeadValue(score: number) {
  if (score >= 8) return LEAD_BASE_BY_SCORE.high;
  if (score >= 6) return LEAD_BASE_BY_SCORE.mid;
  return LEAD_BASE_BY_SCORE.low;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

// ===============================
// 🔐 CORE PRICE LOCK ENGINE
// ===============================
export function lockLeadPrice({
  lead,
  contractor,
  cityRow,
  systemMetrics,
}) {
  const score = clamp(Number(lead.score || 0), 1, 10);

  // 1. BASE VALUE (deterministic)
  const baseLeadValue = getBaseLeadValue(score);

  // 2. DEMAND MULTIPLIER (safe fallback + clamp)
  const demandMultiplier = clamp(
    systemMetrics?.demandMultiplier ?? 1,
    0.5,
    3
  );

  // 3. CONTRACTOR TIER MULTIPLIER
  const contractorTierMultiplier =
    contractor?.plan === "elite"
      ? 2.2
      : contractor?.plan === "growth"
      ? 1.5
      : 1;

  // 4. CITY SCARCITY FACTOR (capacity pressure)
  const capacity = cityRow?.capacity ?? 1;
  const active = cityRow?.active_contractors ?? 0;

  const scarcityRatio = active / capacity;

  const cityScarcityFactor =
    scarcityRatio >= 1
      ? 2.0
      : scarcityRatio >= 0.75
      ? 1.5
      : 1;

  // ===============================
  // 💰 FINAL PRICE (LOCKED)
  // ===============================
  const finalPrice = calculateFinalPrice({
    baseLeadValue,
    demandMultiplier,
    contractorTierMultiplier,
    cityScarcityFactor,
  });

  const lockedPrice = Math.round(clamp(finalPrice, 500, 25000));

  return {
    finalPrice: lockedPrice,

    lockedAt: new Date().toISOString(),

    breakdown: {
      baseLeadValue,
      demandMultiplier,
      contractorTierMultiplier,
      cityScarcityFactor,
      raw: finalPrice,
    },
  };
}