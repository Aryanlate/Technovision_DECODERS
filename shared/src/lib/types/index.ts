import { z } from 'zod';

// ============================================================================
// 1. Requirement Status & Categories
// ============================================================================
export const RequirementStatusSchema = z.enum(['Match', 'Mismatch', 'Missing info']);
export type RequirementStatus = z.infer<typeof RequirementStatusSchema>;

export const RequirementCategorySchema = z.enum([
  'education',
  'academic',
  'skills',
  'documents',
  'links',
  'availability',
  'experience',
  'general'
]);
export type RequirementCategory = z.infer<typeof RequirementCategorySchema>;

// ============================================================================
// 2. Project
// id, title, domains[], tech[], role, status, proofLink
// ============================================================================
export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  domains: z.array(z.string()).default([]),
  tech: z.array(z.string()).default([]),
  role: z.string().default('Contributor'),
  status: z.string().default('completed'), // completed, in-progress, planned
  proofLink: z.string().default(''),

  // Backward compatibility fields
  description: z.string().optional(),
  link: z.string().optional(),
  techStack: z.array(z.string()).optional()
});
export type Project = z.infer<typeof ProjectSchema>;

// ============================================================================
// 3. Document Item & Links
// documents[] such as resume, marksheet, incomeCertificate
// ============================================================================
export const DocumentTypeSchema = z.enum([
  'resume',
  'marksheet',
  'incomeCertificate',
  'idProof',
  'recommendationLetter',
  'other'
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string(), // resume, marksheet, incomeCertificate, etc.
  url: z.string().optional(),
  verified: z.boolean().default(false),
  issuedDate: z.string().optional()
});
export type DocumentItem = z.infer<typeof DocumentItemSchema>;
export type StudentDocument = DocumentItem;

export const StudentLinksSchema = z.object({
  github: z.string().default(''),
  linkedin: z.string().default(''),
  instagram: z.string().default(''),
  portfolio: z.string().default('')
});
export type StudentLinks = z.infer<typeof StudentLinksSchema>;

export const PlanTypeSchema = z.enum(['free', 'premium', 'college']);
export type PlanType = z.infer<typeof PlanTypeSchema>;

// ============================================================================
// 4. StudentProfile
// year, branch, cgpa, skills[], documents[], availabilityWeeks, links, projects[]
// ============================================================================
export const StudentProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().default('Student'),
  year: z.number().nullable().optional(),
  branch: z.string().optional().default('Engineering'),
  cgpa: z.number().nullable().optional(),
  skills: z.array(z.string()).default([]),
  documents: z.array(DocumentItemSchema).optional().default([]),
  availabilityWeeks: z.number().nullable().optional(),
  links: StudentLinksSchema.optional().default({
    github: '',
    linkedin: '',
    instagram: '',
    portfolio: ''
  }),
  projects: z.array(ProjectSchema).default([]),
  plan: PlanTypeSchema.optional(),
  monthlyChecksUsed: z.number().optional(),
  monthlyChecksLimit: z.number().optional(),

  // Backward-compatibility aliases for existing parser & engine
  yearOfStudy: z.number().optional(),
  degree: z.string().optional(),
  hasResume: z.boolean().nullable().optional(),
  resumeUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  linkedInText: z.string().optional()
});
export type StudentProfile = z.infer<typeof StudentProfileSchema>;

// ============================================================================
// 5. Requirement
// id, kind (year | cgpa | skills | document | link | availability | projectCount | projectTag | deadline | custom), label, value, required
// ============================================================================
export const RequirementKindSchema = z.enum([
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
export type RequirementKind = z.infer<typeof RequirementKindSchema>;

export const ParsedRuleDetailSchema = z.object({
  allowedYears: z.array(z.number()).optional(),
  degreeKeywords: z.array(z.string()).optional(),
  minCgpa: z.number().optional(),
  maxCgpa: z.number().optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  resumeRequired: z.boolean().optional(),
  githubOrPortfolioRequired: z.boolean().optional(),
  githubRequired: z.boolean().optional(),
  portfolioRequired: z.boolean().optional(),
  minAvailabilityWeeks: z.number().optional()
});
export type ParsedRuleDetail = z.infer<typeof ParsedRuleDetailSchema>;

export const RequirementSchema = z.object({
  id: z.string(),
  kind: RequirementKindSchema.default('custom'),
  label: z.string(),
  value: z.any().optional(),
  required: z.boolean().default(true),

  // Source traceability
  sourceSentence: z.string().optional(),

  // Backward compatibility properties for deterministic rule engine
  title: z.string().optional(),
  category: RequirementCategorySchema.optional(),
  rule: z.string().optional(),
  parsedRule: ParsedRuleDetailSchema.optional(),
  importance: z.enum(['mandatory', 'preferred']).optional()
});
export type Requirement = z.infer<typeof RequirementSchema>;

// ============================================================================
// 6. Checklist
// opportunityType, title, requirements[], sources[]
// ============================================================================
export const ChecklistSchema = z.object({
  opportunityType: z.string().default('internship'), // internship | scholarship | competition | custom
  title: z.string(),
  requirements: z.array(RequirementSchema),
  sources: z.array(z.string()).default([]),
  warnings: z.array(z.string()).optional()
});
export type Checklist = z.infer<typeof ChecklistSchema>;

// ============================================================================
// 7. Finding
// requirementId, status, reason, ruleUsed, nextStep
// ============================================================================
export const FindingSchema = z.object({
  requirementId: z.string(),
  status: RequirementStatusSchema,
  reason: z.string(),
  ruleUsed: z.string().default('DeterministicRule'),
  nextStep: z.string().default(''),

  // Backward compatibility properties matching EvaluationItem
  title: z.string().optional(),
  category: RequirementCategorySchema.optional(),
  expected: z.string().optional(),
  studentValue: z.string().optional()
});
export type Finding = z.infer<typeof FindingSchema>;
export type EvaluationItem = Finding;

// ============================================================================
// 8. Result
// findings[], counts, readiness, nextSteps[]
// ============================================================================
export const ResultCountsSchema = z.object({
  matches: z.number().default(0),
  mismatches: z.number().default(0),
  missingInfo: z.number().default(0),
  total: z.number().optional()
});
export type ResultCounts = z.infer<typeof ResultCountsSchema>;

export const ResultSchema = z.object({
  findings: z.array(FindingSchema),
  counts: ResultCountsSchema,
  readiness: z.enum(['Ready to apply', 'Almost ready', 'Not ready yet']).or(z.string()),
  nextSteps: z.array(z.string()).default([]),

  // Backward compatibility properties matching EvaluationResult
  summary: z.any().optional(),
  checklist: z.array(FindingSchema).optional(),
  opportunityId: z.string().optional(),
  opportunityTitle: z.string().optional(),
  rawOpportunityText: z.string().optional(),
  timestamp: z.string().optional(),
  agentEvidence: z.array(z.any()).optional()
});
export type Result = z.infer<typeof ResultSchema>;

export const EvaluationSummarySchema = z.object({
  totalRequirements: z.number(),
  matches: z.number(),
  mismatches: z.number(),
  missingInfo: z.number(),
  overallVerdict: z.enum(['Ready to apply', 'Not ready to apply yet']).or(z.string()),
  headline: z.string(),
  actionPlan: z.array(z.string())
});
export type EvaluationSummary = z.infer<typeof EvaluationSummarySchema>;

export const AgentEvidenceSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  agentRole: z.string(),
  source: z.string(),
  finding: z.string(),
  confidence: z.number().min(0).max(1),
  studentConfirmed: z.boolean().default(false),
  extractedField: z.string().optional(),
  extractedValue: z.any().optional()
});
export type AgentEvidence = z.infer<typeof AgentEvidenceSchema>;

export const EvaluationResultSchema = z.object({
  opportunityId: z.string().optional(),
  opportunityTitle: z.string(),
  rawOpportunityText: z.string(),
  timestamp: z.string(),
  summary: EvaluationSummarySchema,
  checklist: z.array(FindingSchema),
  agentEvidence: z.array(AgentEvidenceSchema).default([])
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// ============================================================================
// 8. Agent Framework & Orchestration Types
// ============================================================================
export type SourceTrust = 'Verified' | 'Needs review' | 'Unverified';

export const AgentSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  trust: z.enum(['Verified', 'Needs review', 'Unverified']),
  // Transparent reasons behind the trust label (populated by the VerifierAgent).
  reasons: z.array(z.string()).optional()
});
export type AgentSource = z.infer<typeof AgentSourceSchema>;

export type AgentStatus = 'queued' | 'running' | 'done' | 'failed';

export const AgentResultSchema = z.object({
  agent: z.string(),
  status: z.enum(['done', 'failed']),
  data: z.any().nullable(),
  sources: z.array(AgentSourceSchema),
  notes: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
  providerUsed: z.string(),
  timeTakenMs: z.number().optional(),
  error: z.string().optional()
});
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
};

export const AgentProgressEventSchema = z.object({
  agent: z.string(),
  status: z.enum(['queued', 'running', 'done', 'failed']),
  progress: z.number().optional(),
  timeTakenMs: z.number().optional(),
  providerUsed: z.string().optional(),
  message: z.string().optional()
});
export type AgentProgressEvent = z.infer<typeof AgentProgressEventSchema>;

export const AgentSuggestionSchema = z.object({
  id: z.string(),
  agent: z.string(),
  type: z.enum(['skill', 'project', 'link', 'document', 'info']),
  title: z.string(),
  description: z.string(),
  value: z.any(),
  confidence: z.enum(['high', 'medium', 'low']),
  sources: z.array(AgentSourceSchema),
  status: z.enum(['pending', 'accepted', 'rejected'])
});
export type AgentSuggestion = z.infer<typeof AgentSuggestionSchema>;

export interface OrchestratorRunInput {
  opportunityText: string;
  profile?: StudentProfile;
  agentFilter?: string[];
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language?: string;
}

export interface OrchestratorRunOutput {
  orchestrationId: string;
  timestamp: string;
  results: Record<string, AgentResult>;
  events: AgentProgressEvent[];
  suggestions: AgentSuggestion[];
  totalTimeMs: number;
}

