"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVIDENCE_KIND = exports.EvidenceRecordSchema = exports.EvidenceSourceSchema = exports.EvidenceSyncStateSchema = exports.EvidenceStatusSchema = exports.EvidenceTrustSchema = exports.EvidenceOriginSchema = exports.SubjectTypeSchema = void 0;
exports.versionRef = versionRef;
const zod_1 = require("zod");
// ============================================================================
// Evidence model (pure types, no AI, no network)
//
// Every fact about the student or about an opportunity is stored as a
// versioned, append-only evidence record. A record is never edited: a change
// creates version n+1 with the same evidenceId and every earlier version stays
// in the history.
// ============================================================================
/** What the evidence is about. */
exports.SubjectTypeSchema = zod_1.z.enum(['profile', 'opportunity']);
/** Who created the record. Only the student can turn a suggestion into a fact. */
exports.EvidenceOriginSchema = zod_1.z.enum([
    'student_confirmed',
    'user_provided',
    'ai_generated',
    'system_import'
]);
/** How much the record can be trusted. */
exports.EvidenceTrustSchema = zod_1.z.enum(['verified', 'needs_review', 'unverified']);
/** Lifecycle of a version. Old versions stay stored as 'superseded'. */
exports.EvidenceStatusSchema = zod_1.z.enum(['active', 'superseded', 'rejected', 'conflicted']);
/** Local device state of the record against the server store. */
exports.EvidenceSyncStateSchema = zod_1.z.enum(['local_only', 'pending', 'synced', 'conflict']);
/** Where a value came from, so the UI can always show the origin and a citation. */
exports.EvidenceSourceSchema = zod_1.z.object({
    type: zod_1.z.string(),
    url: zod_1.z.string().optional(),
    agent: zod_1.z.string().optional(),
    provider: zod_1.z.string().optional(),
    sentence: zod_1.z.string().optional()
});
exports.EvidenceRecordSchema = zod_1.z.object({
    /** Stable across every version of the same fact. */
    evidenceId: zod_1.z.string(),
    subjectType: exports.SubjectTypeSchema,
    subjectId: zod_1.z.string(),
    kind: zod_1.z.string(),
    key: zod_1.z.string(),
    value: zod_1.z.unknown(),
    origin: exports.EvidenceOriginSchema,
    trust: exports.EvidenceTrustSchema,
    source: exports.EvidenceSourceSchema,
    createdAt: zod_1.z.string(),
    observedAt: zod_1.z.string(),
    validUntil: zod_1.z.string().optional(),
    status: exports.EvidenceStatusSchema,
    /** 1 for a brand new fact, then 2, 3, ... for every change. */
    version: zod_1.z.number().int().positive(),
    previousVersion: zod_1.z.number().int().positive().optional(),
    /** Version reference (`evidenceId@version`) this record is linked to. */
    linkedRef: zod_1.z.string().optional(),
    deviceId: zod_1.z.string(),
    serverSeq: zod_1.z.number().int().nonnegative().optional(),
    opId: zod_1.z.string(),
    syncState: exports.EvidenceSyncStateSchema
});
/** Kinds that carry an age limit. Other kinds never go stale by age. */
exports.EVIDENCE_KIND = {
    /** Facts gathered by web research (72-hour style lookups). */
    RESEARCHED_FACT: 'researched_fact',
    /** Anything derived from the student's GitHub profile. */
    GITHUB_DERIVED: 'github_derived',
    /** Analysis of pasted profile / resume text. */
    PROFILE_TEXT_ANALYSIS: 'profile_text_analysis'
};
/** Builds a stable `evidenceId@version` reference used by linkedRef. */
function versionRef(record) {
    return `${record.evidenceId}@${record.version}`;
}
//# sourceMappingURL=types.js.map