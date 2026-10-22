import type { EvidenceRecord } from '../evidence/types.js';
import { type Checklist, type Requirement, type StudentProfile } from '../lib/types/index.js';
import type { Decision } from './types.js';
/**
 * Recomputes the eligibility decision for one opportunity from its evidence.
 * Pure: depends only on the evidence and `now`.
 */
export declare function evaluate(requirementEvidence: EvidenceRecord[], profileEvidence: EvidenceRecord[], now?: Date): Decision;
/**
 * Thin adapter for the legacy checklist + profile call shape: it upgrades both
 * sides to evidence and delegates the decision to evaluate().
 */
export declare function evaluateOpportunity(checklistInput: Checklist | Requirement[], profile: StudentProfile, now?: Date): Decision;
//# sourceMappingURL=evaluate.d.ts.map