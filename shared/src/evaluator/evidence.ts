import { createEvidence } from '../evidence/index.js';
import type { EvidenceRecord } from '../evidence/types.js';
import { normalizeStudentProfile } from '../lib/engine/core.js';
import type { Requirement, StudentProfile } from '../lib/types/index.js';

// ============================================================================
// Turning a checklist and a profile into evidence records.
//
// The evaluator only reads evidence, so the adapters below are the one place
// that upgrades the legacy in-memory checklist/profile into the versioned
// evidence model:
//   - opportunity requirements  -> subjectType 'opportunity', user_provided
//   - the student's own profile -> subjectType 'profile', student_confirmed
//
// Ids are derived from the subject and key so the same profile always produces
// the same evidence ids: a later change becomes version n+1 of the same id.
// ============================================================================

/** Kind used for a fact about the student profile. Has no age limit. */
export const PROFILE_FACT_KIND = 'profile_fact';

/** Profile fields stored as one evidence record each. */
const PROFILE_FIELDS = [
  'name',
  'year',
  'branch',
  'cgpa',
  'skills',
  'documents',
  'availabilityWeeks',
  'links',
  'projects',
  'hasResume',
  'resumeUrl',
  'githubUrl',
  'portfolioUrl'
] as const;

/** One student-confirmed evidence record per profile field. */
export function profileEvidenceFromProfile(
  profile: StudentProfile,
  now: Date = new Date()
): EvidenceRecord[] {
  const normalized = normalizeStudentProfile(profile);
  const subjectId = normalized.id || 'student';

  return PROFILE_FIELDS.map((key) =>
    createEvidence({
      evidenceId: `ev-profile-${subjectId}-${key}`,
      subjectType: 'profile',
      subjectId,
      kind: PROFILE_FACT_KIND,
      key,
      value: (normalized as Record<string, unknown>)[key],
      origin: 'student_confirmed',
      source: { type: 'student_profile' },
      now
    })
  );
}

/** One user-provided evidence record per requirement of the opportunity. */
export function requirementEvidenceFromRequirements(
  requirements: Requirement[],
  opportunityId = 'opportunity',
  now: Date = new Date()
): EvidenceRecord[] {
  return requirements.map((requirement) =>
    createEvidence({
      evidenceId: `ev-requirement-${opportunityId}-${requirement.id}`,
      subjectType: 'opportunity',
      subjectId: opportunityId,
      kind: requirement.kind,
      key: requirement.id,
      value: requirement,
      origin: 'user_provided',
      trust: 'verified',
      source: { type: 'opportunity_requirement', sentence: requirement.rule },
      now
    })
  );
}
