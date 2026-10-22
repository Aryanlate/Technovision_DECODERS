import type { EvidenceRecord } from '../evidence/types.js';
import type { ReasonCode } from './types.js';
export interface EvidenceVerdict {
    confirmed: boolean;
    reasonCode: ReasonCode;
    /** Plain-language explanation for the UI when the record does not count. */
    why: string;
}
/** Classifies one evidence version against the rule above. */
export declare function classifyEvidence(record: EvidenceRecord, now: Date): EvidenceVerdict;
//# sourceMappingURL=classification.d.ts.map