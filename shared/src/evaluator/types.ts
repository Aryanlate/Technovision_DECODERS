import { z } from 'zod';
import type { Finding, ResultCounts } from '../lib/types/index.js';
import type { EvidenceOrigin, EvidenceSource, EvidenceTrust } from '../evidence/types.js';

// ============================================================================
// Dynamic eligibility evaluator (pure TypeScript, no AI, no network).
//
// The evaluator is not a source of truth. It is recomputed from the current
// evidence every time evidence changes, and it reports exactly which evidence
// versions supported each finding and which were left out.
// ============================================================================

/** Short machine-readable explanation of why a requirement got its status. */
export const ReasonCodeSchema = z.enum([
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
export type ReasonCode = z.infer<typeof ReasonCodeSchema>;

/** One evidence version that backs a finding. */
export interface SupportingEvidence {
  evidenceId: string;
  version: number;
  origin: EvidenceOrigin;
  trust: EvidenceTrust;
  source: EvidenceSource;
}

/** One evidence version that was left out of the decision, and why. */
export interface ExcludedEvidence {
  evidenceId: string;
  version: number;
  why: string;
}

/**
 * A finding with full evidence traceability. It extends the shared `Finding`
 * so the existing result page and score keep working unchanged.
 */
export interface EligibilityFinding extends Finding {
  reasonCode: ReasonCode;
  supportingEvidence: SupportingEvidence[];
  excludedEvidence: ExcludedEvidence[];
}

/**
 * The evaluator's answer for one opportunity.
 *
 * `evidenceFingerprint` is a hash of the evidence ids and versions that produced
 * the decision. Any cache must key on it, so a single changed record makes the
 * cached verdict unusable.
 */
export interface Decision {
  evaluatedAt: string;
  evidenceFingerprint: string;
  findings: EligibilityFinding[];
  counts: ResultCounts;
  readiness: 'Ready to apply' | 'Almost ready' | 'Not ready yet';
  nextSteps: string[];
}
