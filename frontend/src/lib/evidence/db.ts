import Dexie, { type Table } from 'dexie';
import type { EvidenceRecord } from '@opportunity-kit/shared';

// ============================================================================
// Local evidence database (IndexedDB through Dexie).
//
// Three stores:
//   evidence — every version of every record, keyed by evidenceId + version
//   outbox   — one queued operation per change, waiting for the server
//   meta     — deviceId (created once), lastSyncCursor, lastSyncedAt, flags
//
// The database holds no verdicts: eligibility is recomputed from these records
// whenever evidence changes.
// ============================================================================

export const EVIDENCE_DB_NAME = 'opportunitykit_evidence';

/** Change kinds queued in the outbox. */
export type OutboxOperation = 'add' | 'revise' | 'confirm' | 'reject';

export interface OutboxEntry {
  /** Same id as the record version it queued, so one op maps to one version. */
  opId: string;
  operation: OutboxOperation;
  evidenceId: string;
  record: EvidenceRecord;
  /** Version this change was based on. 0 for a brand new fact. */
  baseVersion: number;
  createdAt: string;
}

export interface MetaEntry {
  key: string;
  value: unknown;
  updatedAt: string;
}

/** Compound primary key: one row per version of an evidence id. */
export type EvidenceKey = [string, number];

export function evidenceKey(record: Pick<EvidenceRecord, 'evidenceId' | 'version'>): EvidenceKey {
  return [record.evidenceId, record.version];
}

export class EvidenceDatabase extends Dexie {
  evidence!: Table<EvidenceRecord, EvidenceKey>;
  outbox!: Table<OutboxEntry, string>;
  meta!: Table<MetaEntry, string>;

  constructor(name: string = EVIDENCE_DB_NAME) {
    super(name);
    this.version(1).stores({
      evidence: '[evidenceId+version], evidenceId, subjectId, kind, syncState, status',
      outbox: '&opId, evidenceId, operation, createdAt',
      meta: '&key'
    });
  }
}

/** IndexedDB is missing on the server and in a few locked-down browsers. */
export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}
