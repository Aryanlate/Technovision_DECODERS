import { Project, RequirementStatus } from '../types/index.js';
export interface RuleResult {
    status: RequirementStatus;
    reason: string;
    ruleUsed: string;
    nextStep?: string;
    studentValue?: string;
    expected?: string;
}
export declare const SKILL_ALIASES: Record<string, string>;
/**
 * Normalizes skill strings for case-insensitive matching and alias resolution.
 * e.g., "JS" -> "javascript", "Node" -> "nodejs", "node.js" -> "nodejs"
 */
export declare function canonicalizeSkill(skill: string): string;
/**
 * Validates whether a given string is a plausible URL format.
 */
export declare function isValidUrl(url: string | null | undefined): boolean;
export declare function numberRule(studentValue: number | null | undefined, threshold: number, mode?: 'min' | 'max' | 'exact', metricName?: string): RuleResult;
export declare function rangeRule(studentValue: number | null | undefined, allowedValues: number[], label?: string): RuleResult;
export declare function listRule(profileSkills: string[] | null | undefined, requiredSkills: string[], aliases?: Record<string, string>): RuleResult;
export declare function documentRule(profileDocuments: Array<{
    name?: string;
    type: string;
    url?: string;
    verified?: boolean;
}> | null | undefined, requiredType: string, legacyFlag?: boolean | null, legacyUrl?: string): RuleResult;
export declare function linkRule(links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    instagram?: string;
} | null | undefined, linkKind: 'github' | 'portfolio' | 'linkedin' | 'instagram' | 'portfolioOrGithub' | 'githubOrPortfolio' | string, legacyValues?: {
    githubUrl?: string;
    portfolioUrl?: string;
}): RuleResult;
export declare function countRule(projects: Project[] | null | undefined, requiredCount: number, filterFn?: (p: Project) => boolean, label?: string): RuleResult;
export declare function tagRule(projects: Project[] | null | undefined, requestedTag: string): RuleResult;
export declare function proofRule(project: Project | null | undefined, label?: string): RuleResult;
export declare function availabilityRule(studentWeeks: number | null | undefined, requiredWeeks: number): RuleResult;
export declare function deadlineRule(deadline: string | Date | null | undefined, currentDate?: Date): RuleResult;
//# sourceMappingURL=rules.d.ts.map