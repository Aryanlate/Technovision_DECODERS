import { type EvidenceRecord } from './types.js';
/** Age limit per kind, in days. `null` means "never stale". */
export declare const STALE_AFTER_DAYS: Record<string, number | null>;
/** Fallback for kinds without a rule. */
export declare const DEFAULT_STALE_AFTER_DAYS: number | null;
/** Student confirmed evidence is never stale. */
export declare const STUDENT_CONFIRMED_NEVER_STALE = true;
/** Age limit in days for a kind, or null when the kind never expires. */
export declare function staleAfterDays(kind: string): number | null;
/**
 * True when a record must no longer be treated as a confirmed fact.
 * Rejected and superseded versions are history, not live facts, so they are
 * never reported as stale.
 */
export declare function isStale(record: EvidenceRecord, now?: Date): boolean;
//# sourceMappingURL=staleness.d.ts.map