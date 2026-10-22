import { z } from 'zod';
import { type Requirement } from './types/index.js';
export declare const DrivePartnerTypeSchema: z.ZodEnum<["company", "placement-cell", "other"]>;
export type DrivePartnerType = z.infer<typeof DrivePartnerTypeSchema>;
export declare const DriveChecklistSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    partnerName: z.ZodString;
    partnerType: z.ZodDefault<z.ZodEnum<["company", "placement-cell", "other"]>>;
    title: z.ZodString;
    location: z.ZodDefault<z.ZodString>;
    /** ISO date (YYYY-MM-DD) or full ISO timestamp. Empty when not given. */
    deadline: z.ZodDefault<z.ZodString>;
    applyUrl: z.ZodDefault<z.ZodString>;
    notes: z.ZodDefault<z.ZodString>;
    requirements: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodDefault<z.ZodEnum<["year", "cgpa", "skills", "document", "link", "availability", "projectCount", "projectTag", "deadline", "custom"]>>;
        label: z.ZodString;
        value: z.ZodOptional<z.ZodAny>;
        required: z.ZodDefault<z.ZodBoolean>;
        sourceSentence: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodEnum<["education", "academic", "skills", "documents", "links", "availability", "experience", "general"]>>;
        rule: z.ZodOptional<z.ZodString>;
        parsedRule: z.ZodOptional<z.ZodObject<{
            allowedYears: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            degreeKeywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            minCgpa: z.ZodOptional<z.ZodNumber>;
            maxCgpa: z.ZodOptional<z.ZodNumber>;
            requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            preferredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            resumeRequired: z.ZodOptional<z.ZodBoolean>;
            githubOrPortfolioRequired: z.ZodOptional<z.ZodBoolean>;
            githubRequired: z.ZodOptional<z.ZodBoolean>;
            portfolioRequired: z.ZodOptional<z.ZodBoolean>;
            minAvailabilityWeeks: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            allowedYears?: number[] | undefined;
            degreeKeywords?: string[] | undefined;
            minCgpa?: number | undefined;
            maxCgpa?: number | undefined;
            requiredSkills?: string[] | undefined;
            preferredSkills?: string[] | undefined;
            resumeRequired?: boolean | undefined;
            githubOrPortfolioRequired?: boolean | undefined;
            githubRequired?: boolean | undefined;
            portfolioRequired?: boolean | undefined;
            minAvailabilityWeeks?: number | undefined;
        }, {
            allowedYears?: number[] | undefined;
            degreeKeywords?: string[] | undefined;
            minCgpa?: number | undefined;
            maxCgpa?: number | undefined;
            requiredSkills?: string[] | undefined;
            preferredSkills?: string[] | undefined;
            resumeRequired?: boolean | undefined;
            githubOrPortfolioRequired?: boolean | undefined;
            githubRequired?: boolean | undefined;
            portfolioRequired?: boolean | undefined;
            minAvailabilityWeeks?: number | undefined;
        }>>;
        importance: z.ZodOptional<z.ZodEnum<["mandatory", "preferred"]>>;
    }, "strip", z.ZodTypeAny, {
        kind: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom";
        id: string;
        label: string;
        required: boolean;
        value?: any;
        title?: string | undefined;
        sourceSentence?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        rule?: string | undefined;
        parsedRule?: {
            allowedYears?: number[] | undefined;
            degreeKeywords?: string[] | undefined;
            minCgpa?: number | undefined;
            maxCgpa?: number | undefined;
            requiredSkills?: string[] | undefined;
            preferredSkills?: string[] | undefined;
            resumeRequired?: boolean | undefined;
            githubOrPortfolioRequired?: boolean | undefined;
            githubRequired?: boolean | undefined;
            portfolioRequired?: boolean | undefined;
            minAvailabilityWeeks?: number | undefined;
        } | undefined;
        importance?: "mandatory" | "preferred" | undefined;
    }, {
        id: string;
        label: string;
        value?: any;
        kind?: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom" | undefined;
        title?: string | undefined;
        required?: boolean | undefined;
        sourceSentence?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        rule?: string | undefined;
        parsedRule?: {
            allowedYears?: number[] | undefined;
            degreeKeywords?: string[] | undefined;
            minCgpa?: number | undefined;
            maxCgpa?: number | undefined;
            requiredSkills?: string[] | undefined;
            preferredSkills?: string[] | undefined;
            resumeRequired?: boolean | undefined;
            githubOrPortfolioRequired?: boolean | undefined;
            githubRequired?: boolean | undefined;
            portfolioRequired?: boolean | undefined;
            minAvailabilityWeeks?: number | undefined;
        } | undefined;
        importance?: "mandatory" | "preferred" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    id: string;
    title: string;
    deadline: string;
    requirements: {
        kind: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom";
        id: string;
        label: string;
        required: boolean;
        value?: any;
        title?: string | undefined;
        sourceSentence?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        rule?: string | undefined;
        parsedRule?: {
            allowedYears?: number[] | undefined;
            degreeKeywords?: string[] | undefined;
            minCgpa?: number | undefined;
            maxCgpa?: number | undefined;
            requiredSkills?: string[] | undefined;
            preferredSkills?: string[] | undefined;
            resumeRequired?: boolean | undefined;
            githubOrPortfolioRequired?: boolean | undefined;
            githubRequired?: boolean | undefined;
            portfolioRequired?: boolean | undefined;
            minAvailabilityWeeks?: number | undefined;
        } | undefined;
        importance?: "mandatory" | "preferred" | undefined;
    }[];
    notes: string;
    partnerName: string;
    partnerType: "other" | "company" | "placement-cell";
    location: string;
    applyUrl: string;
}, {
    createdAt: string;
    id: string;
    title: string;
    partnerName: string;
    deadline?: string | undefined;
    requirements?: {
        id: string;
        label: string;
        value?: any;
        kind?: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom" | undefined;
        title?: string | undefined;
        required?: boolean | undefined;
        sourceSentence?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        rule?: string | undefined;
        parsedRule?: {
            allowedYears?: number[] | undefined;
            degreeKeywords?: string[] | undefined;
            minCgpa?: number | undefined;
            maxCgpa?: number | undefined;
            requiredSkills?: string[] | undefined;
            preferredSkills?: string[] | undefined;
            resumeRequired?: boolean | undefined;
            githubOrPortfolioRequired?: boolean | undefined;
            githubRequired?: boolean | undefined;
            portfolioRequired?: boolean | undefined;
            minAvailabilityWeeks?: number | undefined;
        } | undefined;
        importance?: "mandatory" | "preferred" | undefined;
    }[] | undefined;
    notes?: string | undefined;
    partnerType?: "other" | "company" | "placement-cell" | undefined;
    location?: string | undefined;
    applyUrl?: string | undefined;
}>;
export type DriveChecklist = z.infer<typeof DriveChecklistSchema>;
/** Short, URL-safe id for a published drive. */
export declare function newDriveId(now?: Date): string;
export interface DriveChecklistInput {
    partnerName: string;
    partnerType?: DrivePartnerType;
    title: string;
    location?: string;
    deadline?: string;
    applyUrl?: string;
    notes?: string;
    requirements: Requirement[];
    /** Overridable for deterministic tests. */
    id?: string;
    now?: Date;
}
/**
 * Checks a publisher's draft before it is published. Returns plain-language
 * messages (empty array = valid) so the /drive/new form can show them directly.
 */
export declare function validateDriveInput(input: {
    partnerName?: string;
    title?: string;
    requirements?: unknown[];
}): string[];
/** Builds and validates a published checklist from a partner's draft. */
export declare function createDriveChecklist(input: DriveChecklistInput): DriveChecklist;
//# sourceMappingURL=drive.d.ts.map