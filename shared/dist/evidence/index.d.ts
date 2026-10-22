import { type EvidenceOrigin, type EvidenceRecord, type EvidenceSource, type EvidenceTrust, type SubjectType } from './types.js';
export * from './types.js';
export * from './staleness.js';
/** Input error, e.g. an empty history or a bad value. */
export declare class EvidenceError extends Error {
    constructor(message: string);
}
/** Raised when AI evidence would overwrite a student confirmed record. */
export declare class EvidenceConflictError extends EvidenceError {
    constructor(message: string);
}
/** Stable id generator that works in the browser and in tests. */
export declare function newEvidenceId(now?: Date): string;
/** Id of one write operation; unique per record version. */
export declare function newOpId(now?: Date): string;
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
export declare function defaultTrust(origin: EvidenceOrigin): EvidenceTrust;
/** Builds a validated version-1 record for a new fact. */
export declare function createEvidence(input: CreateEvidenceInput): EvidenceRecord;
/** Every version of one evidenceId, oldest first. Unknown ids return []. */
export declare function historyOf(evidenceId: string, records: EvidenceRecord[]): EvidenceRecord[];
/** The highest version in a history. Throws on an empty history. */
export declare function currentVersion(history: EvidenceRecord[]): EvidenceRecord;
export interface EvidenceRevision {
    /** The new version. */
    record: EvidenceRecord;
    /** The full history, with the replaced version marked 'superseded'. */
    history: EvidenceRecord[];
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
export declare function reviseEvidence(history: EvidenceRecord[], input: ReviseEvidenceInput): EvidenceRevision;
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
export declare function confirmEvidence(history: EvidenceRecord[], input?: ConfirmEvidenceInput): EvidenceRevision;
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
export declare function rejectEvidence(history: EvidenceRecord[], input?: RejectEvidenceInput): EvidenceRevision;
export interface AdvisoryEvidenceInput extends Omit<CreateEvidenceInput, 'origin' | 'evidenceId'> {
    /** Version reference of the record the advice is about, e.g. `ev-1@3`. */
    linkedRef: string;
}
/**
 * Records an AI suggestion about a fact the student already confirmed. It is a
 * separate evidenceId linked through linkedRef, so the confirmed record and its
 * value stay untouched.
 */
export declare function createAdvisoryEvidence(input: AdvisoryEvidenceInput): EvidenceRecord;
/** FNV-1a, 32-bit, hex. Only used to compare content, never for security. */
export declare function fnv1aHash(input: string): string;
/**
 * The fact and where it came from. Versioning, sync bookkeeping and timestamps
 * are excluded, so the same fact gathered on two devices, or in two versions,
 * hashes to the same value.
 */
export declare function contentFields(record: EvidenceRecord): Record<string, unknown>;
/** Same fact in two versions (or two devices) hashes to the same value. */
export declare function contentHash(record: EvidenceRecord): string;
//# sourceMappingURL=index.d.ts.map