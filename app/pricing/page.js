import { calculateFinalPrice } from "@/lib/pricingEngine";

// ===============================
// BASE PRICE TIERS
// ===============================
const LEAD_BASE_BY_SCORE = {
  high: 5000, // 8–10
  mid: 3000,  // 6–7
  low: 1500,  // 1–5
};

// ===============================
// SAFE HELPERS
// ===============================
function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function getBaseLeadValue(score: number) {
  if (score >= 8) return LEAD_BASE_BY_SCORE.high;
  if (score >= 6) return LEAD_BASE_BY_SCORE.mid;
  return LEAD_BASE_BY_SCORE.low;
}

// ===============================
// 🔐 CORE PRICE LOCK ENGINE (V2)
// ===============================
export function lockLeadPrice({
  lead,
  contractor,
  cityRow,
  systemMetrics,
}) {
  // ===============================
  // 1. NORMALIZED SCORE
  // ===============================
  const score = clamp(Number(lead?.score ?? 0), 1, 10);

  // ===============================
  // 2. BASE VALUE (STATIC FOUNDATION)
  // ===============================
  const baseLeadValue = getBaseLeadValue(score);

  // ===============================
  // 3. DEMAND MULTIPLIER (REAL-TIME MARKET PRESSURE)
  // ===============================
  const demandMultiplier = clamp(
    Number(systemMetrics?.demandMultiplier ?? 1),
    0.5,
    3
  );

  // ===============================
  // 4. CONTRACTOR TIER POWER
  // ===============================
  const contractorTierMultiplier =
    contractor?.plan === "elite"
      ? 2.25
      : contractor?.plan === "growth"
      ? 1.5
      : 1;

  // ===============================
  // 5. CITY SCARCITY (NON-LINEAR MODEL)
  // ===============================
  const capacity = Math.max(cityRow?.capacity ?? 1, 1);
  const active = Math.max(cityRow?.active_contractors ?? 0, 0);

  const saturation = active / capacity;

  // smoother economic pressure curve
  const cityScarcityFactor =
    saturation >= 1.2
      ? 2.2
      : saturation >= 1
      ? 2.0
      : saturation >= 0.8
      ? 1.6
      : saturation >= 0.5
      ? 1.2
      : 1;

  // ===============================
  // 6. RAW PRICE CALCULATION
  // ===============================
  const rawPrice = calculateFinalPrice({
    baseLeadValue,
    demandMultiplier,
    contractorTierMultiplier,
    cityScarcityFactor,
  });

  // ===============================
  // 7. PRICE GOVERNANCE (ANTI EXPLOIT)
  // ===============================
  const lockedPrice = clamp(
    Math.round(rawPrice),
    750,   // floor (prevents underpricing abuse)
    25000  // ceiling (protects market sanity)
  );

  // ===============================
  // 8. RETURN LOCK OBJECT (IMMUTABLE CONTRACT)
  // ===============================
  return {
    finalPrice: lockedPrice,

    lockedAt: new Date().toISOString(),

    breakdown: {
      baseLeadValue,
      demandMultiplier,
      contractorTierMultiplier,
      cityScarcityFactor,
      saturation,
      rawPrice,
    },
  };
}