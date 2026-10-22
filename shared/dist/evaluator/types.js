"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReasonCodeSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// Dynamic eligibility evaluator (pure TypeScript, no AI, no network).
//
// The evaluator is not a source of truth. It is recomputed from the current
// evidence every time evidence changes, and it reports exactly which evidence
// versions supported each finding and which were left out.
// ============================================================================
/** Short machine-readable explanation of why a requirement got its status. */
exports.ReasonCodeSchema = zod_1.z.enum([
    /** A confirmed fact satisfies the requirement. */
    'SUPPORTED',
    /** A confirmed fact breaks the requirement. */
    'CONTRADICTED',
    /** No evidence exists for this requirement. */
    'MISSING',
    /** Only an AI suggestion the student has not confirmed exists. */
    'UNCONFIRMED_AI',
    /** Evidence exists but is not a confirmed fact. */
    'UNVERIFIED',
    /** The evidence is past its freshness window. */
    'STALE',
    /** Two current records disagree, so neither can be used. */
    'CONFLICT'
]);
//# sourceMappingURL=types.js.map