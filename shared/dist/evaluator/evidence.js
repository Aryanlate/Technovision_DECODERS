"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_FACT_KIND = void 0;
exports.profileEvidenceFromProfile = profileEvidenceFromProfile;
exports.requirementEvidenceFromRequirements = requirementEvidenceFromRequirements;
const index_js_1 = require("../evidence/index.js");
const core_js_1 = require("../lib/engine/core.js");
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
exports.PROFILE_FACT_KIND = 'profile_fact';
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
];
/** One student-confirmed evidence record per profile field. */
function profileEvidenceFromProfile(profile, now = new Date()) {
    const normalized = (0, core_js_1.normalizeStudentProfile)(profile);
    const subjectId = normalized.id || 'student';
    return PROFILE_FIELDS.map((key) => (0, index_js_1.createEvidence)({
        evidenceId: `ev-profile-${subjectId}-${key}`,
        subjectType: 'profile',
        subjectId,
        kind: exports.PROFILE_FACT_KIND,
        key,
        value: normalized[key],
        origin: 'student_confirmed',
        source: { type: 'student_profile' },
        now
    }));
}
/** One user-provided evidence record per requirement of the opportunity. */
function requirementEvidenceFromRequirements(requirements, opportunityId = 'opportunity', now = new Date()) {
    return requirements.map((requirement) => (0, index_js_1.createEvidence)({
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
    }));
}
//# sourceMappingURL=evidence.js.map