import {
  EvidenceRecordSchema,
  type EvidenceRecord
} from '@opportunity-kit/shared';

/** One row in evidence_versions (snake_case, matches the SQL migration). */
export interface EvidenceVersionRow {
  evidence_id: string;
  version: number;
  user_id: string;
  server_seq: number;
  received_at: string;
  subject_type: EvidenceRecord['subjectType'];
  subject_id: string;
  kind: string;
  key: string;
  value: unknown;
  origin: EvidenceRecord['origin'];
  trust: EvidenceRecord['trust'];
  source: EvidenceRecord['source'];
  created_at: string;
  observed_at: string;
  valid_until: string | null;
  status: EvidenceRecord['status'];
  previous_version: number | null;
  linked_ref: string | null;
  device_id: string;
  op_id: string;
  sync_state: EvidenceRecord['syncState'];
}

export interface SyncOpRow {
  op_id: string;
  user_id: string;
  applied_at: string;
}

function iso(value: string | Date): string {
  return new Date(value).toISOString();
}

/** Builds a row ready to insert. server_seq / received_at may be filled by the DB. */
export function toVersionRow(
  userId: string,
  record: EvidenceRecord,
  extras: { serverSeq?: number; receivedAt?: string } = {}
): EvidenceVersionRow {
  const parsed = EvidenceRecordSchema.parse(record);
  return {
    evidence_id: parsed.evidenceId,
    version: parsed.version,
    user_id: userId,
    server_seq: extras.serverSeq ?? parsed.serverSeq ?? 0,
    received_at: extras.receivedAt ?? new Date().toISOString(),
    subject_type: parsed.subjectType,
    subject_id: parsed.subjectId,
    kind: parsed.kind,
    key: parsed.key,
    value: parsed.value,
    origin: parsed.origin,
    trust: parsed.trust,
    source: parsed.source,
    created_at: parsed.createdAt,
    observed_at: parsed.observedAt,
    valid_until: parsed.validUntil ?? null,
    status: parsed.status,
    previous_version: parsed.previousVersion ?? null,
    linked_ref: parsed.linkedRef ?? null,
    device_id: parsed.deviceId,
    op_id: parsed.opId,
    sync_state: parsed.syncState
  };
}

export function fromVersionRow(row: EvidenceVersionRow): EvidenceRecord {
  return EvidenceRecordSchema.parse({
    evidenceId: row.evidence_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    kind: row.kind,
    key: row.key,
    value: row.value,
    origin: row.origin,
    trust: row.trust,
    source: row.source,
    createdAt: iso(row.created_at),
    observedAt: iso(row.observed_at),
    validUntil: row.valid_until ? iso(row.valid_until) : undefined,
    status: row.status,
    version: row.version,
    previousVersion: row.previous_version ?? undefined,
    linkedRef: row.linked_ref ?? undefined,
    deviceId: row.device_id,
    serverSeq: Number(row.server_seq),
    opId: row.op_id,
    syncState: row.sync_state
  });
}

export function parseCursor(cursor: string | null | undefined): number {
  if (cursor === null || cursor === undefined || cursor === '') return 0;
  const parsed = Number.parseInt(cursor, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function cloneRecord(record: EvidenceRecord): EvidenceRecord {
  return EvidenceRecordSchema.parse(JSON.parse(JSON.stringify(record)));
}
