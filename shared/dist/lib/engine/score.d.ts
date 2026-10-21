import { Checklist, Finding, Requirement, RequirementStatus } from '../types/index.js';
export type ReadinessLabel = 'Ready to apply' | 'Almost ready' | 'Not ready yet';
/** A required requirement counts fully. */
export declare const REQUIRED_WEIGHT = 1;
/** An optional requirement counts less. */
export declare const OPTIONAL_WEIGHT = 0.5;
/** Match scores the full weight; Missing info scores half; Mismatch scores zero. */
export declare const STATUS_FACTOR: Record<RequirementStatus, number>;
export declare const SCORE_FORMULA: string;
export interface ScoreRow {
    requirementId: string;
    title: string;
    status: RequirementStatus;
    required: boolean;
    /** Required = 1, optional = 0.5. */
    weight: number;
    /** Match = 1, Missing info = 0.5, Mismatch = 0. */
    factor: number;
    points: number;
    maxPoints: number;
    /** Human-readable per-row arithmetic, e.g. "required (1) × Missing info (0.5) = 0.5 pts". */
    explanation: string;
}
export interface ReadinessScore {
    score: number;
    label: ReadinessLabel;
    rows: ScoreRow[];
    earnedPoints: number;
    totalPoints: number;
    formula: string;
}
/**
 * Computes the 0-100 Readiness Score from the findings of the rule engine.
 * Pure: depends only on the checklist requirements and the findings.
 */
export declare function computeReadinessScore(checklistInput: Checklist | Requirement[], findings: Finding[]): ReadinessScore;
//# sourceMappingURL=score.d.ts.map