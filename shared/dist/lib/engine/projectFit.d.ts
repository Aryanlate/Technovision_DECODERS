import { Checklist, Requirement, StudentProfile } from '../types/index.js';
export interface ProjectFitMatch {
    tag: string;
    where: 'tech' | 'domains' | 'title' | 'description';
}
export interface ProjectFit {
    projectId: string;
    title: string;
    score: number;
    matchedTags: string[];
    matchedIn: ProjectFitMatch[];
}
export interface BestFitProjectResult {
    hasProjects: boolean;
    best: ProjectFit | null;
    ranked: ProjectFit[];
    /** e.g. "Lead with your Home Automation project for this opportunity". */
    headline: string;
    reason: string;
    /** The visible rule behind the ranking. */
    rule: string;
}
/** The skill/tag vocabulary requested by the opportunity. */
export declare function requirementTags(checklistInput: Checklist | Requirement[]): string[];
/**
 * Ranks the student's projects against the opportunity's requested skills/tags
 * using a visible overlap rule, then highlights the single best fit.
 */
export declare function bestFitProject(checklistInput: Checklist | Requirement[], profile: StudentProfile): BestFitProjectResult;
//# sourceMappingURL=projectFit.d.ts.map