import type { EvidenceRecord } from '@opportunity-kit/shared';

export interface GetSinceOptions {
  /** Max rows to return. Omit to return every version after the cursor. */
  limit?: number;
}

/** Page of versions that landed after a server_seq cursor. */
export interface SyncPage {
  records: EvidenceRecord[];
  /** Highest server_seq in this page, or the cursor that was passed if empty. */
  nextCursor: string;
  /** True when more rows exist after nextCursor. */
  hasMore: boolean;
}

/**
 * Server evidence store. Every write is an insert; existing rows are never
 * updated or deleted. History is the set of versions; "current" is the highest
 * version per evidenceId.
 */
export interface ServerEvidenceStore {
  /**
   * Inserts one version. Replaying the same opId returns the stored row and
   * does not insert again.
   */
  appendVersion(userId: string, record: EvidenceRecord): Promise<EvidenceRecord>;

  /** Highest version of each evidence id for this user (optionally one id). */
  getCurrent(userId: string, evidenceId?: string): Promise<EvidenceRecord[]>;

  /** Versions with server_seq greater than cursor, oldest first. */
  getSince(userId: string, cursor: string | null, options?: GetSinceOptions): Promise<SyncPage>;

  /** True when this opId was already accepted for this user. */
  hasOp(userId: string, opId: string): Promise<boolean>;
}
