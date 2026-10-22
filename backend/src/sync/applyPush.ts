import {
  EvidenceRecordSchema,
  mergeSync,
  type EvidenceRecord,
  type SyncNotice,
  type SyncConflict,
  type SyncOutboxOp
} from '@opportunity-kit/shared';
import type { ServerEvidenceStore } from '../store/types.js';

export interface AppliedOp {
  opId: string;
  evidenceId: string;
  version: number;
  serverSeq: number;
}

export interface PushResult {
  applied: AppliedOp[];
  conflicts: SyncConflict[];
  notices: SyncNotice[];
  cursor: string;
}

function alreadyHas(existing: EvidenceRecord[], opId: string): boolean {
  return existing.some((row) => row.opId === opId);
}

function toApplied(record: EvidenceRecord): AppliedOp | null {
  if (record.serverSeq === undefined) return null;
  return {
    opId: record.opId,
    evidenceId: record.evidenceId,
    version: record.version,
    serverSeq: record.serverSeq
  };
}

/**
 * Merges a client's outbox against what the server already has, then appends
 * only new versions. Replaying the same opIds returns the stored server_seq.
 */
export async function applyPush(
  store: ServerEvidenceStore,
  userId: string,
  operations: SyncOutboxOp[]
): Promise<PushResult> {
  const existingPage = await store.getSince(userId, '0');
  const existing = existingPage.records;

  const merge = mergeSync({
    outbox: operations,
    serverChanges: existing,
    localRecords: []
  });

  const pendingWrites: EvidenceRecord[] = [];
  const queued = new Set<string>();

  for (const record of [...merge.toApplyLocally, ...merge.toPushToServer.map((op) => op.record)]) {
    const parsed = EvidenceRecordSchema.parse(record);
    if (queued.has(parsed.opId) || alreadyHas(existing, parsed.opId)) continue;
    queued.add(parsed.opId);
    pendingWrites.push(parsed);
  }

  const applied: AppliedOp[] = [];
  for (const record of pendingWrites) {
    const stored = await store.appendVersion(userId, record);
    const item = toApplied(stored);
    if (item) applied.push(item);
  }

  for (const op of operations) {
    if (applied.some((item) => item.opId === op.opId)) continue;
    const found = existing.find((row) => row.opId === op.opId);
    const item = found ? toApplied(found) : null;
    if (item) applied.push(item);
  }

  const latest = await store.getSince(userId, '0');
  const lastSeq = latest.records.reduce((max, row) => Math.max(max, row.serverSeq ?? 0), 0);

  return {
    applied,
    conflicts: merge.conflicts,
    notices: merge.notices,
    cursor: String(lastSeq)
  };
}
