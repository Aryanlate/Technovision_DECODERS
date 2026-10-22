"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceConflictError = exports.EvidenceError = void 0;
exports.newEvidenceId = newEvidenceId;
exports.newOpId = newOpId;
exports.defaultTrust = defaultTrust;
exports.createEvidence = createEvidence;
exports.historyOf = historyOf;
exports.currentVersion = currentVersion;
exports.reviseEvidence = reviseEvidence;
exports.confirmEvidence = confirmEvidence;
exports.rejectEvidence = rejectEvidence;
exports.createAdvisoryEvidence = createAdvisoryEvidence;
exports.fnv1aHash = fnv1aHash;
exports.contentFields = contentFields;
exports.contentHash = contentHash;
const types_js_1 = require("./types.js");
__exportStar(require("./types.js"), exports);
__exportStar(require("./staleness.js"), exports);
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
class EvidenceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EvidenceError';
    }
}
exports.EvidenceError = EvidenceError;
/** Raised when AI evidence would overwrite a student confirmed record. */
class EvidenceConflictError extends EvidenceError {
    constructor(message) {
        super(message);
        this.name = 'EvidenceConflictError';
    }
}
exports.EvidenceConflictError = EvidenceConflictError;
// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------
let evidenceIdCounter = 0;
let opIdCounter = 0;
/** Stable id generator that works in the browser and in tests. */
function newEvidenceId(now = new Date()) {
    evidenceIdCounter += 1;
    return `ev-${now.getTime().toString(36)}-${evidenceIdCounter.toString(36)}`;
}
/** Id of one write operation; unique per record version. */
function newOpId(now = new Date()) {
    opIdCounter += 1;
    return `op-${now.getTime().toString(36)}-${opIdCounter.toString(36)}`;
}
/** Only the student can verify a fact; imports and AI start as unconfirmed. */
function defaultTrust(origin) {
    if (origin === 'student_confirmed')
        return 'verified';
    if (origin === 'user_provided')
        return 'needs_review';
    return 'unverified';
}
/** Builds a validated version-1 record for a new fact. */
function createEvidence(input) {
    const now = input.now ?? new Date();
    const timestamp = now.toISOString();
    return types_js_1.EvidenceRecordSchema.parse({
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
function historyOf(evidenceId, records) {
    return records
        .filter((record) => record.evidenceId === evidenceId)
        .sort((a, b) => a.version - b.version);
}
/** The highest version in a history. Throws on an empty history. */
function currentVersion(history) {
    if (!history || history.length === 0) {
        throw new EvidenceError('Cannot read the current version: the evidence history is empty.');
    }
    return history.reduce((latest, record) => record.version > latest.version
        ? record
        : record.version === latest.version && record.createdAt > latest.createdAt
            ? record
            : latest);
}
/** Keeps the earlier versions and marks the one just replaced as superseded. */
function withSuperseded(history, replacedVersion) {
    return history.map((record) => record.version === replacedVersion && (record.status === 'active' || record.status === 'conflicted')
        ? { ...record, status: 'superseded' }
        : record);
}
function appendVersion(history, patch, now) {
    const current = currentVersion(history);
    const timestamp = now.toISOString();
    const record = types_js_1.EvidenceRecordSchema.parse({
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
/**
 * Creates version n+1 for an existing fact. The previous version is only
 * marked 'superseded'; its stored content never changes.
 *
 * Throws EvidenceConflictError when ai_generated evidence would revise a
 * student_confirmed record — use createAdvisoryEvidence instead.
 */
function reviseEvidence(history, input) {
    const current = currentVersion(history);
    const now = input.now ?? new Date();
    if (current.origin === 'student_confirmed' && input.origin === 'ai_generated') {
        throw new EvidenceConflictError(`AI evidence cannot revise the student confirmed record ${current.evidenceId}. ` +
            'Create a separate advisory record linked to it with createAdvisoryEvidence instead.');
    }
    return appendVersion(history, {
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
    }, now);
}
/**
 * The student confirms an AI (or imported) record: a new student_confirmed
 * version is appended and linked back to the version that was confirmed.
 * Confirming an already student_confirmed record is an error.
 */
function confirmEvidence(history, input = {}) {
    const current = currentVersion(history);
    if (current.origin === 'student_confirmed') {
        throw new EvidenceError(`Evidence ${current.evidenceId} is already student confirmed.`);
    }
    const now = input.now ?? new Date();
    return appendVersion(history, {
        origin: 'student_confirmed',
        status: 'active',
        trust: input.trust ?? 'verified',
        value: input.value,
        source: input.source,
        observedAt: input.observedAt,
        linkedRef: (0, types_js_1.versionRef)(current),
        deviceId: input.deviceId,
        opId: input.opId
    }, now);
}
/**
 * The student rejects a record. Rejecting is a change too, so it appends a new
 * version with status 'rejected' and keeps the earlier versions.
 */
function rejectEvidence(history, input = {}) {
    const current = currentVersion(history);
    const now = input.now ?? new Date();
    return appendVersion(history, {
        origin: 'student_confirmed',
        status: 'rejected',
        trust: 'verified',
        source: input.source,
        deviceId: input.deviceId,
        opId: input.opId
    }, now);
}
/**
 * Records an AI suggestion about a fact the student already confirmed. It is a
 * separate evidenceId linked through linkedRef, so the confirmed record and its
 * value stay untouched.
 */
function createAdvisoryEvidence(input) {
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
function stableStringify(value) {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value))
        return `[${value.map(stableStringify).join(',')}]`;
    const entries = Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}
/** FNV-1a, 32-bit, hex. Only used to compare content, never for security. */
function fnv1aHash(input) {
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
function contentFields(record) {
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
function contentHash(record) {
    return fnv1aHash(stableStringify(contentFields(record)));
}
//# sourceMappingURL=index.js.map