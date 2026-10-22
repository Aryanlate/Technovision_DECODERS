"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = compare;
exports.evaluateProfileAgainstOpportunity = evaluateProfileAgainstOpportunity;
const evaluate_js_1 = require("../../evaluator/evaluate.js");
// The visible rule engine primitives live in ./core.js so the evidence
// evaluator can reuse them; they stay re-exported here for every existing
// importer of `./compare.js`.
__exportStar(require("./core.js"), exports);
/**
 * Comparison adapter kept for backward compatibility.
 *
 * It no longer decides anything itself: it turns the checklist into
 * opportunity-side evidence, the profile into student-confirmed evidence and
 * hands both to the dynamic evaluator, which owns the decision. The evidence
 * evaluator is the single source of truth, and it is never cached as a verdict.
 *
 * Guaranteed Invariant:
 * An empty or unknown profile field returns "Missing info", never "Mismatch".
 */
function compare(checklistInput, profile) {
    const decision = (0, evaluate_js_1.evaluateOpportunity)(checklistInput, profile);
    return {
        findings: decision.findings,
        counts: decision.counts,
        readiness: decision.readiness,
        nextSteps: decision.nextSteps
    };
}
/**
 * Backward compatibility wrapper returning full EvaluationResult & Result
 * for existing Next.js frontend pages and Express backend routes.
 */
function evaluateProfileAgainstOpportunity(requirements, profile, opportunityTitle = 'Opportunity Evaluation', rawOpportunityText = '', agentEvidence = []) {
    const result = compare(requirements, profile);
    const overallVerdict = result.counts.mismatches === 0 && result.counts.missingInfo === 0 && result.counts.matches > 0
        ? 'Ready to apply'
        : 'Not ready to apply yet';
    const headline = result.readiness === 'Ready to apply'
        ? 'All requirements satisfied. You are ready to submit your application!'
        : `${result.counts.matches} Match, ${result.counts.mismatches} Mismatch, ${result.counts.missingInfo} Missing info. Action required before applying.`;
    const summary = {
        totalRequirements: result.counts.total ?? result.findings.length,
        matches: result.counts.matches,
        mismatches: result.counts.mismatches,
        missingInfo: result.counts.missingInfo,
        overallVerdict,
        headline,
        actionPlan: result.nextSteps
    };
    return {
        ...result,
        opportunityTitle,
        rawOpportunityText,
        timestamp: new Date().toISOString(),
        summary,
        checklist: result.findings,
        agentEvidence
    };
}
//# sourceMappingURL=compare.js.map