import {
  Agent,
  AgentResult,
  AgentSource,
  Checklist,
  ResearchAgentOutput,
  ResearchAgentOutputSchema,
  RESEARCH_AGENT_SPEC,
  Requirement,
  ResearchedRequirement,
  parseOpportunityToChecklist,
  EvidenceRecord,
  EVIDENCE_KIND,
  createDraftEvidence
} from './types.js';
import { askAgentLLM } from '../llm/index.js';

export interface ResearchAgentInput {
  organizationName?: string;
  opportunityTitle?: string;
  domain?: string;
  opportunityText?: string;
  checklist?: Checklist;
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language?: string;
  existingEvidence?: EvidenceRecord[];
}

/**
 * Finds which details the pasted listing is missing.
 * We only research the well-known gaps: deadline, eligibility and documents.
 */
function detectMissingDetails(requirements: Requirement[]): string[] {
  const kinds = new Set(requirements.map((r) => r.kind));
  const missing: string[] = [];

  if (!kinds.has('deadline')) missing.push('deadline');

  const hasEligibility = kinds.has('year') || kinds.has('cgpa') || kinds.has('skills');
  if (!hasEligibility) missing.push('eligibility');

  if (!kinds.has('document')) missing.push('documents');

  return missing;
}

/** One AgentSource per researched fact, carrying its own URL. */
function toSources(extraRequirements: ResearchedRequirement[]): AgentSource[] {
  const seen = new Set<string>();
  const sources: AgentSource[] = [];
  for (const req of extraRequirements) {
    const url = (req.sourceUrl || '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({ title: req.label || req.title || 'Researched source', url, trust: 'Needs review' });
  }
  return sources;
}

function buildPrompt(input: ResearchAgentInput, missingDetails: string[], text: string): string {
  return `Opportunity title: ${input.opportunityTitle || input.organizationName || 'Untitled opportunity'}
Organisation: ${input.organizationName || input.domain || 'Unknown'}
Missing details to find: ${missingDetails.join(', ')}

Listing text:
${text || '(not provided)'}

Find each missing detail on the live web. For every fact include the exact source URL and the sentence it came from. If you cannot find a source for a fact, return nothing for that fact.

Return ONLY JSON of this shape: { "missingDetails": string[], "extraRequirements": [ { "id": string, "kind": string, "label": string, "value": any, "required": boolean, "title": string, "category": string, "sourceUrl": string, "sourceSentence": string, "confidence": "high" | "medium" | "low" } ], "notes": string[] }.`;
}

/**
 * ResearchAgent: fills gaps the pasted listing leaves open (deadline,
 * eligibility, documents) using a provider that supports web search.
 *
 * - The gateway routes the call to a search-capable provider automatically
 *   (Gemini with Google Search grounding is the default).
 * - Every returned fact carries a source URL, source sentence and confidence.
 * - Facts without a source are dropped.
 * - If the free search allowance runs out (or the search fails), the cached
 *   demo result is returned instead of uncited facts.
 */
export class ResearchAgent implements Agent<ResearchAgentInput, ResearchAgentOutput> {
  public readonly name = 'ResearchAgent';

  /** Cached demo result: used for DEMO_MODE and as the search-failure fallback. */
  private cachedDemoResult(): ResearchAgentOutput {
    return {
      missingDetails: ['deadline', 'documents'],
      extraRequirements: [
        {
          id: 'res-deadline',
          kind: 'deadline',
          label: 'Application Deadline',
          value: '2026-11-15',
          required: true,
          title: 'Application Deadline: 2026-11-15',
          category: 'general',
          sourceUrl: 'https://scholarships.gov.in/nmmss-2026',
          sourceSentence: 'Last date for online application is 15 November 2026.',
          confidence: 'high'
        },
        {
          id: 'res-document-marksheet',
          kind: 'document',
          label: 'Semester Marksheet',
          value: 'marksheet',
          required: true,
          title: 'Previous Semesters Marksheet',
          category: 'documents',
          sourceUrl: 'https://scholarships.gov.in/nmmss-2026/guidelines',
          sourceSentence: 'Applicants must upload their latest semester marksheet.',
          confidence: 'medium'
        }
      ],
      notes: ['Cached grounded research: each fact quotes its source URL and sentence.']
    };
  }

  private buildEvidenceDrafts(
    extraRequirements: ResearchedRequirement[],
    subjectId: string,
    providerUsed: string,
    existingEvidence?: EvidenceRecord[]
  ): EvidenceRecord[] {
    return extraRequirements.map((req) =>
      createDraftEvidence({
        subjectType: 'opportunity',
        subjectId: subjectId || 'opportunity',
        kind: EVIDENCE_KIND.RESEARCHED_FACT,
        key: req.id,
        value: req,
        source: {
          type: 'research_agent',
          agent: this.name,
          provider: providerUsed,
          url: req.sourceUrl,
          sentence: req.sourceSentence || req.label || req.title
        },
        trust: 'unverified',
        existingEvidence
      })
    );
  }

  async run(input: ResearchAgentInput): Promise<AgentResult<ResearchAgentOutput>> {
    const startTime = Date.now();
    const isDemo = process.env.DEMO_MODE === 'true';
    const oppSubjectId = input.opportunityTitle || input.organizationName || 'opportunity';

    // ----------------------------------------------------------------------
    // DEMO_MODE: cached result, no network.
    // ----------------------------------------------------------------------
    if (isDemo) {
      const data = this.cachedDemoResult();
      const evidence = this.buildEvidenceDrafts(data.extraRequirements, oppSubjectId, 'cache', input.existingEvidence);
      return {
        agent: this.name,
        status: 'done',
        data,
        evidence,
        sources: toSources(data.extraRequirements),
        notes: ['DEMO_MODE active: returning cached grounded research.'],
        confidence: 'high',
        providerUsed: 'cache',
        timeTakenMs: Date.now() - startTime
      };
    }

    const text = (input.opportunityText || '').trim();

    // Determine which details are missing from the pasted text.
    let missingDetails: string[];
    if (input.checklist) {
      missingDetails = detectMissingDetails(input.checklist.requirements);
    } else if (text) {
      const { checklist } = parseOpportunityToChecklist(text, input.opportunityTitle);
      missingDetails = detectMissingDetails(checklist.requirements);
    } else {
      // No listing text at all -> research all the well-known gaps.
      missingDetails = ['deadline', 'eligibility', 'documents'];
    }

    // Nothing missing -> no web call needed.
    if (missingDetails.length === 0) {
      return {
        agent: this.name,
        status: 'done',
        data: {
          missingDetails: [],
          extraRequirements: [],
          notes: ['Pasted text already covers deadline, eligibility and documents; no web research needed.']
        },
        evidence: [],
        sources: [],
        notes: ['No missing details detected; skipped live web search.'],
        confidence: 'high',
        providerUsed: 'rule-parser',
        timeTakenMs: Date.now() - startTime
      };
    }

    // ----------------------------------------------------------------------
    // Ask a web-search-capable provider (Gemini grounding by default).
    // ----------------------------------------------------------------------
    let llmRes = null;
    try {
      llmRes = await askAgentLLM<ResearchAgentOutput>('research_agent', {
        system: RESEARCH_AGENT_SPEC.rolePrompt,
        prompt: buildPrompt(input, missingDetails, text),
        schema: ResearchAgentOutputSchema,
        needsWebSearch: true,
        temperature: 0,
        language: input.language
      });
    } catch (err: any) {
      llmRes = null;
      console.warn('[ResearchAgent] Web search call failed:', err?.message || err);
    }

    // Free search allowance exhausted / search failed -> cached demo result
    // rather than uncited facts.
    const researched = llmRes?.data?.extraRequirements?.filter((r) => (r.sourceUrl || '').trim()) ?? [];
    if (!llmRes || !llmRes.data || researched.length === 0) {
      const data = this.cachedDemoResult();
      const evidence = this.buildEvidenceDrafts(data.extraRequirements, oppSubjectId, 'cache', input.existingEvidence);
      return {
        agent: this.name,
        status: 'done',
        data,
        evidence,
        sources: toSources(data.extraRequirements),
        notes: [
          'Live web search unavailable or free search allowance exhausted: returning cached demo research result.',
          'Cached facts are demo data and must be verified before use.'
        ],
        confidence: 'low',
        providerUsed: 'cache',
        timeTakenMs: Date.now() - startTime
      };
    }

    const droppedCount = llmRes.data.extraRequirements.length - researched.length;
    const data: ResearchAgentOutput = {
      missingDetails,
      extraRequirements: researched,
      notes: [
        ...(llmRes.data.notes || []),
        ...(droppedCount > 0 ? [`Dropped ${droppedCount} fact(s) that had no source URL.`] : [])
      ]
    };

    const evidence = this.buildEvidenceDrafts(researched, oppSubjectId, llmRes.provider, input.existingEvidence);

    return {
      agent: this.name,
      status: 'done',
      data,
      evidence,
      sources: toSources(researched),
      notes: [`Researched ${researched.length} cited fact(s) for missing details: ${missingDetails.join(', ')}.`],
      confidence: 'medium',
      providerUsed: llmRes.provider,
      timeTakenMs: Date.now() - startTime
    };
  }
}
