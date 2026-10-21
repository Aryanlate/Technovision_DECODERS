// ============================================================================
// "How we stay sustainable" cost model
//
// Every number below is an ASSUMPTION, not a measured figure. They are grouped
// in one object so they can be reviewed, argued with and changed in one place,
// and the derived figures are simple arithmetic that anyone can redo by hand.
//
// The rule engine runs in the browser, so most checks never call a paid model.
// That is what keeps the average cost per check so low.
// ============================================================================

export interface SustainabilityAssumptions {
  /** Average cost of one AI provider call, in Indian rupees. */
  avgCostPerAiCallInr: number;
  /** AI calls a single check makes, when that check uses AI at all. */
  aiCallsPerCheck: number;
  /** Share (0-1) of checks answered by rules alone, with no AI call at all. */
  shareChecksWithoutAi: number;
  /** Free plan limit: opportunity checks per student per month. */
  freeChecksPerMonth: number;
  /** Assumed checks per student per month, used for both plans. */
  avgChecksPerStudentPerMonth: number;
  /** Fixed monthly running cost (hosting, domain, tooling), in rupees. */
  monthlyFixedCostInr: number;
  /** Per-student monthly hosting and storage cost, in rupees. */
  monthlyInfraPerStudentInr: number;
  /** Premium price per student per month, in rupees. */
  premiumPriceInr: number;
  /** Assumed number of free students, used to size the free-tier cost. */
  assumedFreeStudents: number;
}

export const DEFAULT_SUSTAINABILITY_ASSUMPTIONS: SustainabilityAssumptions = {
  avgCostPerAiCallInr: 0.4,
  aiCallsPerCheck: 3,
  shareChecksWithoutAi: 0.8,
  freeChecksPerMonth: 5,
  avgChecksPerStudentPerMonth: 3,
  monthlyFixedCostInr: 18000,
  monthlyInfraPerStudentInr: 0.5,
  premiumPriceInr: 79,
  assumedFreeStudents: 1000
};

export interface SustainabilityModel {
  assumptions: SustainabilityAssumptions;
  /** Average AI cost of one opportunity check, in rupees. */
  avgCostPerCheckInr: number;
  /** Average monthly cost of one student (checks + hosting), in rupees. */
  monthlyCostPerStudentInr: number;
  /** What one Premium student leaves after their running cost, in rupees. */
  premiumContributionInr: number;
  /** Monthly cost the free tier adds before any Premium revenue. */
  freeTierMonthlyCostInr: number;
  /** Premium students needed per month to cover everything. Infinity if unreachable. */
  breakEvenPremiumStudents: number;
}

function toRupees(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Derives the transparent cost figures from the assumptions above. */
export function computeSustainabilityModel(
  assumptions: SustainabilityAssumptions = DEFAULT_SUSTAINABILITY_ASSUMPTIONS
): SustainabilityModel {
  const aiShare = Math.min(1, Math.max(0, 1 - assumptions.shareChecksWithoutAi));

  const avgCostPerCheckInr = toRupees(
    aiShare * assumptions.aiCallsPerCheck * assumptions.avgCostPerAiCallInr
  );

  const monthlyCostPerStudentInr = toRupees(
    assumptions.avgChecksPerStudentPerMonth * avgCostPerCheckInr +
      assumptions.monthlyInfraPerStudentInr
  );

  const premiumContributionInr = toRupees(
    assumptions.premiumPriceInr - monthlyCostPerStudentInr
  );

  const freeTierMonthlyCostInr = toRupees(
    assumptions.assumedFreeStudents * monthlyCostPerStudentInr
  );

  const breakEvenPremiumStudents =
    premiumContributionInr > 0
      ? Math.ceil(
          (assumptions.monthlyFixedCostInr + freeTierMonthlyCostInr) / premiumContributionInr
        )
      : Infinity;

  return {
    assumptions,
    avgCostPerCheckInr,
    monthlyCostPerStudentInr,
    premiumContributionInr,
    freeTierMonthlyCostInr,
    breakEvenPremiumStudents
  };
}
