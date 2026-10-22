import { type EvidenceRecord } from '../evidence/index.js';
import type { SyncInput, SyncResult } from './types.js';
/**
 * Pure merge of local outbox ops and server changes. No network, no storage.
 * Server rows are applied in serverSeq order. Every version that is kept is
 * emitted; nothing is deleted.
 */
export declare function mergeSync(input: SyncInput): SyncResult;
export declare function currentAfterMerge(localRecords: EvidenceRecord[], applied: EvidenceRecord[], evidenceId: string): EvidenceRecord | undefined;
//# sourceMappingURL=merge.d.ts.map