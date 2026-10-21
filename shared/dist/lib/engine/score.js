"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCORE_FORMULA = exports.STATUS_FACTOR = exports.OPTIONAL_WEIGHT = exports.REQUIRED_WEIGHT = void 0;
exports.computeReadinessScore = computeReadinessScore;
const compare_js_1 = require("./compare.js");
// ============================================================================
// Visible, rule-based Readiness Score inputs
// ============================================================================
/** A required requirement counts fully. */
exports.REQUIRED_WEIGHT = 1;
/** An optional requirement counts less. */
exports.OPTIONAL_WEIGHT = 0.5;
/** Match scores the full weight; Missing info scores half; Mismatch scores zero. */
exports.STATUS_FACTOR = {
    Match: 1,
    'Missing info': 0.5,
    Mismatch: 0
};
exports.SCORE_FORMULA = 'Score = earned points ÷ total points × 100. Each requirement is worth a weight ' +
    '(required = 1, optional = 0.5). A Match earns the full weight, Missing info earns half, ' +
    'and a Mismatch earns zero.';
/**
 * Computes the 0-100 Readiness Score from the findings of the rule engine.
 * Pure: depends only on the checklist requirements and the findings.
 */
function computeReadinessScore(checklistInput, findings) {
    const requirements = (0, compare_js_1.toRequirements)(checklistInput);
    const reqById = new Map(requirements.map((r) => [r.id, r]));
    const rows = findings.map((f) => {
        const req = reqById.get(f.requirementId);
        const required = req ? req.required !== false : true;
        const weight = required ? exports.REQUIRED_WEIGHT : exports.OPTIONAL_WEIGHT;
        const factor = exports.STATUS_FACTOR[f.status] ?? 0;
        const points = weight * factor;
        return {
            requirementId: f.requirementId,
            title: f.title || req?.label || f.requirementId,
            status: f.status,
            required,
            weight,
            factor,
            points,
            maxPoints: weight,
            explanation: `${required ? 'required' : 'optional'} (${weight}) × ${f.status} (${factor}) = ${points} pts`
        };
    });
    const earnedPoints = rows.reduce((sum, r) => sum + r.points, 0);
    const totalPoints = rows.reduce((sum, r) => sum + r.maxPoints, 0);
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const counts = {
        matches: findings.filter((f) => f.status === 'Match').length,
        mismatches: findings.filter((f) => f.status === 'Mismatch').length,
        missingInfo: findings.filter((f) => f.status === 'Missing info').length
    };
    return {
        score,
        label: (0, compare_js_1.deriveReadiness)(counts),
        rows,
        earnedPoints,
        totalPoints,
        formula: exports.SCORE_FORMULA
    };
}
//# sourceMappingURL=score.js.map