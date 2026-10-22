import type { EvidenceRecord } from '../evidence/types.js';

/** Change kinds the merge engine understands. `delete` is a student deletion. */
export type SyncOperationKind = 'add' | 'revise' | 'confirm' | 'reject' | 'delete';

/** One local write waiting to be acknowledged by the server. */
export interface SyncOutboxOp {
  opId: string;
  operation: SyncOperationKind;
  evidenceId: string;
  record: EvidenceRecord;
  /** Version this change was based on. 0 for a brand new fact. */
  baseVersion: number;
  createdAt: string;
}

export type SyncNoticeCode =
  | 'DUPLICATE_OP'
  | 'AI_DID_NOT_OVERWRITE'
  | 'REJECTED_BEATS_AI'
  | 'AI_SUPERSEDED';

export interface SyncNotice {
  code: SyncNoticeCode;
  message: string;
  opId?: string;
  evidenceId?: string;
}

export interface SyncConflict {
  evidenceId: string;
  local: EvidenceRecord;
  remote: EvidenceRecord;
  reason: string;
}

export interface SyncInput {
  outbox: SyncOutboxOp[];
  /** Server versions with serverSeq greater than the last cursor. */
  serverChanges: EvidenceRecord[];
  /**
   * Versions already on this device (including pending outbox rows).
   * Needed so a confirmed local fact is not overwritten by a later pull.
   */
  localRecords?: EvidenceRecord[];
  /** Overridable for deterministic advisory timestamps. */
  now?: Date;
}

export interface SyncResult {
  toApplyLocally: EvidenceRecord[];
  toPushToServer: SyncOutboxOp[];
  conflicts: SyncConflict[];
  notices: SyncNotice[];
}
