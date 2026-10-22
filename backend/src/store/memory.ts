import type { EvidenceRecord } from '@opportunity-kit/shared';
import { EvidenceStoreError } from './errors.js';
import {
  cloneRecord,
  fromVersionRow,
  parseCursor,
  toVersionRow,
  type EvidenceVersionRow,
  type SyncOpRow
} from './mapping.js';
import type { ServerEvidenceStore, SyncPage } from './types.js';

export interface MemorySnapshot {
  versions: EvidenceVersionRow[];
  ops: SyncOpRow[];
  nextSeq: number;
}

/**
 * In-memory append-only store. Used by the JSON-file backend and by tests.
 * Callers never get a live reference to stored rows.
 */
export class MemoryEvidenceStore implements ServerEvidenceStore {
  private versions: EvidenceVersionRow[] = [];
  private ops: SyncOpRow[] = [];
  private nextSeq = 1;

  constructor(snapshot?: MemorySnapshot) {
    if (snapshot) this.loadSnapshot(snapshot);
  }

  snapshot(): MemorySnapshot {
    return {
      versions: this.versions.map((row) => ({ ...row, source: structuredClone(row.source), value: structuredClone(row.value) })),
      ops: this.ops.map((op) => ({ ...op })),
      nextSeq: this.nextSeq
    };
  }

  loadSnapshot(snapshot: MemorySnapshot): void {
    this.versions = snapshot.versions.map((row) => ({
      ...row,
      source: structuredClone(row.source),
      value: structuredClone(row.value)
    }));
    this.ops = snapshot.ops.map((op) => ({ ...op }));
    this.nextSeq = snapshot.nextSeq;
  }

  async appendVersion(userId: string, record: EvidenceRecord): Promise<EvidenceRecord> {
    const existingOp = this.findOp(userId, record.opId);
    if (existingOp) {
      const stored = this.versions.find((row) => row.user_id === userId && row.op_id === record.opId);
      if (!stored) {
        throw new EvidenceStoreError(`opId ${record.opId} is recorded but its version row is missing.`);
      }
      return cloneRecord(fromVersionRow(stored));
    }

    const existingPk = this.versions.find(
      (row) => row.user_id === userId && row.evidence_id === record.evidenceId && row.version === record.version
    );
    if (existingPk) {
      if (existingPk.op_id === record.opId) {
        this.rememberOp(userId, record.opId);
        return cloneRecord(fromVersionRow(existingPk));
      }
      throw new EvidenceStoreError(
        `Version ${record.evidenceId}@${record.version} is already stored and cannot be replaced.`
      );
    }

    const receivedAt = new Date().toISOString();
    const serverSeq = this.nextSeq;
    this.nextSeq += 1;
    const row = toVersionRow(userId, record, { serverSeq, receivedAt });
    this.versions.push(row);
    this.rememberOp(userId, record.opId, receivedAt);
    return cloneRecord(fromVersionRow(row));
  }

  async getCurrent(userId: string, evidenceId?: string): Promise<EvidenceRecord[]> {
    const latest = new Map<string, EvidenceVersionRow>();
    for (const row of this.versions) {
      if (row.user_id !== userId) continue;
      if (evidenceId && row.evidence_id !== evidenceId) continue;
      const current = latest.get(row.evidence_id);
      if (!current || row.version > current.version) latest.set(row.evidence_id, row);
    }
    return [...latest.values()]
      .sort((a, b) => a.evidence_id.localeCompare(b.evidence_id))
      .map((row) => cloneRecord(fromVersionRow(row)));
  }

  async getSince(userId: string, cursor: string | null): Promise<SyncPage> {
    const after = parseCursor(cursor);
    const rows = this.versions
      .filter((row) => row.user_id === userId && row.server_seq > after)
      .sort((a, b) => a.server_seq - b.server_seq);
    const records = rows.map((row) => cloneRecord(fromVersionRow(row)));
    const last = rows[rows.length - 1];
    return {
      records,
      nextCursor: last ? String(last.server_seq) : String(after)
    };
  }

  async hasOp(userId: string, opId: string): Promise<boolean> {
    return this.findOp(userId, opId) !== undefined;
  }

  private findOp(userId: string, opId: string): SyncOpRow | undefined {
    return this.ops.find((op) => op.user_id === userId && op.op_id === opId);
  }

  private rememberOp(userId: string, opId: string, appliedAt = new Date().toISOString()): void {
    if (this.findOp(userId, opId)) return;
    this.ops.push({ op_id: opId, user_id: userId, applied_at: appliedAt });
  }
}
