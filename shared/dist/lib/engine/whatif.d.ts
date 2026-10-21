import { Checklist, Finding, Requirement, ResultCounts, StudentProfile } from '../types/index.js';
import { ReadinessLabel, ReadinessScore } from './score.js';
export interface WhatIfResult {
    /** Requirement ids the student chose to "assume fixed". */
    appliedIds: string[];
    counts: ResultCounts;
    readiness: ReadinessLabel;
    findings: Finding[];
    score: ReadinessScore;
    /** Mismatches + Missing info remaining after the assumptions. */
    gapsLeft: number;
    /** e.g. "Only 1 gap left" or "All gaps resolved — Ready to apply". */
    headline: string;
    /** Always present so the UI can label the simulation clearly. */
    note: string;
}
/**
 * Re-runs the pure comparison engine against a temporary copy of the profile
 * in which every toggled requirement is assumed fixed.
 *
 * The real profile is never modified and nothing is persisted here.
 */
export declare function simulateWhatIf(checklistInput: Checklist | Requirement[], profile: StudentProfile, assumedRequirementIds: string[]): WhatIfResult;
//# sourceMappingURL=whatif.d.ts.map