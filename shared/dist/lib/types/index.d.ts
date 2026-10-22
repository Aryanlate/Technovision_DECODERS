import { z } from 'zod';
import { type EvidenceRecord } from '../../evidence/types.js';
export declare const RequirementStatusSchema: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
export type RequirementStatus = z.infer<typeof RequirementStatusSchema>;
export declare const RequirementCategorySchema: z.ZodEnum<["education", "academic", "skills", "documents", "links", "availability", "experience", "general"]>;
export type RequirementCategory = z.infer<typeof RequirementCategorySchema>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    domains: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tech: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    role: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodString>;
    proofLink: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    link: z.ZodOptional<z.ZodString>;
    techStack: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: string;
    id: string;
    title: string;
    domains: string[];
    tech: string[];
    role: string;
    proofLink: string;
    description?: string | undefined;
    link?: string | undefined;
    techStack?: string[] | undefined;
}, {
    id: string;
    title: string;
    status?: string | undefined;
    domains?: string[] | undefined;
    tech?: string[] | undefined;
    role?: string | undefined;
    proofLink?: string | undefined;
    description?: string | undefined;
    link?: string | undefined;
    techStack?: string[] | undefined;
}>;
export type Project = z.infer<typeof ProjectSchema>;
export declare const DocumentTypeSchema: z.ZodEnum<["resume", "marksheet", "incomeCertificate", "idProof", "recommendationLetter", "other"]>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export declare const DocumentItemSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    type: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    verified: z.ZodDefault<z.ZodBoolean>;
    issuedDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    verified: boolean;
    name: string;
    url?: string | undefined;
    id?: string | undefined;
    issuedDate?: string | undefined;
}, {
    type: string;
    name: string;
    verified?: boolean | undefined;
    url?: string | undefined;
    id?: string | undefined;
    issuedDate?: string | undefined;
}>;
export type DocumentItem = z.infer<typeof DocumentItemSchema>;
export type StudentDocument = DocumentItem;
export declare const StudentLinksSchema: z.ZodObject<{
    github: z.ZodDefault<z.ZodString>;
    linkedin: z.ZodDefault<z.ZodString>;
    instagram: z.ZodDefault<z.ZodString>;
    portfolio: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    github: string;
    linkedin: string;
    instagram: string;
    portfolio: string;
}, {
    github?: string | undefined;
    linkedin?: string | undefined;
    instagram?: string | undefined;
    portfolio?: string | undefined;
}>;
export type StudentLinks = z.infer<typeof StudentLinksSchema>;
export declare const PlanTypeSchema: z.ZodEnum<["free", "premium", "college"]>;
export type PlanType = z.infer<typeof PlanTypeSchema>;
export declare const StudentProfileSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodDefault<z.ZodString>;
    year: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    branch: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    cgpa: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    skills: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    documents: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        type: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodDefault<z.ZodBoolean>;
        issuedDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        verified: boolean;
        name: string;
        url?: string | undefined;
        id?: string | undefined;
        issuedDate?: string | undefined;
    }, {
        type: string;
        name: string;
        verified?: boolean | undefined;
        url?: string | undefined;
        id?: string | undefined;
        issuedDate?: string | undefined;
    }>, "many">>>;
    availabilityWeeks: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    links: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        github: z.ZodDefault<z.ZodString>;
        linkedin: z.ZodDefault<z.ZodString>;
        instagram: z.ZodDefault<z.ZodString>;
        portfolio: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        github: string;
        linkedin: string;
        instagram: string;
        portfolio: string;
    }, {
        github?: string | undefined;
        linkedin?: string | undefined;
        instagram?: string | undefined;
        portfolio?: string | undefined;
    }>>>;
    projects: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        domains: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        tech: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodDefault<z.ZodString>;
        status: z.ZodDefault<z.ZodString>;
        proofLink: z.ZodDefault<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        link: z.ZodOptional<z.ZodString>;
        techStack: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        id: string;
        title: string;
        domains: string[];
        tech: string[];
        role: string;
        proofLink: string;
        description?: string | undefined;
        link?: string | undefined;
        techStack?: string[] | undefined;
    }, {
        id: string;
        title: string;
        status?: string | undefined;
        domains?: string[] | undefined;
        tech?: string[] | undefined;
        role?: string | undefined;
        proofLink?: string | undefined;
        description?: string | undefined;
        link?: string | undefined;
        techStack?: string[] | undefined;
    }>, "many">>;
    plan: z.ZodOptional<z.ZodEnum<["free", "premium", "college"]>>;
    monthlyChecksUsed: z.ZodOptional<z.ZodNumber>;
    monthlyChecksLimit: z.ZodOptional<z.ZodNumber>;
    yearOfStudy: z.ZodOptional<z.ZodNumber>;
    degree: z.ZodOptional<z.ZodString>;
    hasResume: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    resumeUrl: z.ZodOptional<z.ZodString>;
    githubUrl: z.ZodOptional<z.ZodString>;
    portfolioUrl: z.ZodOptional<z.ZodString>;
    linkedInText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    skills: string[];
    documents: {
        type: string;
        verified: boolean;
        name: string;
        url?: string | undefined;
        id?: string | undefined;
        issuedDate?: string | undefined;
    }[];
    links: {
        github: string;
        linkedin: string;
        instagram: string;
        portfolio: string;
    };
    name: string;
    branch: string;
    projects: {
        status: string;
        id: string;
        title: string;
        domains: string[];
        tech: string[];
        role: string;
        proofLink: string;
        description?: string | undefined;
        link?: string | undefined;
        techStack?: string[] | undefined;
    }[];
    id?: string | undefined;
    year?: number | null | undefined;
    cgpa?: number | null | undefined;
    availabilityWeeks?: number | null | undefined;
    plan?: "free" | "premium" | "college" | undefined;
    monthlyChecksUsed?: number | undefined;
    monthlyChecksLimit?: number | undefined;
    yearOfStudy?: number | undefined;
    degree?: string | undefined;
    hasResume?: boolean | null | undefined;
    resumeUrl?: string | undefined;
    githubUrl?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedInText?: string | undefined;
}, {
    skills?: string[] | undefined;
    documents?: {
        type: string;
        name: string;
        verified?: boolean | undefined;
        url?: string | undefined;
        id?: string | undefined;
        issuedDate?: string | undefined;
    }[] | undefined;
    links?: {
        github?: string | undefined;
        linkedin?: string | undefined;
        instagram?: string | undefined;
        portfolio?: string | undefined;
    } | undefined;
    id?: string | undefined;
    name?: string | undefined;
    year?: number | null | undefined;
    branch?: string | undefined;
    cgpa?: number | null | undefined;
    availabilityWeeks?: number | null | undefined;
    projects?: {
        id: string;
        title: string;
        status?: string | undefined;
        domains?: string[] | undefined;
        tech?: string[] | undefined;
        role?: string | undefined;
        proofLink?: string | undefined;
        description?: string | undefined;
        link?: string | undefined;
        techStack?: string[] | undefined;
    }[] | undefined;
    plan?: "free" | "premium" | "college" | undefined;
    monthlyChecksUsed?: number | undefined;
    monthlyChecksLimit?: number | undefined;
    yearOfStudy?: number | undefined;
    degree?: string | undefined;
    hasResume?: boolean | null | undefined;
    resumeUrl?: string | undefined;
    githubUrl?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedInText?: string | undefined;
}>;
export type StudentProfile = z.infer<typeof StudentProfileSchema>;
export declare const RequirementKindSchema: z.ZodEnum<["year", "cgpa", "skills", "document", "link", "availability", "projectCount", "projectTag", "deadline", "custom"]>;
export type RequirementKind = z.infer<typeof RequirementKindSchema>;
export declare const ParsedRuleDetailSchema: z.ZodObject<{
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
}>;
export type ParsedRuleDetail = z.infer<typeof ParsedRuleDetailSchema>;
export declare const RequirementSchema: z.ZodObject<{
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
}>;
export type Requirement = z.infer<typeof RequirementSchema>;
export declare const ChecklistSchema: z.ZodObject<{
    opportunityType: z.ZodDefault<z.ZodString>;
    title: z.ZodString;
    requirements: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    sources: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    warnings: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    opportunityType: string;
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
    sources: string[];
    warnings?: string[] | undefined;
}, {
    title: string;
    requirements: {
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
    }[];
    opportunityType?: string | undefined;
    sources?: string[] | undefined;
    warnings?: string[] | undefined;
}>;
export type Checklist = z.infer<typeof ChecklistSchema>;
export declare const FindingSchema: z.ZodObject<{
    requirementId: z.ZodString;
    status: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
    reason: z.ZodString;
    ruleUsed: z.ZodDefault<z.ZodString>;
    nextStep: z.ZodDefault<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["education", "academic", "skills", "documents", "links", "availability", "experience", "general"]>>;
    expected: z.ZodOptional<z.ZodString>;
    studentValue: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "Match" | "Mismatch" | "Missing info";
    requirementId: string;
    reason: string;
    ruleUsed: string;
    nextStep: string;
    expected?: string | undefined;
    title?: string | undefined;
    category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
    studentValue?: string | undefined;
}, {
    status: "Match" | "Mismatch" | "Missing info";
    requirementId: string;
    reason: string;
    expected?: string | undefined;
    title?: string | undefined;
    category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
    ruleUsed?: string | undefined;
    nextStep?: string | undefined;
    studentValue?: string | undefined;
}>;
export type Finding = z.infer<typeof FindingSchema>;
export type EvaluationItem = Finding;
export declare const ResultCountsSchema: z.ZodObject<{
    matches: z.ZodDefault<z.ZodNumber>;
    mismatches: z.ZodDefault<z.ZodNumber>;
    missingInfo: z.ZodDefault<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    matches: number;
    mismatches: number;
    missingInfo: number;
    total?: number | undefined;
}, {
    matches?: number | undefined;
    mismatches?: number | undefined;
    missingInfo?: number | undefined;
    total?: number | undefined;
}>;
export type ResultCounts = z.infer<typeof ResultCountsSchema>;
export declare const ResultSchema: z.ZodObject<{
    findings: z.ZodArray<z.ZodObject<{
        requirementId: z.ZodString;
        status: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
        reason: z.ZodString;
        ruleUsed: z.ZodDefault<z.ZodString>;
        nextStep: z.ZodDefault<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodEnum<["education", "academic", "skills", "documents", "links", "availability", "experience", "general"]>>;
        expected: z.ZodOptional<z.ZodString>;
        studentValue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        ruleUsed: string;
        nextStep: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        studentValue?: string | undefined;
    }, {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        ruleUsed?: string | undefined;
        nextStep?: string | undefined;
        studentValue?: string | undefined;
    }>, "many">;
    counts: z.ZodObject<{
        matches: z.ZodDefault<z.ZodNumber>;
        mismatches: z.ZodDefault<z.ZodNumber>;
        missingInfo: z.ZodDefault<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total?: number | undefined;
    }, {
        matches?: number | undefined;
        mismatches?: number | undefined;
        missingInfo?: number | undefined;
        total?: number | undefined;
    }>;
    readiness: z.ZodUnion<[z.ZodEnum<["Ready to apply", "Almost ready", "Not ready yet"]>, z.ZodString]>;
    nextSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    summary: z.ZodOptional<z.ZodAny>;
    checklist: z.ZodOptional<z.ZodArray<z.ZodObject<{
        requirementId: z.ZodString;
        status: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
        reason: z.ZodString;
        ruleUsed: z.ZodDefault<z.ZodString>;
        nextStep: z.ZodDefault<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodEnum<["education", "academic", "skills", "documents", "links", "availability", "experience", "general"]>>;
        expected: z.ZodOptional<z.ZodString>;
        studentValue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        ruleUsed: string;
        nextStep: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        studentValue?: string | undefined;
    }, {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        ruleUsed?: string | undefined;
        nextStep?: string | undefined;
        studentValue?: string | undefined;
    }>, "many">>;
    opportunityId: z.ZodOptional<z.ZodString>;
    opportunityTitle: z.ZodOptional<z.ZodString>;
    rawOpportunityText: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    agentEvidence: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    findings: {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        ruleUsed: string;
        nextStep: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        studentValue?: string | undefined;
    }[];
    counts: {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total?: number | undefined;
    };
    readiness: string;
    nextSteps: string[];
    summary?: any;
    checklist?: {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        ruleUsed: string;
        nextStep: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        studentValue?: string | undefined;
    }[] | undefined;
    opportunityId?: string | undefined;
    opportunityTitle?: string | undefined;
    rawOpportunityText?: string | undefined;
    timestamp?: string | undefined;
    agentEvidence?: any[] | undefined;
}, {
    findings: {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        ruleUsed?: string | undefined;
        nextStep?: string | undefined;
        studentValue?: string | undefined;
    }[];
    counts: {
        matches?: number | undefined;
        mismatches?: number | undefined;
        missingInfo?: number | undefined;
        total?: number | undefined;
    };
    readiness: string;
    nextSteps?: string[] | undefined;
    summary?: any;
    checklist?: {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        ruleUsed?: string | undefined;
        nextStep?: string | undefined;
        studentValue?: string | undefined;
    }[] | undefined;
    opportunityId?: string | undefined;
    opportunityTitle?: string | undefined;
    rawOpportunityText?: string | undefined;
    timestamp?: string | undefined;
    agentEvidence?: any[] | undefined;
}>;
export type Result = z.infer<typeof ResultSchema>;
export declare const EvaluationSummarySchema: z.ZodObject<{
    totalRequirements: z.ZodNumber;
    matches: z.ZodNumber;
    mismatches: z.ZodNumber;
    missingInfo: z.ZodNumber;
    overallVerdict: z.ZodUnion<[z.ZodEnum<["Ready to apply", "Not ready to apply yet"]>, z.ZodString]>;
    headline: z.ZodString;
    actionPlan: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    matches: number;
    mismatches: number;
    missingInfo: number;
    totalRequirements: number;
    overallVerdict: string;
    headline: string;
    actionPlan: string[];
}, {
    matches: number;
    mismatches: number;
    missingInfo: number;
    totalRequirements: number;
    overallVerdict: string;
    headline: string;
    actionPlan: string[];
}>;
export type EvaluationSummary = z.infer<typeof EvaluationSummarySchema>;
export declare const AgentEvidenceSchema: z.ZodObject<{
    id: z.ZodString;
    agentId: z.ZodString;
    agentRole: z.ZodString;
    source: z.ZodString;
    finding: z.ZodString;
    confidence: z.ZodNumber;
    studentConfirmed: z.ZodDefault<z.ZodBoolean>;
    extractedField: z.ZodOptional<z.ZodString>;
    extractedValue: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    source: string;
    id: string;
    agentId: string;
    agentRole: string;
    finding: string;
    confidence: number;
    studentConfirmed: boolean;
    extractedField?: string | undefined;
    extractedValue?: any;
}, {
    source: string;
    id: string;
    agentId: string;
    agentRole: string;
    finding: string;
    confidence: number;
    studentConfirmed?: boolean | undefined;
    extractedField?: string | undefined;
    extractedValue?: any;
}>;
export type AgentEvidence = z.infer<typeof AgentEvidenceSchema>;
export declare const EvaluationResultSchema: z.ZodObject<{
    opportunityId: z.ZodOptional<z.ZodString>;
    opportunityTitle: z.ZodString;
    rawOpportunityText: z.ZodString;
    timestamp: z.ZodString;
    summary: z.ZodObject<{
        totalRequirements: z.ZodNumber;
        matches: z.ZodNumber;
        mismatches: z.ZodNumber;
        missingInfo: z.ZodNumber;
        overallVerdict: z.ZodUnion<[z.ZodEnum<["Ready to apply", "Not ready to apply yet"]>, z.ZodString]>;
        headline: z.ZodString;
        actionPlan: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        matches: number;
        mismatches: number;
        missingInfo: number;
        totalRequirements: number;
        overallVerdict: string;
        headline: string;
        actionPlan: string[];
    }, {
        matches: number;
        mismatches: number;
        missingInfo: number;
        totalRequirements: number;
        overallVerdict: string;
        headline: string;
        actionPlan: string[];
    }>;
    checklist: z.ZodArray<z.ZodObject<{
        requirementId: z.ZodString;
        status: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
        reason: z.ZodString;
        ruleUsed: z.ZodDefault<z.ZodString>;
        nextStep: z.ZodDefault<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodEnum<["education", "academic", "skills", "documents", "links", "availability", "experience", "general"]>>;
        expected: z.ZodOptional<z.ZodString>;
        studentValue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        ruleUsed: string;
        nextStep: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        studentValue?: string | undefined;
    }, {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        ruleUsed?: string | undefined;
        nextStep?: string | undefined;
        studentValue?: string | undefined;
    }>, "many">;
    agentEvidence: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        agentId: z.ZodString;
        agentRole: z.ZodString;
        source: z.ZodString;
        finding: z.ZodString;
        confidence: z.ZodNumber;
        studentConfirmed: z.ZodDefault<z.ZodBoolean>;
        extractedField: z.ZodOptional<z.ZodString>;
        extractedValue: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        source: string;
        id: string;
        agentId: string;
        agentRole: string;
        finding: string;
        confidence: number;
        studentConfirmed: boolean;
        extractedField?: string | undefined;
        extractedValue?: any;
    }, {
        source: string;
        id: string;
        agentId: string;
        agentRole: string;
        finding: string;
        confidence: number;
        studentConfirmed?: boolean | undefined;
        extractedField?: string | undefined;
        extractedValue?: any;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    summary: {
        matches: number;
        mismatches: number;
        missingInfo: number;
        totalRequirements: number;
        overallVerdict: string;
        headline: string;
        actionPlan: string[];
    };
    checklist: {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        ruleUsed: string;
        nextStep: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        studentValue?: string | undefined;
    }[];
    opportunityTitle: string;
    rawOpportunityText: string;
    timestamp: string;
    agentEvidence: {
        source: string;
        id: string;
        agentId: string;
        agentRole: string;
        finding: string;
        confidence: number;
        studentConfirmed: boolean;
        extractedField?: string | undefined;
        extractedValue?: any;
    }[];
    opportunityId?: string | undefined;
}, {
    summary: {
        matches: number;
        mismatches: number;
        missingInfo: number;
        totalRequirements: number;
        overallVerdict: string;
        headline: string;
        actionPlan: string[];
    };
    checklist: {
        status: "Match" | "Mismatch" | "Missing info";
        requirementId: string;
        reason: string;
        expected?: string | undefined;
        title?: string | undefined;
        category?: "education" | "academic" | "skills" | "documents" | "links" | "availability" | "experience" | "general" | undefined;
        ruleUsed?: string | undefined;
        nextStep?: string | undefined;
        studentValue?: string | undefined;
    }[];
    opportunityTitle: string;
    rawOpportunityText: string;
    timestamp: string;
    opportunityId?: string | undefined;
    agentEvidence?: {
        source: string;
        id: string;
        agentId: string;
        agentRole: string;
        finding: string;
        confidence: number;
        studentConfirmed?: boolean | undefined;
        extractedField?: string | undefined;
        extractedValue?: any;
    }[] | undefined;
}>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
export type SourceTrust = 'Verified' | 'Needs review' | 'Unverified';
export declare const AgentSourceSchema: z.ZodObject<{
    title: z.ZodString;
    url: z.ZodString;
    trust: z.ZodEnum<["Verified", "Needs review", "Unverified"]>;
    reasons: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    url: string;
    trust: "Verified" | "Needs review" | "Unverified";
    title: string;
    reasons?: string[] | undefined;
}, {
    url: string;
    trust: "Verified" | "Needs review" | "Unverified";
    title: string;
    reasons?: string[] | undefined;
}>;
export type AgentSource = z.infer<typeof AgentSourceSchema>;
export type AgentStatus = 'queued' | 'running' | 'done' | 'failed';
export declare const AgentResultSchema: z.ZodObject<{
    agent: z.ZodString;
    status: z.ZodEnum<["done", "failed"]>;
    data: z.ZodNullable<z.ZodAny>;
    sources: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodString;
        trust: z.ZodEnum<["Verified", "Needs review", "Unverified"]>;
        reasons: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }, {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }>, "many">;
    notes: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    providerUsed: z.ZodString;
    timeTakenMs: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodObject<{
        evidenceId: z.ZodString;
        subjectType: z.ZodEnum<["profile", "opportunity"]>;
        subjectId: z.ZodString;
        kind: z.ZodString;
        key: z.ZodString;
        value: z.ZodUnknown;
        origin: z.ZodEnum<["student_confirmed", "user_provided", "ai_generated", "system_import"]>;
        trust: z.ZodEnum<["verified", "needs_review", "unverified"]>;
        source: z.ZodObject<{
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            agent: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodString>;
            sentence: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        }, {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        }>;
        createdAt: z.ZodString;
        observedAt: z.ZodString;
        validUntil: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["active", "superseded", "rejected", "conflicted"]>;
        version: z.ZodNumber;
        previousVersion: z.ZodOptional<z.ZodNumber>;
        linkedRef: z.ZodOptional<z.ZodString>;
        deviceId: z.ZodString;
        serverSeq: z.ZodOptional<z.ZodNumber>;
        opId: z.ZodString;
        syncState: z.ZodEnum<["local_only", "pending", "synced", "conflict"]>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    }, {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "done" | "failed";
    agent: string;
    sources: {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }[];
    confidence: "high" | "medium" | "low";
    notes: string[];
    providerUsed: string;
    data?: any;
    timeTakenMs?: number | undefined;
    error?: string | undefined;
    evidence?: {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    }[] | undefined;
}, {
    status: "done" | "failed";
    agent: string;
    sources: {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }[];
    confidence: "high" | "medium" | "low";
    notes: string[];
    providerUsed: string;
    data?: any;
    timeTakenMs?: number | undefined;
    error?: string | undefined;
    evidence?: {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    }[] | undefined;
}>;
export type AgentResult<T = any> = {
    agent: string;
    status: 'done' | 'failed';
    data: T | null;
    sources: AgentSource[];
    notes: string[];
    confidence: 'high' | 'medium' | 'low';
    providerUsed: string;
    timeTakenMs?: number;
    error?: string;
    evidence?: EvidenceRecord[];
};
export declare const AgentProgressEventSchema: z.ZodObject<{
    agent: z.ZodString;
    status: z.ZodEnum<["queued", "running", "done", "failed"]>;
    progress: z.ZodOptional<z.ZodNumber>;
    timeTakenMs: z.ZodOptional<z.ZodNumber>;
    providerUsed: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "queued" | "running" | "done" | "failed";
    agent: string;
    message?: string | undefined;
    providerUsed?: string | undefined;
    timeTakenMs?: number | undefined;
    progress?: number | undefined;
}, {
    status: "queued" | "running" | "done" | "failed";
    agent: string;
    message?: string | undefined;
    providerUsed?: string | undefined;
    timeTakenMs?: number | undefined;
    progress?: number | undefined;
}>;
export type AgentProgressEvent = z.infer<typeof AgentProgressEventSchema>;
export declare const AgentSuggestionSchema: z.ZodObject<{
    id: z.ZodString;
    evidenceId: z.ZodOptional<z.ZodString>;
    agent: z.ZodString;
    type: z.ZodEnum<["skill", "project", "link", "document", "info"]>;
    title: z.ZodString;
    description: z.ZodString;
    value: z.ZodAny;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    sources: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodString;
        trust: z.ZodEnum<["Verified", "Needs review", "Unverified"]>;
        reasons: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }, {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }>, "many">;
    status: z.ZodEnum<["pending", "accepted", "rejected"]>;
    evidenceRecord: z.ZodOptional<z.ZodObject<{
        evidenceId: z.ZodString;
        subjectType: z.ZodEnum<["profile", "opportunity"]>;
        subjectId: z.ZodString;
        kind: z.ZodString;
        key: z.ZodString;
        value: z.ZodUnknown;
        origin: z.ZodEnum<["student_confirmed", "user_provided", "ai_generated", "system_import"]>;
        trust: z.ZodEnum<["verified", "needs_review", "unverified"]>;
        source: z.ZodObject<{
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            agent: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodString>;
            sentence: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        }, {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        }>;
        createdAt: z.ZodString;
        observedAt: z.ZodString;
        validUntil: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["active", "superseded", "rejected", "conflicted"]>;
        version: z.ZodNumber;
        previousVersion: z.ZodOptional<z.ZodNumber>;
        linkedRef: z.ZodOptional<z.ZodString>;
        deviceId: z.ZodString;
        serverSeq: z.ZodOptional<z.ZodNumber>;
        opId: z.ZodString;
        syncState: z.ZodEnum<["local_only", "pending", "synced", "conflict"]>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    }, {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "link" | "document" | "skill" | "project" | "info";
    status: "rejected" | "pending" | "accepted";
    agent: string;
    id: string;
    title: string;
    description: string;
    sources: {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }[];
    confidence: "high" | "medium" | "low";
    value?: any;
    evidenceId?: string | undefined;
    evidenceRecord?: {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    } | undefined;
}, {
    type: "link" | "document" | "skill" | "project" | "info";
    status: "rejected" | "pending" | "accepted";
    agent: string;
    id: string;
    title: string;
    description: string;
    sources: {
        url: string;
        trust: "Verified" | "Needs review" | "Unverified";
        title: string;
        reasons?: string[] | undefined;
    }[];
    confidence: "high" | "medium" | "low";
    value?: any;
    evidenceId?: string | undefined;
    evidenceRecord?: {
        status: "active" | "superseded" | "rejected" | "conflicted";
        evidenceId: string;
        subjectType: "profile" | "opportunity";
        subjectId: string;
        kind: string;
        key: string;
        origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
        trust: "verified" | "needs_review" | "unverified";
        source: {
            type: string;
            url?: string | undefined;
            agent?: string | undefined;
            provider?: string | undefined;
            sentence?: string | undefined;
        };
        createdAt: string;
        observedAt: string;
        version: number;
        deviceId: string;
        opId: string;
        syncState: "local_only" | "pending" | "synced" | "conflict";
        value?: unknown;
        validUntil?: string | undefined;
        previousVersion?: number | undefined;
        linkedRef?: string | undefined;
        serverSeq?: number | undefined;
    } | undefined;
}>;
export type AgentSuggestion = z.infer<typeof AgentSuggestionSchema>;
export interface OrchestratorRunInput {
    opportunityText: string;
    profile?: StudentProfile;
    agentFilter?: string[];
    /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
    language?: string;
    existingEvidence?: EvidenceRecord[];
}
export interface OrchestratorRunOutput {
    orchestrationId: string;
    timestamp: string;
    results: Record<string, AgentResult>;
    events: AgentProgressEvent[];
    suggestions: AgentSuggestion[];
    evidence?: EvidenceRecord[];
    totalTimeMs: number;
}
//# sourceMappingURL=index.d.ts.map