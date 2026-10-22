import { type EvidenceRecord } from '../evidence/types.js';
/** Stable stringify so object key order does not change equality. */
export declare function stableStringify(value: unknown): string;
export declare function valuesEqual(left: unknown, right: unknown): boolean;
export declare function cloneRecord(record: EvidenceRecord): EvidenceRecord;
/**
 * Order by the server-assigned sequence only. Device clocks (createdAt /
 * observedAt) are ignored so two devices cannot "win" by setting their time.
 */
export declare function sortByServerSeq(records: EvidenceRecord[]): EvidenceRecord[];
export declare function versionKey(record: Pick<EvidenceRecord, 'evidenceId' | 'version'>): string;
//# sourceMappingURL=compare.d.ts.map