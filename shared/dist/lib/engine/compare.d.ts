import { Checklist, Requirement, StudentProfile, Finding, Result, EvaluationResult } from '../types/index.js';
/**
 * Normalizes a student profile to ensure all modern and legacy properties
 * are readily accessible.
 */
export declare function normalizeStudentProfile(profile: Partial<StudentProfile>): StudentProfile;
/**
 * Evaluates a single requirement against a normalized student profile
 * using visible, deterministic pure TypeScript rules.
 */
export declare function evaluateRequirement(req: Requirement, profile: StudentProfile): Finding;
/**
 * Accepts either a full Checklist or a bare Requirement array and returns the
 * requirement list. Shared by the comparison engine, the score and the what-if
 * simulator so they all operate on exactly the same requirements.
 */
export declare function toRequirements(checklistInput: Checklist | Requirement[]): Requirement[];
/**
 * Pure TypeScript comparison engine with no AI and no network calls.
 * Evaluates an opportunity checklist against a student profile.
 *
 * Guaranteed Invariant:
 * An empty or unknown profile field returns "Missing info", never "Mismatch".
 */
export declare function compare(checklistInput: Checklist | Requirement[], profile: StudentProfile): Result;
/**
 * Readiness label rule, kept in one place so the comparison engine and the
 * What-if simulator can never disagree:
 * - Ready to apply: 0 mismatches, 0 missing info, at least 1 match
 * - Almost ready: 0 mismatches, but some missing info (profile needs details)
 * - Not ready yet: 1 or more mismatches (blockers exist)
 */
export declare function deriveReadiness(counts: {
    matches: number;
    mismatches: number;
    missingInfo: number;
}): 'Ready to apply' | 'Almost ready' | 'Not ready yet';
/**
 * Ordered next steps:
 * 1. Mismatches first (critical blockers)
 * 2. Missing info second (information or documents needed)
 */
export declare function buildNextSteps(findings: Finding[]): string[];
/**
 * Single source of truth: turns findings into counts, readiness and next steps.
 * Used by compare() and by the What-if simulator so both stay consistent.
 */
export declare function buildResultFromFindings(findings: Finding[]): Result;
/**
 * Backward compatibility wrapper returning full EvaluationResult & Result
 * for existing Next.js frontend pages and Express backend routes.
 */
export declare function evaluateProfileAgainstOpportunity(requirements: Requirement[], profile: StudentProfile, opportunityTitle?: string, rawOpportunityText?: string, agentEvidence?: any[]): EvaluationResult & Result;
//# sourceMappingURL=compare.d.ts.map