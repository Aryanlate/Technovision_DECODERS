import {
  createEvidence,
  currentVersion,
  historyOf,
  versionRef,
  type EvidenceRecord
} from '../evidence/index.js';
import { cloneRecord, sortByServerSeq, valuesEqual, versionKey } from './compare.js';
import type {
  SyncConflict,
  SyncInput,
  SyncNotice,
  SyncOutboxOp,
  SyncResult
} from './types.js';

function isAi(record: EvidenceRecord): boolean {
  return record.origin === 'ai_generated';
}

function isStudentConfirmed(record: EvidenceRecord): boolean {
  return record.origin === 'student_confirmed' && record.status !== 'rejected';
}

function isRejectedOrDeleted(record: EvidenceRecord, operation?: SyncOutboxOp['operation']): boolean {
  return record.status === 'rejected' || operation === 'reject' || operation === 'delete';
}

function remoteBase(remote: EvidenceRecord): number {
  return remote.previousVersion ?? Math.max(0, remote.version - 1);
}

/** Two writes of the same evidenceId that both started from the same base. */
function isConcurrent(op: SyncOutboxOp, remote: EvidenceRecord): boolean {
  if (op.evidenceId !== remote.evidenceId || op.opId === remote.opId) return false;
  return op.baseVersion === remoteBase(remote) || op.record.version === remote.version;
}

function asConflicted(record: EvidenceRecord, after: EvidenceRecord): EvidenceRecord {
  const version = Math.max(record.version, after.version) + (record.version <= after.version ? 1 : 0);
  const nextVersion = version === after.version ? after.version + 1 : version;
  return cloneRecord({
    ...record,
    status: 'conflicted',
    version: nextVersion,
    previousVersion: after.version
  });
}

function asAdvisory(ai: EvidenceRecord, confirmed: EvidenceRecord, now: Date): EvidenceRecord {
  return createEvidence({
    evidenceId: `ev-sync-advisory-${ai.evidenceId}-${ai.version}`,
    subjectType: ai.subjectType,
    subjectId: ai.subjectId,
    kind: ai.kind,
    key: ai.key,
    value: ai.value,
    origin: 'ai_generated',
    trust: 'needs_review',
    source: ai.source,
    linkedRef: versionRef(confirmed),
    deviceId: ai.deviceId,
    opId: `op-sync-advisory-${ai.opId}`,
    observedAt: ai.observedAt,
    validUntil: ai.validUntil,
    now
  });
}

function asPush(record: EvidenceRecord, operation: SyncOutboxOp['operation'], baseVersion: number): SyncOutboxOp {
  return {
    opId: record.opId,
    operation,
    evidenceId: record.evidenceId,
    record: cloneRecord(record),
    baseVersion,
    createdAt: record.createdAt
  };
}

/**
 * Pure merge of local outbox ops and server changes. No network, no storage.
 * Server rows are applied in serverSeq order. Every version that is kept is
 * emitted; nothing is deleted.
 */
export function mergeSync(input: SyncInput): SyncResult {
  const now = input.now ?? new Date();
  const notices: SyncNotice[] = [];
  const conflicts: SyncConflict[] = [];
  const toApplyLocally: EvidenceRecord[] = [];
  const outboxTransforms = new Map<string, SyncOutboxOp>();
  const skipPush = new Set<string>();

  const localRecords = (input.localRecords ?? []).map(cloneRecord);
  const knownOps = new Set(localRecords.map((record) => record.opId));
  const knownKeys = new Set(localRecords.map(versionKey));

  const uniqueServer: EvidenceRecord[] = [];
  const serverByOp = new Map<string, EvidenceRecord>();
  for (const remote of sortByServerSeq(input.serverChanges)) {
    if (serverByOp.has(remote.opId)) {
      notices.push({
        code: 'DUPLICATE_OP',
        message: `Duplicate opId ${remote.opId} was ignored.`,
        opId: remote.opId,
        evidenceId: remote.evidenceId
      });
      continue;
    }
    serverByOp.set(remote.opId, remote);
    uniqueServer.push(remote);
  }

  const uniqueOutbox: SyncOutboxOp[] = [];
  const outboxByOp = new Map<string, SyncOutboxOp>();
  for (const op of input.outbox) {
    if (outboxByOp.has(op.opId)) {
      notices.push({
        code: 'DUPLICATE_OP',
        message: `Duplicate opId ${op.opId} was ignored.`,
        opId: op.opId,
        evidenceId: op.evidenceId
      });
      continue;
    }
    outboxByOp.set(op.opId, op);
    uniqueOutbox.push({
      ...op,
      record: cloneRecord(op.record)
    });
  }

  const byEvidence = new Map<string, EvidenceRecord[]>();
  function history(evidenceId: string): EvidenceRecord[] {
    return byEvidence.get(evidenceId) ?? [];
  }
  function headOf(evidenceId: string): EvidenceRecord | undefined {
    const rows = history(evidenceId);
    return rows.length > 0 ? currentVersion(rows) : undefined;
  }
  function remember(record: EvidenceRecord): void {
    const rows = history(record.evidenceId);
    const without = rows.filter((row) => row.version !== record.version);
    byEvidence.set(record.evidenceId, [...without, cloneRecord(record)]);
    knownOps.add(record.opId);
    knownKeys.add(versionKey(record));
  }
  function emitLocal(record: EvidenceRecord): void {
    if (toApplyLocally.some((row) => row.opId === record.opId && versionKey(row) === versionKey(record))) {
      return;
    }
    const copy = cloneRecord(record);
    toApplyLocally.push(copy);
    remember(copy);
  }

  for (const record of localRecords) remember(record);
  for (const op of uniqueOutbox) {
    if (!knownKeys.has(versionKey(op.record))) remember(op.record);
  }

  function concurrentOps(remote: EvidenceRecord): SyncOutboxOp[] {
    return uniqueOutbox.filter((op) => isConcurrent(op, remote));
  }

  function keepAiAsAdvisory(ai: EvidenceRecord, confirmed: EvidenceRecord, code: SyncNotice['code'], message: string): void {
    const advisory = asAdvisory(ai, confirmed, now);
    if (!knownOps.has(advisory.opId)) emitLocal(advisory);
    notices.push({
      code,
      message,
      opId: ai.opId,
      evidenceId: confirmed.evidenceId
    });
  }

  for (const remote of uniqueServer) {
    if (knownOps.has(remote.opId)) continue;

    const ownEcho = uniqueOutbox.some((op) => op.opId === remote.opId);
    if (ownEcho) {
      emitLocal(remote);
      skipPush.add(remote.opId);
      continue;
    }

    const current = headOf(remote.evidenceId);
    const concurrent = concurrentOps(remote);
    const concurrentReject = concurrent.find((op) => isRejectedOrDeleted(op.record, op.operation));
    const concurrentStudent = concurrent.find((op) => isStudentConfirmed(op.record));

    if (isAi(remote) && current && isRejectedOrDeleted(current) && valuesEqual(current.value, remote.value)) {
      keepAiAsAdvisory(
        remote,
        current,
        'REJECTED_BEATS_AI',
        `Student rejection of ${remote.evidenceId} beats an AI re-suggestion of the same value.`
      );
      continue;
    }

    if (isAi(remote) && concurrentReject && valuesEqual(concurrentReject.record.value, remote.value)) {
      keepAiAsAdvisory(
        remote,
        concurrentReject.record,
        'REJECTED_BEATS_AI',
        `Student rejection of ${remote.evidenceId} beats an AI re-suggestion of the same value.`
      );
      continue;
    }

    if (isAi(remote) && current && isStudentConfirmed(current)) {
      keepAiAsAdvisory(
        remote,
        current,
        'AI_DID_NOT_OVERWRITE',
        `AI evidence was kept as advisory; student confirmed ${versionRef(current)} was not overwritten.`
      );
      continue;
    }

    if (isAi(remote) && concurrentStudent) {
      keepAiAsAdvisory(
        remote,
        concurrentStudent.record,
        'AI_DID_NOT_OVERWRITE',
        `AI evidence was kept as advisory; student confirmed ${versionRef(concurrentStudent.record)} was not overwritten.`
      );
      continue;
    }

    if (remote.origin === 'student_confirmed' && concurrentStudent && !valuesEqual(concurrentStudent.record.value, remote.value)) {
      emitLocal(remote);
      const conflicted = asConflicted(concurrentStudent.record, remote);
      emitLocal(conflicted);
      outboxTransforms.set(
        concurrentStudent.opId,
        asPush(conflicted, concurrentStudent.operation, remote.version)
      );
      conflicts.push({
        evidenceId: remote.evidenceId,
        local: cloneRecord(conflicted),
        remote: cloneRecord(remote),
        reason: 'student_confirmed values differ; both versions were kept and marked conflicted.'
      });
      continue;
    }

    if (isAi(remote) && current && isAi(current)) {
      emitLocal(remote);
      notices.push({
        code: 'AI_SUPERSEDED',
        message: `Newer server version ${versionRef(remote)} is current; older AI versions stay in history.`,
        opId: remote.opId,
        evidenceId: remote.evidenceId
      });
      for (const op of concurrent.filter((item) => isAi(item.record))) {
        skipPush.add(op.opId);
      }
      continue;
    }

    emitLocal(remote);
  }

  const toPushToServer: SyncOutboxOp[] = [];
  for (const op of uniqueOutbox) {
    if (serverByOp.has(op.opId)) continue;
    const transformed = outboxTransforms.get(op.opId);
    if (transformed) {
      toPushToServer.push(transformed);
      continue;
    }
    if (skipPush.has(op.opId)) continue;

    const current = headOf(op.evidenceId);

    if (isAi(op.record) && current && isStudentConfirmed(current) && current.opId !== op.opId) {
      keepAiAsAdvisory(
        op.record,
        current,
        'AI_DID_NOT_OVERWRITE',
        `AI evidence was kept as advisory; student confirmed ${versionRef(current)} was not overwritten.`
      );
      toPushToServer.push(asPush(asAdvisory(op.record, current, now), 'add', 0));
      continue;
    }

    if (isAi(op.record) && current && isRejectedOrDeleted(current) && valuesEqual(current.value, op.record.value)) {
      keepAiAsAdvisory(
        op.record,
        current,
        'REJECTED_BEATS_AI',
        `Student rejection of ${op.evidenceId} beats an AI re-suggestion of the same value.`
      );
      continue;
    }

    if (isAi(op.record) && current && isAi(current) && current.opId !== op.opId && current.serverSeq !== undefined) {
      skipPush.add(op.opId);
      continue;
    }

    toPushToServer.push({
      ...op,
      record: cloneRecord(op.record)
    });
  }

  toPushToServer.sort((a, b) => {
    const id = a.evidenceId.localeCompare(b.evidenceId);
    if (id !== 0) return id;
    return a.record.version - b.record.version;
  });

  return { toApplyLocally, toPushToServer, conflicts, notices };
}

export function currentAfterMerge(
  localRecords: EvidenceRecord[],
  applied: EvidenceRecord[],
  evidenceId: string
): EvidenceRecord | undefined {
  const history = historyOf(evidenceId, [...localRecords, ...applied]);
  return history.length > 0 ? currentVersion(history) : undefined;
}
