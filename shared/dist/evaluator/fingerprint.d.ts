import type { EvidenceRecord } from '../evidence/types.js';
/**
 * Stable hash of the evidence that produced a decision: the id and version of
 * every record used, plus its content. Revisions bump the version and content
 * changes bump the content hash, so either invalidates the fingerprint.
 */
export declare function evidenceFingerprint(records: EvidenceRecord[]): string;
//# sourceMappingURL=fingerprint.d.ts.map