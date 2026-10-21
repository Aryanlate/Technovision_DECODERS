"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SUSTAINABILITY_ASSUMPTIONS = void 0;
exports.computeSustainabilityModel = computeSustainabilityModel;
exports.DEFAULT_SUSTAINABILITY_ASSUMPTIONS = {
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
function toRupees(value) {
    return Math.round(value * 100) / 100;
}
/** Derives the transparent cost figures from the assumptions above. */
function computeSustainabilityModel(assumptions = exports.DEFAULT_SUSTAINABILITY_ASSUMPTIONS) {
    const aiShare = Math.min(1, Math.max(0, 1 - assumptions.shareChecksWithoutAi));
    const avgCostPerCheckInr = toRupees(aiShare * assumptions.aiCallsPerCheck * assumptions.avgCostPerAiCallInr);
    const monthlyCostPerStudentInr = toRupees(assumptions.avgChecksPerStudentPerMonth * avgCostPerCheckInr +
        assumptions.monthlyInfraPerStudentInr);
    const premiumContributionInr = toRupees(assumptions.premiumPriceInr - monthlyCostPerStudentInr);
    const freeTierMonthlyCostInr = toRupees(assumptions.assumedFreeStudents * monthlyCostPerStudentInr);
    const breakEvenPremiumStudents = premiumContributionInr > 0
        ? Math.ceil((assumptions.monthlyFixedCostInr + freeTierMonthlyCostInr) / premiumContributionInr)
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
//# sourceMappingURL=sustainability.js.map