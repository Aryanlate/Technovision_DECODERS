import {
  EvidenceRecordSchema,
  versionRef,
  type EvidenceOrigin,
  type EvidenceRecord,
  type EvidenceSource,
  type EvidenceStatus,
  type EvidenceTrust,
  type SubjectType
} from './types.js';

export * from './types.js';
export * from './staleness.js';

// ============================================================================
// Evidence helpers (pure TypeScript, no AI, no network).
//
// Records are append-only: nothing here edits a stored record. A change
// produces a new version n+1 that keeps the same evidenceId, and the earlier
// versions stay in the history. An ai_generated change can never revise a
// student_confirmed record: it must become a separate advisory record linked
// to it instead.
// ============================================================================

/** Input error, e.g. an empty history or a bad value. */
export class EvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvidenceError';
  }
}

/** Raised when AI evidence would overwrite a student confirmed record. */
export class EvidenceConflictError extends EvidenceError {
  constructor(message: string) {
    super(message);
    this.name = 'EvidenceConflictError';
  }
}

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

let evidenceIdCounter = 0;
let opIdCounter = 0;

/** Stable id generator that works in the browser and in tests. */
export function newEvidenceId(now: Date = new Date()): string {
  evidenceIdCounter += 1;
  return `ev-${now.getTime().toString(36)}-${evidenceIdCounter.toString(36)}`;
}

/** Id of one write operation; unique per record version. */
export function newOpId(now: Date = new Date()): string {
  opIdCounter += 1;
  return `op-${now.getTime().toString(36)}-${opIdCounter.toString(36)}`;
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export interface CreateEvidenceInput {
  subjectType: SubjectType;
  subjectId: string;
  kind: string;
  key: string;
  value: unknown;
  origin: EvidenceOrigin;
  trust?: EvidenceTrust;
  source: EvidenceSource;
  observedAt?: string;
  validUntil?: string;
  linkedRef?: string;
  deviceId?: string;
  evidenceId?: string;
  opId?: string;
  /** Overridable for deterministic tests. */
  now?: Date;
}

/** Only the student can verify a fact; imports and AI start as unconfirmed. */
export function defaultTrust(origin: EvidenceOrigin): EvidenceTrust {
  if (origin === 'student_confirmed') return 'verified';
  if (origin === 'user_provided') return 'needs_review';
  return 'unverified';
}

/** Builds a validated version-1 record for a new fact. */
export function createEvidence(input: CreateEvidenceInput): EvidenceRecord {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  return EvidenceRecordSchema.parse({
    evidenceId: input.evidenceId ?? newEvidenceId(now),
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    kind: input.kind,
    key: input.key,
    value: input.value,
    origin: input.origin,
    trust: input.trust ?? defaultTrust(input.origin),
    source: input.source,
    createdAt: timestamp,
    observedAt: input.observedAt ?? timestamp,
    validUntil: input.validUntil,
    status: 'active',
    version: 1,
    linkedRef: input.linkedRef,
    deviceId: input.deviceId ?? 'local',
    opId: input.opId ?? newOpId(now),
    syncState: 'local_only'
  });
}

// ---------------------------------------------------------------------------
// History lookups
// ---------------------------------------------------------------------------

/** Every version of one evidenceId, oldest first. Unknown ids return []. */
export function historyOf(evidenceId: string, records: EvidenceRecord[]): EvidenceRecord[] {
  return records
    .filter((record) => record.evidenceId === evidenceId)
    .sort((a, b) => a.version - b.version);
}

/** The highest version in a history. Throws on an empty history. */
export function currentVersion(history: EvidenceRecord[]): EvidenceRecord {
  if (!history || history.length === 0) {
    throw new EvidenceError('Cannot read the current version: the evidence history is empty.');
  }
  return history.reduce((latest, record) =>
    record.version > latest.version
      ? record
      : record.version === latest.version && record.createdAt > latest.createdAt
        ? record
        : latest
  );
}

// ---------------------------------------------------------------------------
// Append-only changes
// ---------------------------------------------------------------------------

export interface EvidenceRevision {
  /** The new version. */
  record: EvidenceRecord;
  /** The full history, with the replaced version marked 'superseded'. */
  history: EvidenceRecord[];
}

interface AppendPatch {
  origin: EvidenceOrigin;
  status: EvidenceStatus;
  trust: EvidenceTrust;
  kind?: string;
  key?: string;
  value?: unknown;
  source?: EvidenceSource;
  observedAt?: string;
  validUntil?: string;
  linkedRef?: string;
  deviceId?: string;
  opId?: string;
}

/** Keeps the earlier versions and marks the one just replaced as superseded. */
function withSuperseded(history: EvidenceRecord[], replacedVersion: number): EvidenceRecord[] {
  return history.map((record) =>
    record.version === replacedVersion && (record.status === 'active' || record.status === 'conflicted')
      ? { ...record, status: 'superseded' as const }
      : record
  );
}

function appendVersion(history: EvidenceRecord[], patch: AppendPatch, now: Date): EvidenceRevision {
  const current = currentVersion(history);
  const timestamp = now.toISOString();
  const record = EvidenceRecordSchema.parse({
    evidenceId: current.evidenceId,
    subjectType: current.subjectType,
    subjectId: current.subjectId,
    kind: patch.kind ?? current.kind,
    key: patch.key ?? current.key,
    value: patch.value === undefined ? current.value : patch.value,
    origin: patch.origin,
    trust: patch.trust,
    source: patch.source ?? current.source,
    createdAt: timestamp,
    observedAt: patch.observedAt ?? timestamp,
    validUntil: patch.validUntil ?? current.validUntil,
    status: patch.status,
    version: current.version + 1,
    previousVersion: current.version,
    linkedRef: patch.linkedRef,
    deviceId: patch.deviceId ?? current.deviceId,
    opId: patch.opId ?? newOpId(now),
    syncState: 'local_only'
  });

  return { record, history: [...withSuperseded(history, current.version), record] };
}

export interface ReviseEvidenceInput {
  origin: EvidenceOrigin;
  value?: unknown;
  kind?: string;
  key?: string;
  trust?: EvidenceTrust;
  source?: EvidenceSource;
  observedAt?: string;
  validUntil?: string;
  linkedRef?: string;
  deviceId?: string;
  opId?: string;
  now?: Date;
}

/**
 * Creates version n+1 for an existing fact. The previous version is only
 * marked 'superseded'; its stored content never changes.
 *
 * Throws EvidenceConflictError when ai_generated evidence would revise a
 * student_confirmed record — use createAdvisoryEvidence instead.
 */
export function reviseEvidence(history: EvidenceRecord[], input: ReviseEvidenceInput): EvidenceRevision {
  const current = currentVersion(history);
  const now = input.now ?? new Date();

  if (current.origin === 'student_confirmed' && input.origin === 'ai_generated') {
    throw new EvidenceConflictError(
      `AI evidence cannot revise the student confirmed record ${current.evidenceId}. ` +
        'Create a separate advisory record linked to it with createAdvisoryEvidence instead.'
    );
  }

  return appendVersion(
    history,
    {
      origin: input.origin,
      status: 'active',
      trust: input.trust ?? defaultTrust(input.origin),
      value: input.value,
      kind: input.kind,
      key: input.key,
      source: input.source,
      observedAt: input.observedAt,
      validUntil: input.validUntil,
      linkedRef: input.linkedRef,
      deviceId: input.deviceId,
      opId: input.opId
    },
    now
  );
}

export interface ConfirmEvidenceInput {
  value?: unknown;
  trust?: EvidenceTrust;
  source?: EvidenceSource;
  observedAt?: string;
  deviceId?: string;
  opId?: string;
  now?: Date;
}

/**
 * The student confirms an AI (or imported) record: a new student_confirmed
 * version is appended and linked back to the version that was confirmed.
 * Confirming an already student_confirmed record is an error.
 */
export function confirmEvidence(history: EvidenceRecord[], input: ConfirmEvidenceInput = {}): EvidenceRevision {
  const current = currentVersion(history);
  if (current.origin === 'student_confirmed') {
    throw new EvidenceError(`Evidence ${current.evidenceId} is already student confirmed.`);
  }
  const now = input.now ?? new Date();

  return appendVersion(
    history,
    {
      origin: 'student_confirmed',
      status: 'active',
      trust: input.trust ?? 'verified',
      value: input.value,
      source: input.source,
      observedAt: input.observedAt,
      linkedRef: versionRef(current),
      deviceId: input.deviceId,
      opId: input.opId
    },
    now
  );
}

export interface RejectEvidenceInput {
  source?: EvidenceSource;
  deviceId?: string;
  opId?: string;
  now?: Date;
}

/**
 * The student rejects a record. Rejecting is a change too, so it appends a new
 * version with status 'rejected' and keeps the earlier versions.
 */
export function rejectEvidence(history: EvidenceRecord[], input: RejectEvidenceInput = {}): EvidenceRevision {
  const current = currentVersion(history);
  const now = input.now ?? new Date();

  return appendVersion(
    history,
    {
      origin: 'student_confirmed',
      status: 'rejected',
      trust: 'verified',
      source: input.source,
      deviceId: input.deviceId,
      opId: input.opId
    },
    now
  );
}

export interface AdvisoryEvidenceInput extends Omit<CreateEvidenceInput, 'origin' | 'evidenceId'> {
  /** Version reference of the record the advice is about, e.g. `ev-1@3`. */
  linkedRef: string;
}

/**
 * Records an AI suggestion about a fact the student already confirmed. It is a
 * separate evidenceId linked through linkedRef, so the confirmed record and its
 * value stay untouched.
 */
export function createAdvisoryEvidence(input: AdvisoryEvidenceInput): EvidenceRecord {
  return createEvidence({
    ...input,
    origin: 'ai_generated',
    trust: input.trust ?? 'needs_review',
    linkedRef: input.linkedRef
  });
}

// ---------------------------------------------------------------------------
// Content hashing (deterministic, works in the browser)
// ---------------------------------------------------------------------------

/** Stable stringify so key order in a value never changes the hash. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

/** FNV-1a, 32-bit, hex. Only used to compare content, never for security. */
export function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * The fact and where it came from. Versioning, sync bookkeeping and timestamps
 * are excluded, so the same fact gathered on two devices, or in two versions,
 * hashes to the same value.
 */
export function contentFields(record: EvidenceRecord): Record<string, unknown> {
  return {
    subjectType: record.subjectType,
    subjectId: record.subjectId,
    kind: record.kind,
    key: record.key,
    value: record.value,
    origin: record.origin,
    source: record.source
  };
}

/** Same fact in two versions (or two devices) hashes to the same value. */
export function contentHash(record: EvidenceRecord): string {
  return fnv1aHash(stableStringify(contentFields(record)));
}
