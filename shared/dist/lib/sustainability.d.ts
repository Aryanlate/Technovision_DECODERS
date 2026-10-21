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
export declare const DEFAULT_SUSTAINABILITY_ASSUMPTIONS: SustainabilityAssumptions;
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
/** Derives the transparent cost figures from the assumptions above. */
export declare function computeSustainabilityModel(assumptions?: SustainabilityAssumptions): SustainabilityModel;
//# sourceMappingURL=sustainability.d.ts.map