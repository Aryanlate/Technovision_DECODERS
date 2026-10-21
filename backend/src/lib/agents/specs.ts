import { z } from 'zod';
import {
  RequirementSchema,
  RequirementKindSchema,
  RequirementCategorySchema,
  SAMPLE_OPPORTUNITIES,
  DiscoveryListingsOutputSchema,
  DiscoveryResultSchema,
  DiscoveryListingsOutput,
  DiscoveryResult
} from '@opportunity-kit/shared';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AgentSpec<T = any> {
  name: string;
  rolePrompt: string;
  allowedTools: string[];
  outputSchema: z.ZodType<T, any, any>;
  fewShotExamples: Array<{
    input: string;
    output: T;
  }>;
  defaultProvider: string;
  needsWebSearch?: boolean;
}

// ============================================================================
// 1. OPPORTUNITY READER AGENT SPEC
// ============================================================================
/**
 * A single requirement read from a listing. Mirrors the shared Requirement
 * schema and adds the exact source sentence plus an "AI-suggested" marker.
 * Anything the LLM adds is AI-suggested and needs the student's confirmation.
 */
export const ReaderRequirementSchema = RequirementSchema.extend({
  sourceSentence: z.string(),
  aiSuggested: z.boolean().default(false)
});
export type ReaderRequirement = z.infer<typeof ReaderRequirementSchema>;

export const OpportunityReaderOutputSchema = z.object({
  opportunityType: z.enum(['internship', 'scholarship', 'competition', 'other']),
  title: z.string(),
  requirements: z.array(ReaderRequirementSchema),
  evidenceNotes: z.array(z.string()).default([])
});
export type OpportunityReaderOutput = z.infer<typeof OpportunityReaderOutputSchema>;

/** Maps a shared sample checklist into the OpportunityReader few-shot shape. */
function toReaderExample(
  text: string,
  checklist: { opportunityType: string; title: string; requirements: any[] }
): { input: string; output: OpportunityReaderOutput } {
  const opportunityType = (['internship', 'scholarship', 'competition'].includes(
    checklist.opportunityType
  )
    ? checklist.opportunityType
    : 'other') as OpportunityReaderOutput['opportunityType'];

  return {
    input: text,
    output: {
      opportunityType,
      title: checklist.title,
      requirements: checklist.requirements.map((r) => ({
        ...r,
        sourceSentence: r.sourceSentence || r.rule || r.label || '',
        aiSuggested: false
      })),
      evidenceNotes: [
        `Extracted ${checklist.requirements.length} criteria with verbatim source sentences.`
      ]
    }
  };
}

export const OPPORTUNITY_READER_SPEC: AgentSpec<OpportunityReaderOutput> = {
  name: 'opportunity_reader',
  rolePrompt:
    'Extract requirements from the listing. Quote the exact source sentence for each. Do not guess missing values. Return JSON matching the Requirement schema.',
  allowedTools: ['text_chunker', 'quote_matcher'],
  outputSchema: OpportunityReaderOutputSchema,
  defaultProvider: 'gemini',
  // Few-shot examples built from the 4 benchmark sample opportunities.
  fewShotExamples: SAMPLE_OPPORTUNITIES.map((o) => toReaderExample(o.text, o.checklist))
};

// Backward-compatibility alias
export const OPPORTUNITY_EXTRACTOR_SPEC = OPPORTUNITY_READER_SPEC;
export const OpportunityExtractorOutputSchema = OpportunityReaderOutputSchema;
export type OpportunityExtractorOutput = OpportunityReaderOutput;

// ============================================================================
// 2. GITHUB ANALYZER AGENT SPEC
// ============================================================================
export const GitHubSuggestedSkillSchema = z.object({
  skill: z.string(),
  evidence: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type GitHubSuggestedSkill = z.infer<typeof GitHubSuggestedSkillSchema>;

export const GitHubSuggestedProjectSchema = z.object({
  title: z.string(),
  tech: z.array(z.string()),
  domain: z.string(),
  proofLink: z.string(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type GitHubSuggestedProject = z.infer<typeof GitHubSuggestedProjectSchema>;

export const GitHubAnalyzerOutputSchema = z.object({
  username: z.string(),
  suggestedSkills: z.array(GitHubSuggestedSkillSchema),
  suggestedProjects: z.array(GitHubSuggestedProjectSchema),
  detectedSkills: z.array(z.string()),
  repositoriesAnalyzed: z.number(),
  topLanguages: z.array(z.string()),
  recentActivity: z.string().optional(),
  totalStars: z.number().optional(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type GitHubAnalyzerOutput = z.infer<typeof GitHubAnalyzerOutputSchema>;

export const GITHUB_ANALYZER_SPEC: AgentSpec<GitHubAnalyzerOutput> = {
  name: 'github_analyzer',
  rolePrompt:
    'You are the GitHub Analyzer for OpportunityKit. Infer skills and project evidence only from the repository data provided. Never invent skills or projects. Every skill must cite at least one repo name as evidence. Return a confidence of high, medium or low. Never judge the student or decide eligibility.',
  allowedTools: ['github_repo_fetcher', 'language_breakdown'],
  outputSchema: GitHubAnalyzerOutputSchema,
  defaultProvider: 'gemini',
  fewShotExamples: [
    {
      input:
        'GitHub Username: alexsharma | Repositories: [portfolio-site: language=HTML, CSS, stars=3, url=https://github.com/alexsharma/portfolio-site, updated=2026-09-15], [data-scripts: language=Python, topics=[automation, pandas], stars=5, url=https://github.com/alexsharma/data-scripts, updated=2026-10-01]',
      output: {
        username: 'alexsharma',
        suggestedSkills: [
          {
            skill: 'HTML',
            evidence: ['portfolio-site'],
            confidence: 'high'
          },
          {
            skill: 'CSS',
            evidence: ['portfolio-site'],
            confidence: 'high'
          },
          {
            skill: 'Python',
            evidence: ['data-scripts'],
            confidence: 'high'
          },
          {
            skill: 'Pandas',
            evidence: ['data-scripts'],
            confidence: 'medium'
          }
        ],
        suggestedProjects: [
          {
            title: 'portfolio-site',
            tech: ['HTML', 'CSS'],
            domain: 'Web Development',
            proofLink: 'https://github.com/alexsharma/portfolio-site',
            confidence: 'high'
          },
          {
            title: 'data-scripts',
            tech: ['Python', 'Pandas'],
            domain: 'Data Analytics',
            proofLink: 'https://github.com/alexsharma/data-scripts',
            confidence: 'high'
          }
        ],
        detectedSkills: ['HTML', 'CSS', 'Python'],
        repositoriesAnalyzed: 2,
        topLanguages: ['Python', 'HTML', 'CSS'],
        recentActivity: '2 repositories updated recently',
        totalStars: 8,
        confidence: 'high'
      }
    },
    {
      input:
        'GitHub Username: rohanverma | Repositories: [campus-delivery: language=TypeScript, topics=[react, nodejs], stars=12, url=https://github.com/rohanverma/campus-delivery, updated=2026-10-10], [smart-grid: language=C++, topics=[iot, embedded], stars=4, url=https://github.com/rohanverma/smart-grid, updated=2026-08-20]',
      output: {
        username: 'rohanverma',
        suggestedSkills: [
          {
            skill: 'TypeScript',
            evidence: ['campus-delivery'],
            confidence: 'high'
          },
          {
            skill: 'React',
            evidence: ['campus-delivery'],
            confidence: 'high'
          },
          {
            skill: 'C++',
            evidence: ['smart-grid'],
            confidence: 'high'
          },
          {
            skill: 'IoT',
            evidence: ['smart-grid'],
            confidence: 'medium'
          }
        ],
        suggestedProjects: [
          {
            title: 'campus-delivery',
            tech: ['TypeScript', 'React', 'Node.js'],
            domain: 'Full Stack Web',
            proofLink: 'https://github.com/rohanverma/campus-delivery',
            confidence: 'high'
          },
          {
            title: 'smart-grid',
            tech: ['C++', 'IoT'],
            domain: 'Embedded Systems',
            proofLink: 'https://github.com/rohanverma/smart-grid',
            confidence: 'high'
          }
        ],
        detectedSkills: ['TypeScript', 'React', 'C++'],
        repositoriesAnalyzed: 2,
        topLanguages: ['TypeScript', 'C++'],
        recentActivity: 'Active open source contributor',
        totalStars: 16,
        confidence: 'high'
      }
    }
  ]
};

// ============================================================================
// 3. LINKEDIN ANALYZER AGENT SPEC
// ============================================================================
export const LinkedInExtractedSkillSchema = z.object({
  skill: z.string(),
  sentence: z.string(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type LinkedInExtractedSkill = z.infer<typeof LinkedInExtractedSkillSchema>;

export const LinkedInExtractedExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  duration: z.string().optional(),
  sentence: z.string(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type LinkedInExtractedExperience = z.infer<typeof LinkedInExtractedExperienceSchema>;

export const LinkedInExtractedEducationSchema = z.object({
  degree: z.string(),
  institution: z.string().optional(),
  sentence: z.string(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type LinkedInExtractedEducation = z.infer<typeof LinkedInExtractedEducationSchema>;

export const LinkedInAnalyzerOutputSchema = z.object({
  handle: z.string(),
  skills: z.array(LinkedInExtractedSkillSchema),
  experiences: z.array(LinkedInExtractedExperienceSchema),
  education: z.array(LinkedInExtractedEducationSchema),
  detectedSkills: z.array(z.string()),
  suggestedSkills: z.array(z.string()),
  verifiedEducation: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type LinkedInAnalyzerOutput = z.infer<typeof LinkedInAnalyzerOutputSchema>;

export const LINKEDIN_ANALYZER_SPEC: AgentSpec<LinkedInAnalyzerOutput> = {
  name: 'linkedin_analyzer',
  rolePrompt:
    'You are the LinkedIn Profile Analyzer for OpportunityKit. Extract skills, education and experience only from the pasted text. Never invent or assume details not explicitly stated in the text. Return JSON with confidence and the sentence each item came from. Never judge the student or decide eligibility.',
  allowedTools: ['experience_extractor', 'sentence_tokenizer'],
  outputSchema: LinkedInAnalyzerOutputSchema,
  defaultProvider: 'gemini',
  fewShotExamples: [
    {
      input:
        'Currently pursuing 2nd year B.Tech in Computer Science and Engineering at National Institute of Technology. Experienced in HTML, CSS and Python through web development projects and course labs. Served as Student Web Coordinator at Campus Open Source Club for 4 months.',
      output: {
        handle: 'alexsharma',
        skills: [
          {
            skill: 'HTML',
            sentence: 'Experienced in HTML, CSS and Python through web development projects and course labs.',
            confidence: 'high'
          },
          {
            skill: 'CSS',
            sentence: 'Experienced in HTML, CSS and Python through web development projects and course labs.',
            confidence: 'high'
          },
          {
            skill: 'Python',
            sentence: 'Experienced in HTML, CSS and Python through web development projects and course labs.',
            confidence: 'high'
          }
        ],
        experiences: [
          {
            title: 'Student Web Coordinator',
            company: 'Campus Open Source Club',
            duration: '4 months',
            sentence: 'Served as Student Web Coordinator at Campus Open Source Club for 4 months.',
            confidence: 'high'
          }
        ],
        education: [
          {
            degree: '2nd year B.Tech in Computer Science and Engineering',
            institution: 'National Institute of Technology',
            sentence: 'Currently pursuing 2nd year B.Tech in Computer Science and Engineering at National Institute of Technology.',
            confidence: 'high'
          }
        ],
        detectedSkills: ['HTML', 'CSS', 'Python'],
        suggestedSkills: ['HTML', 'CSS', 'Python', 'Web Coordination'],
        verifiedEducation: '2nd year B.Tech in Computer Science and Engineering',
        confidence: 'high'
      }
    },
    {
      input:
        '3rd-year Information Technology undergraduate. Frontend Intern at TechSolutions Pvt Ltd for 3 months developing React components. Proficient in TypeScript, REST APIs, and Tailwind CSS.',
      output: {
        handle: 'rohanverma',
        skills: [
          {
            skill: 'React',
            sentence: 'Frontend Intern at TechSolutions Pvt Ltd for 3 months developing React components.',
            confidence: 'high'
          },
          {
            skill: 'TypeScript',
            sentence: 'Proficient in TypeScript, REST APIs, and Tailwind CSS.',
            confidence: 'high'
          },
          {
            skill: 'REST APIs',
            sentence: 'Proficient in TypeScript, REST APIs, and Tailwind CSS.',
            confidence: 'high'
          },
          {
            skill: 'Tailwind CSS',
            sentence: 'Proficient in TypeScript, REST APIs, and Tailwind CSS.',
            confidence: 'high'
          }
        ],
        experiences: [
          {
            title: 'Frontend Intern',
            company: 'TechSolutions Pvt Ltd',
            duration: '3 months',
            sentence: 'Frontend Intern at TechSolutions Pvt Ltd for 3 months developing React components.',
            confidence: 'high'
          }
        ],
        education: [
          {
            degree: '3rd-year Information Technology',
            sentence: '3rd-year Information Technology undergraduate.',
            confidence: 'high'
          }
        ],
        detectedSkills: ['React', 'TypeScript', 'REST APIs', 'Tailwind CSS'],
        suggestedSkills: ['React', 'TypeScript', 'REST APIs', 'Tailwind CSS'],
        verifiedEducation: '3rd-year Information Technology',
        confidence: 'high'
      }
    }
  ]
};

// ============================================================================
// 4. RESEARCH AGENT (Grounded Web Search)
// ============================================================================
/**
 * An extra requirement found on the web. Every fact must carry the exact
 * source URL, the sentence it came from, and a confidence. Facts without a
 * source are never returned.
 */
export const ResearchedRequirementSchema = z.object({
  id: z.string(),
  kind: RequirementKindSchema.default('custom'),
  label: z.string(),
  value: z.any().optional(),
  required: z.boolean().default(true),
  title: z.string().optional(),
  category: RequirementCategorySchema.optional(),
  sourceUrl: z.string(),
  sourceSentence: z.string(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type ResearchedRequirement = z.infer<typeof ResearchedRequirementSchema>;

export const ResearchAgentOutputSchema = z.object({
  missingDetails: z.array(z.string()).default([]),
  extraRequirements: z.array(ResearchedRequirementSchema).default([]),
  notes: z.array(z.string()).default([])
});
export type ResearchAgentOutput = z.infer<typeof ResearchAgentOutputSchema>;

export const RESEARCH_AGENT_SPEC: AgentSpec<ResearchAgentOutput> = {
  name: 'research_agent',
  rolePrompt:
    'Find missing details about this opportunity. Every fact must include its source URL and the sentence it came from. If you cannot find a source, return nothing for that fact.',
  allowedTools: ['google_search_grounding', 'domain_age_lookup'],
  outputSchema: ResearchAgentOutputSchema,
  defaultProvider: 'gemini',
  needsWebSearch: true,
  fewShotExamples: [
    {
      input:
        'Opportunity: "National Merit-cum-Means STEM Scholarship 2026. Open to 2nd or 3rd-year engineering students." Missing details: deadline, documents.',
      output: {
        missingDetails: ['deadline', 'documents'],
        extraRequirements: [
          {
            id: 'res-deadline',
            kind: 'deadline',
            label: 'Application Deadline',
            value: '2026-10-31',
            required: true,
            title: 'Application Deadline: 2026-10-31',
            category: 'general',
            sourceUrl: 'https://scholarships.gov.in/nmmss-2026',
            sourceSentence: 'Last date for online application is 31 October 2026.',
            confidence: 'high'
          },
          {
            id: 'res-doc-marksheet',
            kind: 'document',
            label: 'Semester Marksheet',
            value: 'marksheet',
            required: true,
            title: 'Previous Semesters Marksheet',
            category: 'documents',
            sourceUrl: 'https://scholarships.gov.in/nmmss-2026/guidelines',
            sourceSentence: 'Applicants must upload the previous semester marksheet.',
            confidence: 'medium'
          }
        ],
        notes: ['Deadline and document list found on the official National Scholarship Portal.']
      }
    },
    {
      input:
        'Opportunity: "IoT & Embedded Systems Engineering Intern. Skills: Embedded C, Arduino, ESP32." Missing details: eligibility, documents.',
      output: {
        missingDetails: ['eligibility', 'documents'],
        extraRequirements: [
          {
            id: 'res-eligibility',
            kind: 'year',
            label: 'Eligibility - Year of Study',
            value: [2, 3],
            required: true,
            title: 'Open to 2nd and 3rd year students',
            category: 'education',
            sourceUrl: 'https://nitrkl.ac.in/internships/iot-embedded-2026',
            sourceSentence: 'The internship is open to 2nd and 3rd year students of engineering programmes.',
            confidence: 'high'
          }
        ],
        notes: ['Eligibility confirmed from the host institute internship page.']
      }
    }
  ]
};

// Backward-compatibility alias
export const WEB_RESEARCHER_SPEC = RESEARCH_AGENT_SPEC;
export const WebResearcherOutputSchema = ResearchAgentOutputSchema;
export type WebResearcherOutput = ResearchAgentOutput;

// ============================================================================
// 5. VERIFIER AGENT
// ============================================================================
/**
 * A labelled source. The trust label is decided by transparent plain-code
 * checks (HTTPS, official-looking domain, reachability, corroboration and
 * urgency/payment red flags). `reasons` records exactly why the label was
 * chosen so the student can see the evidence behind it.
 *
 * No LLM is used to make this decision.
 */
export const VerifiedSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  trust: z.enum(['Verified', 'Needs review', 'Unverified']),
  reasons: z.array(z.string()).default([])
});
export type VerifiedSource = z.infer<typeof VerifiedSourceSchema>;

export const VerifierAgentOutputSchema = z.object({
  sources: z.array(VerifiedSourceSchema),
  counts: z.object({
    verified: z.number(),
    needsReview: z.number(),
    unverified: z.number()
  }),
  summary: z.string(),
  notes: z.array(z.string()).default([]),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type VerifierAgentOutput = z.infer<typeof VerifierAgentOutputSchema>;

export const VERIFIER_AGENT_SPEC: AgentSpec<VerifierAgentOutput> = {
  name: 'verifier_agent',
  rolePrompt:
    'Label every source Verified, Needs review or Unverified using transparent checks: HTTPS, official-looking domain, URL reachable, the same fact found on a second source, and no urgency or payment red flags. Never present a researched fact as certain without a source.',
  allowedTools: ['link_validator', 'domain_checker', 'scam_red_flag_scanner'],
  outputSchema: VerifierAgentOutputSchema,
  defaultProvider: 'gemini',
  fewShotExamples: [
    {
      input:
        'Source: https://scholarships.gov.in/nmmss-2026 (https, .gov.in, reachable, fact also on https://nta.ac.in/nmmss).',
      output: {
        sources: [
          {
            title: 'National Scholarship Portal',
            url: 'https://scholarships.gov.in/nmmss-2026',
            trust: 'Verified',
            reasons: [
              'Uses HTTPS.',
              'Official-looking domain (.gov.in).',
              'URL reachable.',
              'Same fact found on a second source (https://nta.ac.in/nmmss).',
              'No urgency or payment red flags.'
            ]
          }
        ],
        counts: { verified: 1, needsReview: 0, unverified: 0 },
        summary: '1 Verified, 0 Needs review, 0 Unverified.',
        notes: ['Official government portal with corroborating source.'],
        confidence: 'high'
      }
    },
    {
      input:
        'Source: http://fastinternship-jobs.xyz/apply (no HTTPS, unknown domain, no second source, listing asks for a Rs 499 registration fee).',
      output: {
        sources: [
          {
            title: 'fastinternship-jobs.xyz',
            url: 'http://fastinternship-jobs.xyz/apply',
            trust: 'Unverified',
            reasons: [
              'Does not use HTTPS.',
              'Domain is not an official-looking domain (.gov.in, .ac.in, .edu) or the organisation’s own domain.',
              'Fact found on a single source only.',
              'Payment red flag: registration fee requested.'
            ]
          }
        ],
        counts: { verified: 0, needsReview: 0, unverified: 1 },
        summary: '0 Verified, 0 Needs review, 1 Unverified.',
        notes: ['Payment red flag and no HTTPS: do not trust this source.'],
        confidence: 'high'
      }
    }
  ]
};

// Backward-compatibility alias
export const PROFILE_VERIFIER_SPEC = VERIFIER_AGENT_SPEC;
export const ProfileVerifierOutputSchema = VerifierAgentOutputSchema;
export type ProfileVerifierOutput = VerifierAgentOutput;

// ============================================================================
// 6. DISCOVERY AGENT
// ============================================================================
// The gateway validates the provider's raw listings (title, organisation,
// source URL and a one-line fit reason). The agent then runs each listing
// through the OpportunityReader, the Verifier and the comparison engine and
// adds the trust label, the status counts, the single fix and the skill gaps.
// `DiscoveryListingsOutputSchema` / `DiscoveryListingsOutput` come from shared.
export const DiscoveryAgentOutputSchema = DiscoveryResultSchema;
export type DiscoveryAgentOutput = DiscoveryResult;

export const DISCOVERY_AGENT_SPEC: AgentSpec<DiscoveryListingsOutput> = {
  name: 'discovery_agent',
  rolePrompt:
    'Find real, current internships, scholarships and competitions related to this profile. Return only listings you can link to. Never invent a listing. Each result needs a title, organisation, source URL and a one-line reason it fits.',
  allowedTools: ['web_search', 'opportunity_indexer'],
  outputSchema: DiscoveryListingsOutputSchema,
  defaultProvider: 'gemini',
  needsWebSearch: true,
  fewShotExamples: [
    {
      input: 'Candidate: 2nd-year B.Tech CSE, CGPA 8.2, skills HTML, CSS, Python.',
      output: {
        listings: [
          {
            title: 'Summer Software Engineering Intern',
            organisation: 'Infosys',
            sourceUrl: 'https://infosys.com/careers/internship',
            fitReason: 'Open to 2nd and 3rd-year students and matches the CGPA cut-off.',
            description: 'Open to 2nd or 3rd-year B.Tech students. Minimum CGPA 7.0. Skills: Java, SQL.'
          }
        ],
        notes: ['Found 1 listing that can be linked directly.'],
        confidence: 'high'
      }
    },
    {
      input: 'Candidate: 3rd-year B.E. ECE, CGPA 8.9, skills Embedded C, MATLAB, projects in clean energy.',
      output: {
        listings: [
          {
            title: 'Clean Energy Hardware Innovation Challenge',
            organisation: 'Ministry of New and Renewable Energy',
            sourceUrl: 'https://mnre.gov.in/challenge',
            fitReason: 'Aligned with the candidate solar inverter hardware project.',
            description: 'Hardware competition for engineering students. Team size 2 to 4. Minimum 1 project required.'
          }
        ],
        notes: ['Found 1 national hardware challenge with a linkable source.'],
        confidence: 'high'
      }
    },
    {
      input: 'Candidate: 2nd-year B.Tech IT, CGPA 9.1, skills TypeScript, React, Node.js.',
      output: {
        listings: [
          {
            title: 'National Smart Mobility Hackathon',
            organisation: 'Urban Transport Innovation Hub',
            sourceUrl: 'https://smartmobility.gov.in',
            fitReason: 'Direct match for full-stack tracking skills.',
            description: 'Hackathon for college students. Skills: TypeScript, React, Node.js. GitHub link required.'
          }
        ],
        notes: ['Identified 1 national transport hackathon with a source URL.'],
        confidence: 'high'
      }
    }
  ]
};

// ============================================================================
// 7. SCAM CHECKER AGENT SPEC
// ============================================================================
export const ScamCheckerOutputSchema = z.object({
  isLegitimate: z.boolean(),
  riskScore: z.number().min(0).max(1),
  scamFlags: z.array(z.string()),
  evidenceCitations: z.array(z.string()),
  verdictExplanation: z.string(),
  confidence: z.enum(['high', 'medium', 'low'])
});
export type ScamCheckerOutput = z.infer<typeof ScamCheckerOutputSchema>;

export const SCAM_CHECKER_SPEC: AgentSpec<ScamCheckerOutput> = {
  name: 'scam_checker',
  rolePrompt:
    'You are the Scam and Fraud Screening agent for OpportunityKit. Analyze opportunity listings for suspicious indicators such as upfront security fees, unverified domains, or unrealistic promises. Use only the provided data, never invent, cite evidence or sources, return a confidence of high, medium or low, and never decide eligibility.',
  allowedTools: ['fee_detector', 'reputation_scanner'],
  outputSchema: ScamCheckerOutputSchema,
  defaultProvider: 'gemini',
  fewShotExamples: [
    {
      input:
        'Summer Internship at Google. 8 weeks duration, stipend provided. Apply through careers.google.com with your resume and transcript.',
      output: {
        isLegitimate: true,
        riskScore: 0.02,
        scamFlags: [],
        evidenceCitations: ['Applies via verified domain careers.google.com', 'Zero monetary fees requested'],
        verdictExplanation: 'Verified legitimate enterprise engineering internship posting.',
        confidence: 'high'
      }
    },
    {
      input:
        'Guaranteed Work From Home Data Entry Intern! Earn Rs 25,000 per week. Must pay refundable security deposit of Rs 1,499 via Google Pay before receiving training kit. Contact HR on WhatsApp +91-9876543210.',
      output: {
        isLegitimate: false,
        riskScore: 0.98,
        scamFlags: [
          'Upfront registration/security deposit requested',
          'Unrealistic salary for entry-level tasks',
          'Informal communication via WhatsApp instead of official company domain'
        ],
        evidenceCitations: [
          'Must pay refundable security deposit of Rs 1,499 via Google Pay',
          'Contact HR on WhatsApp'
        ],
        verdictExplanation: 'High-risk fraudulent listing asking for upfront payment.',
        confidence: 'high'
      }
    },
    {
      input:
        'Urgent hiring: Part time crypto wallet data processor. Earn Rs 40,000 weekly without interview. Contact admin on Telegram @FastCashJobs. You must submit your bank account details and OTP to verify identity.',
      output: {
        isLegitimate: false,
        riskScore: 0.99,
        scamFlags: [
          'Solicits sensitive banking information and OTP',
          'Promises unrealistic compensation for low-skill role',
          'Only provides Telegram handle without verifiable company or domain'
        ],
        evidenceCitations: [
          'Contact admin on Telegram @FastCashJobs',
          'submit your bank account details and OTP'
        ],
        verdictExplanation: 'Critical scam hazard attempting banking credential theft.',
        confidence: 'high'
      }
    }
  ]
};

export const ALL_AGENT_SPECS: Record<string, AgentSpec<any>> = {
  opportunity_reader: OPPORTUNITY_READER_SPEC,
  opportunity_extractor: OPPORTUNITY_READER_SPEC,
  github_analyzer: GITHUB_ANALYZER_SPEC,
  linkedin_analyzer: LINKEDIN_ANALYZER_SPEC,
  research_agent: RESEARCH_AGENT_SPEC,
  web_researcher: RESEARCH_AGENT_SPEC,
  verifier_agent: VERIFIER_AGENT_SPEC,
  profile_verifier: VERIFIER_AGENT_SPEC,
  discovery_agent: DISCOVERY_AGENT_SPEC,
  scam_checker: SCAM_CHECKER_SPEC
};
