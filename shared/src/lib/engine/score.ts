import { Checklist, Finding, Requirement, RequirementStatus } from '../types/index.js';
import { deriveReadiness, toRequirements } from './compare.js';

export type ReadinessLabel = 'Ready to apply' | 'Almost ready' | 'Not ready yet';

// ============================================================================
// Visible, rule-based Readiness Score inputs
// ============================================================================
/** A required requirement counts fully. */
export const REQUIRED_WEIGHT = 1;
/** An optional requirement counts less. */
export const OPTIONAL_WEIGHT = 0.5;

/** Match scores the full weight; Missing info scores half; Mismatch scores zero. */
export const STATUS_FACTOR: Record<RequirementStatus, number> = {
  Match: 1,
  'Missing info': 0.5,
  Mismatch: 0
};

export const SCORE_FORMULA =
  'Score = earned points ÷ total points × 100. Each requirement is worth a weight ' +
  '(required = 1, optional = 0.5). A Match earns the full weight, Missing info earns half, ' +
  'and a Mismatch earns zero.';

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
export function computeReadinessScore(
  checklistInput: Checklist | Requirement[],
  findings: Finding[]
): ReadinessScore {
  const requirements = toRequirements(checklistInput);
  const reqById = new Map(requirements.map((r) => [r.id, r]));

  const rows: ScoreRow[] = findings.map((f) => {
    const req = reqById.get(f.requirementId);
    const required = req ? req.required !== false : true;
    const weight = required ? REQUIRED_WEIGHT : OPTIONAL_WEIGHT;
    const factor = STATUS_FACTOR[f.status] ?? 0;
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
    label: deriveReadiness(counts),
    rows,
    earnedPoints,
    totalPoints,
    formula: SCORE_FORMULA
  };
}
