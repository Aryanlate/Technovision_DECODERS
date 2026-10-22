import { z } from 'zod';
import type { Finding, ResultCounts } from '../lib/types/index.js';
import type { EvidenceOrigin, EvidenceSource, EvidenceTrust } from '../evidence/types.js';
/** Short machine-readable explanation of why a requirement got its status. */
export declare const ReasonCodeSchema: z.ZodEnum<["SUPPORTED", "CONTRADICTED", "MISSING", "UNCONFIRMED_AI", "UNVERIFIED", "STALE", "CONFLICT"]>;
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
//# sourceMappingURL=types.d.ts.map