// /dispatcher/lockLeadPrice.ts

import { calculateFinalPrice } from "@/lib/pricingEngine";

export function lockLeadPrice({ lead, contractor, cityRow, systemMetrics }) {
  const baseLeadValue =
    lead.score >= 8 ? 5000 :
    lead.score >= 6 ? 3000 :
    1500;

  const demandMultiplier = systemMetrics.demandMultiplier || 1;

  const contractorTierMultiplier =
    contractor.plan === "elite" ? 2 :
    contractor.plan === "growth" ? 1.5 :
    1;

  const cityScarcityFactor =
    cityRow?.active_contractors >= cityRow?.capacity ? 2 : 1;

  const finalPrice = calculateFinalPrice({
    baseLeadValue,
    demandMultiplier,
    contractorTierMultiplier,
    cityScarcityFactor,
  });

  return {
    finalPrice,
    lockedAt: new Date().toISOString(),
    breakdown: {
      baseLeadValue,
      demandMultiplier,
      contractorTierMultiplier,
      cityScarcityFactor,
    },
  };
}