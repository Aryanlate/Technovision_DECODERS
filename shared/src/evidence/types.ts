import { z } from 'zod';

// ============================================================================
// Evidence model (pure types, no AI, no network)
//
// Every fact about the student or about an opportunity is stored as a
// versioned, append-only evidence record. A record is never edited: a change
// creates version n+1 with the same evidenceId and every earlier version stays
// in the history.
// ============================================================================

/** What the evidence is about. */
export const SubjectTypeSchema = z.enum(['profile', 'opportunity']);
export type SubjectType = z.infer<typeof SubjectTypeSchema>;

/** Who created the record. Only the student can turn a suggestion into a fact. */
export const EvidenceOriginSchema = z.enum([
  'student_confirmed',
  'user_provided',
  'ai_generated',
  'system_import'
]);
export type EvidenceOrigin = z.infer<typeof EvidenceOriginSchema>;

/** How much the record can be trusted. */
export const EvidenceTrustSchema = z.enum(['verified', 'needs_review', 'unverified']);
export type EvidenceTrust = z.infer<typeof EvidenceTrustSchema>;

/** Lifecycle of a version. Old versions stay stored as 'superseded'. */
export const EvidenceStatusSchema = z.enum(['active', 'superseded', 'rejected', 'conflicted']);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

/** Local device state of the record against the server store. */
export const EvidenceSyncStateSchema = z.enum(['local_only', 'pending', 'synced', 'conflict']);
export type EvidenceSyncState = z.infer<typeof EvidenceSyncStateSchema>;

/** Where a value came from, so the UI can always show the origin and a citation. */
export const EvidenceSourceSchema = z.object({
  type: z.string(),
  url: z.string().optional(),
  agent: z.string().optional(),
  provider: z.string().optional(),
  sentence: z.string().optional()
});
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;

export const EvidenceRecordSchema = z.object({
  /** Stable across every version of the same fact. */
  evidenceId: z.string(),
  subjectType: SubjectTypeSchema,
  subjectId: z.string(),
  kind: z.string(),
  key: z.string(),
  value: z.unknown(),
  origin: EvidenceOriginSchema,
  trust: EvidenceTrustSchema,
  source: EvidenceSourceSchema,
  createdAt: z.string(),
  observedAt: z.string(),
  validUntil: z.string().optional(),
  status: EvidenceStatusSchema,
  /** 1 for a brand new fact, then 2, 3, ... for every change. */
  version: z.number().int().positive(),
  previousVersion: z.number().int().positive().optional(),
  /** Version reference (`evidenceId@version`) this record is linked to. */
  linkedRef: z.string().optional(),
  deviceId: z.string(),
  serverSeq: z.number().int().nonnegative().optional(),
  opId: z.string(),
  syncState: EvidenceSyncStateSchema
});
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

/** Kinds that carry an age limit. Other kinds never go stale by age. */
export const EVIDENCE_KIND = {
  /** Facts gathered by web research (72-hour style lookups). */
  RESEARCHED_FACT: 'researched_fact',
  /** Anything derived from the student's GitHub profile. */
  GITHUB_DERIVED: 'github_derived',
  /** Analysis of pasted profile / resume text. */
  PROFILE_TEXT_ANALYSIS: 'profile_text_analysis'
} as const;

/** Builds a stable `evidenceId@version` reference used by linkedRef. */
export function versionRef(record: Pick<EvidenceRecord, 'evidenceId' | 'version'>): string {
  return `${record.evidenceId}@${record.version}`;
}
