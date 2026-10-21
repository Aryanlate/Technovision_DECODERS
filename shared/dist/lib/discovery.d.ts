import { z } from 'zod';
import { SourceTrust, StudentProfile } from './types/index.js';
export declare const DiscoveryListingCardSchema: z.ZodObject<{
    title: z.ZodString;
    organisation: z.ZodString;
    sourceUrl: z.ZodString;
    opportunityType: z.ZodString;
    fitReason: z.ZodString;
    rawText: z.ZodDefault<z.ZodString>;
    trust: z.ZodEnum<["Verified", "Needs review", "Unverified"]>;
    trustReasons: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    counts: z.ZodObject<{
        matches: z.ZodNumber;
        mismatches: z.ZodNumber;
        missingInfo: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total: number;
    }, {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total: number;
    }>;
    readiness: z.ZodEnum<["Ready to apply", "Almost ready", "Not ready yet"]>;
    singleFix: z.ZodDefault<z.ZodString>;
    nextSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
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
        id: string;
        kind: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom";
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
        title?: string | undefined;
        kind?: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom" | undefined;
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
    findings: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    aiSuggestedCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    opportunityType: string;
    requirements: {
        id: string;
        kind: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom";
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
        total: number;
    };
    readiness: "Ready to apply" | "Almost ready" | "Not ready yet";
    nextSteps: string[];
    trust: "Verified" | "Needs review" | "Unverified";
    organisation: string;
    sourceUrl: string;
    fitReason: string;
    rawText: string;
    trustReasons: string[];
    singleFix: string;
    aiSuggestedCount: number;
}, {
    title: string;
    opportunityType: string;
    counts: {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total: number;
    };
    readiness: "Ready to apply" | "Almost ready" | "Not ready yet";
    trust: "Verified" | "Needs review" | "Unverified";
    organisation: string;
    sourceUrl: string;
    fitReason: string;
    requirements?: {
        id: string;
        label: string;
        value?: any;
        title?: string | undefined;
        kind?: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom" | undefined;
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
    findings?: {
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
    nextSteps?: string[] | undefined;
    rawText?: string | undefined;
    trustReasons?: string[] | undefined;
    singleFix?: string | undefined;
    aiSuggestedCount?: number | undefined;
}>;
export type DiscoveryListingCard = z.infer<typeof DiscoveryListingCardSchema>;
export declare const DiscoverySkillGapSchema: z.ZodObject<{
    skill: z.ZodString;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    skill: string;
    count: number;
}, {
    skill: string;
    count: number;
}>;
export type DiscoverySkillGap = z.infer<typeof DiscoverySkillGapSchema>;
export declare const DiscoveryResultSchema: z.ZodObject<{
    listings: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        organisation: z.ZodString;
        sourceUrl: z.ZodString;
        opportunityType: z.ZodString;
        fitReason: z.ZodString;
        rawText: z.ZodDefault<z.ZodString>;
        trust: z.ZodEnum<["Verified", "Needs review", "Unverified"]>;
        trustReasons: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        counts: z.ZodObject<{
            matches: z.ZodNumber;
            mismatches: z.ZodNumber;
            missingInfo: z.ZodNumber;
            total: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            matches: number;
            mismatches: number;
            missingInfo: number;
            total: number;
        }, {
            matches: number;
            mismatches: number;
            missingInfo: number;
            total: number;
        }>;
        readiness: z.ZodEnum<["Ready to apply", "Almost ready", "Not ready yet"]>;
        singleFix: z.ZodDefault<z.ZodString>;
        nextSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
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
            id: string;
            kind: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom";
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
            title?: string | undefined;
            kind?: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom" | undefined;
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
        findings: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        aiSuggestedCount: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        opportunityType: string;
        requirements: {
            id: string;
            kind: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom";
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
            total: number;
        };
        readiness: "Ready to apply" | "Almost ready" | "Not ready yet";
        nextSteps: string[];
        trust: "Verified" | "Needs review" | "Unverified";
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        rawText: string;
        trustReasons: string[];
        singleFix: string;
        aiSuggestedCount: number;
    }, {
        title: string;
        opportunityType: string;
        counts: {
            matches: number;
            mismatches: number;
            missingInfo: number;
            total: number;
        };
        readiness: "Ready to apply" | "Almost ready" | "Not ready yet";
        trust: "Verified" | "Needs review" | "Unverified";
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        requirements?: {
            id: string;
            label: string;
            value?: any;
            title?: string | undefined;
            kind?: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom" | undefined;
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
        findings?: {
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
        nextSteps?: string[] | undefined;
        rawText?: string | undefined;
        trustReasons?: string[] | undefined;
        singleFix?: string | undefined;
        aiSuggestedCount?: number | undefined;
    }>, "many">;
    skillGaps: z.ZodArray<z.ZodObject<{
        skill: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        skill: string;
        count: number;
    }, {
        skill: string;
        count: number;
    }>, "many">;
    notes: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
}, "strip", z.ZodTypeAny, {
    confidence: "high" | "medium" | "low";
    notes: string[];
    listings: {
        title: string;
        opportunityType: string;
        requirements: {
            id: string;
            kind: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom";
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
            total: number;
        };
        readiness: "Ready to apply" | "Almost ready" | "Not ready yet";
        nextSteps: string[];
        trust: "Verified" | "Needs review" | "Unverified";
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        rawText: string;
        trustReasons: string[];
        singleFix: string;
        aiSuggestedCount: number;
    }[];
    skillGaps: {
        skill: string;
        count: number;
    }[];
}, {
    confidence: "high" | "medium" | "low";
    notes: string[];
    listings: {
        title: string;
        opportunityType: string;
        counts: {
            matches: number;
            mismatches: number;
            missingInfo: number;
            total: number;
        };
        readiness: "Ready to apply" | "Almost ready" | "Not ready yet";
        trust: "Verified" | "Needs review" | "Unverified";
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        requirements?: {
            id: string;
            label: string;
            value?: any;
            title?: string | undefined;
            kind?: "skills" | "availability" | "link" | "year" | "cgpa" | "document" | "projectCount" | "projectTag" | "deadline" | "custom" | undefined;
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
        findings?: {
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
        nextSteps?: string[] | undefined;
        rawText?: string | undefined;
        trustReasons?: string[] | undefined;
        singleFix?: string | undefined;
        aiSuggestedCount?: number | undefined;
    }[];
    skillGaps: {
        skill: string;
        count: number;
    }[];
}>;
export type DiscoveryResult = z.infer<typeof DiscoveryResultSchema>;
/** What a search-capable provider returns for each listing (LLM output shape). */
export declare const DiscoveryListingSchema: z.ZodObject<{
    title: z.ZodString;
    organisation: z.ZodString;
    sourceUrl: z.ZodString;
    fitReason: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    organisation: string;
    sourceUrl: string;
    fitReason: string;
    description?: string | undefined;
}, {
    title: string;
    organisation: string;
    sourceUrl: string;
    fitReason: string;
    description?: string | undefined;
}>;
export type DiscoveryListing = z.infer<typeof DiscoveryListingSchema>;
export declare const DiscoveryListingsOutputSchema: z.ZodObject<{
    listings: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        organisation: z.ZodString;
        sourceUrl: z.ZodString;
        fitReason: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        description?: string | undefined;
    }, {
        title: string;
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        description?: string | undefined;
    }>, "many">;
    notes: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
}, "strip", z.ZodTypeAny, {
    confidence: "high" | "medium" | "low";
    notes: string[];
    listings: {
        title: string;
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        description?: string | undefined;
    }[];
}, {
    confidence: "high" | "medium" | "low";
    notes: string[];
    listings: {
        title: string;
        organisation: string;
        sourceUrl: string;
        fitReason: string;
        description?: string | undefined;
    }[];
}>;
export type DiscoveryListingsOutput = z.infer<typeof DiscoveryListingsOutputSchema>;
export interface CuratedDiscoveryOpportunity {
    title: string;
    organisation: string;
    sourceUrl: string;
    opportunityType: 'internship' | 'scholarship' | 'competition';
    category: string;
    fitReason: string;
    /** Listing text, read by the OpportunityReader (parser-first). */
    text: string;
}
export declare const CURATED_DISCOVERY_OPPORTUNITIES: CuratedDiscoveryOpportunity[];
export declare function trustForSourceUrl(url: string): SourceTrust;
/** Closeness to ready: fewest Mismatch, then fewest Missing info. */
export declare function rankDiscoveryCards(cards: DiscoveryListingCard[]): DiscoveryListingCard[];
/** Skills missing most often across all checked opportunities (top 6). */
export declare function skillGapSummary(cards: DiscoveryListingCard[], profile: StudentProfile): DiscoverySkillGap[];
export declare function buildLocalDiscoveryCards(profile: StudentProfile): DiscoveryResult;
//# sourceMappingURL=discovery.d.ts.map