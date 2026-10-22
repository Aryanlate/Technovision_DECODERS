import { Checklist, Requirement, StudentProfile, Result, EvaluationResult } from '../types/index.js';
export * from './core.js';
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
export declare function compare(checklistInput: Checklist | Requirement[], profile: StudentProfile): Result;
/**
 * Backward compatibility wrapper returning full EvaluationResult & Result
 * for existing Next.js frontend pages and Express backend routes.
 */
export declare function evaluateProfileAgainstOpportunity(requirements: Requirement[], profile: StudentProfile, opportunityTitle?: string, rawOpportunityText?: string, agentEvidence?: any[]): EvaluationResult & Result;
//# sourceMappingURL=compare.d.ts.map