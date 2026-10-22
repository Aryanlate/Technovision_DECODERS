"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSuggestionSchema = exports.AgentProgressEventSchema = exports.AgentResultSchema = exports.AgentSourceSchema = exports.EvaluationResultSchema = exports.AgentEvidenceSchema = exports.EvaluationSummarySchema = exports.ResultSchema = exports.ResultCountsSchema = exports.FindingSchema = exports.ChecklistSchema = exports.RequirementSchema = exports.ParsedRuleDetailSchema = exports.RequirementKindSchema = exports.StudentProfileSchema = exports.PlanTypeSchema = exports.StudentLinksSchema = exports.DocumentItemSchema = exports.DocumentTypeSchema = exports.ProjectSchema = exports.RequirementCategorySchema = exports.RequirementStatusSchema = void 0;
const zod_1 = require("zod");
const types_js_1 = require("../../evidence/types.js");
// ============================================================================
// 1. Requirement Status & Categories
// ============================================================================
exports.RequirementStatusSchema = zod_1.z.enum(['Match', 'Mismatch', 'Missing info']);
exports.RequirementCategorySchema = zod_1.z.enum([
    'education',
    'academic',
    'skills',
    'documents',
    'links',
    'availability',
    'experience',
    'general'
]);
// ============================================================================
// 2. Project
// id, title, domains[], tech[], role, status, proofLink
// ============================================================================
exports.ProjectSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    domains: zod_1.z.array(zod_1.z.string()).default([]),
    tech: zod_1.z.array(zod_1.z.string()).default([]),
    role: zod_1.z.string().default('Contributor'),
    status: zod_1.z.string().default('completed'), // completed, in-progress, planned
    proofLink: zod_1.z.string().default(''),
    // Backward compatibility fields
    description: zod_1.z.string().optional(),
    link: zod_1.z.string().optional(),
    techStack: zod_1.z.array(zod_1.z.string()).optional()
});
// ============================================================================
// 3. Document Item & Links
// documents[] such as resume, marksheet, incomeCertificate
// ============================================================================
exports.DocumentTypeSchema = zod_1.z.enum([
    'resume',
    'marksheet',
    'incomeCertificate',
    'idProof',
    'recommendationLetter',
    'other'
]);
exports.DocumentItemSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string(),
    type: zod_1.z.string(), // resume, marksheet, incomeCertificate, etc.
    url: zod_1.z.string().optional(),
    verified: zod_1.z.boolean().default(false),
    issuedDate: zod_1.z.string().optional()
});
exports.StudentLinksSchema = zod_1.z.object({
    github: zod_1.z.string().default(''),
    linkedin: zod_1.z.string().default(''),
    instagram: zod_1.z.string().default(''),
    portfolio: zod_1.z.string().default('')
});
exports.PlanTypeSchema = zod_1.z.enum(['free', 'premium', 'college']);
// ============================================================================
// 4. StudentProfile
// year, branch, cgpa, skills[], documents[], availabilityWeeks, links, projects[]
// ============================================================================
exports.StudentProfileSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().default('Student'),
    year: zod_1.z.number().nullable().optional(),
    branch: zod_1.z.string().optional().default('Engineering'),
    cgpa: zod_1.z.number().nullable().optional(),
    skills: zod_1.z.array(zod_1.z.string()).default([]),
    documents: zod_1.z.array(exports.DocumentItemSchema).optional().default([]),
    availabilityWeeks: zod_1.z.number().nullable().optional(),
    links: exports.StudentLinksSchema.optional().default({
        github: '',
        linkedin: '',
        instagram: '',
        portfolio: ''
    }),
    projects: zod_1.z.array(exports.ProjectSchema).default([]),
    plan: exports.PlanTypeSchema.optional(),
    monthlyChecksUsed: zod_1.z.number().optional(),
    monthlyChecksLimit: zod_1.z.number().optional(),
    // Backward-compatibility aliases for existing parser & engine
    yearOfStudy: zod_1.z.number().optional(),
    degree: zod_1.z.string().optional(),
    hasResume: zod_1.z.boolean().nullable().optional(),
    resumeUrl: zod_1.z.string().optional(),
    githubUrl: zod_1.z.string().optional(),
    portfolioUrl: zod_1.z.string().optional(),
    linkedInText: zod_1.z.string().optional()
});
// ============================================================================
// 5. Requirement
// id, kind (year | cgpa | skills | document | link | availability | projectCount | projectTag | deadline | custom), label, value, required
// ============================================================================
exports.RequirementKindSchema = zod_1.z.enum([
    'year',
    'cgpa',
    'skills',
    'document',
    'link',
    'availability',
    'projectCount',
    'projectTag',
    'deadline',
    'custom'
]);
exports.ParsedRuleDetailSchema = zod_1.z.object({
    allowedYears: zod_1.z.array(zod_1.z.number()).optional(),
    degreeKeywords: zod_1.z.array(zod_1.z.string()).optional(),
    minCgpa: zod_1.z.number().optional(),
    maxCgpa: zod_1.z.number().optional(),
    requiredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    preferredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    resumeRequired: zod_1.z.boolean().optional(),
    githubOrPortfolioRequired: zod_1.z.boolean().optional(),
    githubRequired: zod_1.z.boolean().optional(),
    portfolioRequired: zod_1.z.boolean().optional(),
    minAvailabilityWeeks: zod_1.z.number().optional()
});
exports.RequirementSchema = zod_1.z.object({
    id: zod_1.z.string(),
    kind: exports.RequirementKindSchema.default('custom'),
    label: zod_1.z.string(),
    value: zod_1.z.any().optional(),
    required: zod_1.z.boolean().default(true),
    // Source traceability
    sourceSentence: zod_1.z.string().optional(),
    // Backward compatibility properties for deterministic rule engine
    title: zod_1.z.string().optional(),
    category: exports.RequirementCategorySchema.optional(),
    rule: zod_1.z.string().optional(),
    parsedRule: exports.ParsedRuleDetailSchema.optional(),
    importance: zod_1.z.enum(['mandatory', 'preferred']).optional()
});
// ============================================================================
// 6. Checklist
// opportunityType, title, requirements[], sources[]
// ============================================================================
exports.ChecklistSchema = zod_1.z.object({
    opportunityType: zod_1.z.string().default('internship'), // internship | scholarship | competition | custom
    title: zod_1.z.string(),
    requirements: zod_1.z.array(exports.RequirementSchema),
    sources: zod_1.z.array(zod_1.z.string()).default([]),
    warnings: zod_1.z.array(zod_1.z.string()).optional()
});
// ============================================================================
// 7. Finding
// requirementId, status, reason, ruleUsed, nextStep
// ============================================================================
exports.FindingSchema = zod_1.z.object({
    requirementId: zod_1.z.string(),
    status: exports.RequirementStatusSchema,
    reason: zod_1.z.string(),
    ruleUsed: zod_1.z.string().default('DeterministicRule'),
    nextStep: zod_1.z.string().default(''),
    // Backward compatibility properties matching EvaluationItem
    title: zod_1.z.string().optional(),
    category: exports.RequirementCategorySchema.optional(),
    expected: zod_1.z.string().optional(),
    studentValue: zod_1.z.string().optional()
});
// ============================================================================
// 8. Result
// findings[], counts, readiness, nextSteps[]
// ============================================================================
exports.ResultCountsSchema = zod_1.z.object({
    matches: zod_1.z.number().default(0),
    mismatches: zod_1.z.number().default(0),
    missingInfo: zod_1.z.number().default(0),
    total: zod_1.z.number().optional()
});
exports.ResultSchema = zod_1.z.object({
    findings: zod_1.z.array(exports.FindingSchema),
    counts: exports.ResultCountsSchema,
    readiness: zod_1.z.enum(['Ready to apply', 'Almost ready', 'Not ready yet']).or(zod_1.z.string()),
    nextSteps: zod_1.z.array(zod_1.z.string()).default([]),
    // Backward compatibility properties matching EvaluationResult
    summary: zod_1.z.any().optional(),
    checklist: zod_1.z.array(exports.FindingSchema).optional(),
    opportunityId: zod_1.z.string().optional(),
    opportunityTitle: zod_1.z.string().optional(),
    rawOpportunityText: zod_1.z.string().optional(),
    timestamp: zod_1.z.string().optional(),
    agentEvidence: zod_1.z.array(zod_1.z.any()).optional()
});
exports.EvaluationSummarySchema = zod_1.z.object({
    totalRequirements: zod_1.z.number(),
    matches: zod_1.z.number(),
    mismatches: zod_1.z.number(),
    missingInfo: zod_1.z.number(),
    overallVerdict: zod_1.z.enum(['Ready to apply', 'Not ready to apply yet']).or(zod_1.z.string()),
    headline: zod_1.z.string(),
    actionPlan: zod_1.z.array(zod_1.z.string())
});
exports.AgentEvidenceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    agentId: zod_1.z.string(),
    agentRole: zod_1.z.string(),
    source: zod_1.z.string(),
    finding: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
    studentConfirmed: zod_1.z.boolean().default(false),
    extractedField: zod_1.z.string().optional(),
    extractedValue: zod_1.z.any().optional()
});
exports.EvaluationResultSchema = zod_1.z.object({
    opportunityId: zod_1.z.string().optional(),
    opportunityTitle: zod_1.z.string(),
    rawOpportunityText: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    summary: exports.EvaluationSummarySchema,
    checklist: zod_1.z.array(exports.FindingSchema),
    agentEvidence: zod_1.z.array(exports.AgentEvidenceSchema).default([])
});
exports.AgentSourceSchema = zod_1.z.object({
    title: zod_1.z.string(),
    url: zod_1.z.string(),
    trust: zod_1.z.enum(['Verified', 'Needs review', 'Unverified']),
    // Transparent reasons behind the trust label (populated by the VerifierAgent).
    reasons: zod_1.z.array(zod_1.z.string()).optional()
});
exports.AgentResultSchema = zod_1.z.object({
    agent: zod_1.z.string(),
    status: zod_1.z.enum(['done', 'failed']),
    data: zod_1.z.any().nullable(),
    sources: zod_1.z.array(exports.AgentSourceSchema),
    notes: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.enum(['high', 'medium', 'low']),
    providerUsed: zod_1.z.string(),
    timeTakenMs: zod_1.z.number().optional(),
    error: zod_1.z.string().optional(),
    evidence: zod_1.z.array(types_js_1.EvidenceRecordSchema).optional()
});
exports.AgentProgressEventSchema = zod_1.z.object({
    agent: zod_1.z.string(),
    status: zod_1.z.enum(['queued', 'running', 'done', 'failed']),
    progress: zod_1.z.number().optional(),
    timeTakenMs: zod_1.z.number().optional(),
    providerUsed: zod_1.z.string().optional(),
    message: zod_1.z.string().optional()
});
exports.AgentSuggestionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    evidenceId: zod_1.z.string().optional(),
    agent: zod_1.z.string(),
    type: zod_1.z.enum(['skill', 'project', 'link', 'document', 'info']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    value: zod_1.z.any(),
    confidence: zod_1.z.enum(['high', 'medium', 'low']),
    sources: zod_1.z.array(exports.AgentSourceSchema),
    status: zod_1.z.enum(['pending', 'accepted', 'rejected']),
    evidenceRecord: types_js_1.EvidenceRecordSchema.optional()
});
//# sourceMappingURL=index.js.map