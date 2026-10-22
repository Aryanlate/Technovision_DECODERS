import type { EvidenceRecord } from '../evidence/types.js';
import type { Requirement, StudentProfile } from '../lib/types/index.js';
/** Kind used for a fact about the student profile. Has no age limit. */
export declare const PROFILE_FACT_KIND = "profile_fact";
/** One student-confirmed evidence record per profile field. */
export declare function profileEvidenceFromProfile(profile: StudentProfile, now?: Date): EvidenceRecord[];
/** One user-provided evidence record per requirement of the opportunity. */
export declare function requirementEvidenceFromRequirements(requirements: Requirement[], opportunityId?: string, now?: Date): EvidenceRecord[];
//# sourceMappingURL=evidence.d.ts.map