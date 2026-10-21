import { Checklist, Finding, Requirement, RequirementStatus } from '../types/index.js';
export interface EffortEntry {
    label: string;
    /** Numeric minutes, used only for "quickest fix first" ordering. */
    minutes: number;
    /** Friendly label shown to the student, e.g. "5 minutes". */
    estimate: string;
}
export declare const EFFORT_ESTIMATE_TABLE: Record<string, EffortEntry>;
export interface EffortStep {
    order: number;
    requirementId: string;
    title: string;
    status: RequirementStatus;
    /** Short action label, e.g. "Add GitHub link". */
    action: string;
    /** The engine's concrete instruction for this row. */
    detail: string;
    minutes: number;
    /** Friendly estimate, e.g. "5 minutes". Always an estimate. */
    estimate: string;
}
/** Maps a requirement to its curated effort-table key. */
export declare function resolveEntryKey(req: Requirement): string;
/** Pulls the missing skill names out of a listRule reason, e.g. "Missing required skill: JavaScript." */
export declare function extractMissingSkills(reason: string): string[];
/**
 * Builds the action list ordered by quickest fix first (ascending estimate),
 * with equal-effort steps keeping the engine's Mismatch-before-Missing-info order.
 * Every step is labelled as an estimate.
 */
export declare function buildPrioritisedNextSteps(checklistInput: Checklist | Requirement[], findings: Finding[]): EffortStep[];
//# sourceMappingURL=nextSteps.d.ts.map