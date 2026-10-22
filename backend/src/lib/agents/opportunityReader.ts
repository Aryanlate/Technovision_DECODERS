import {
  Agent,
  AgentResult,
  AgentSource,
  OpportunityReaderOutput,
  OpportunityReaderOutputSchema,
  OPPORTUNITY_READER_SPEC,
  ReaderRequirement,
  Requirement,
  parseOpportunityToChecklist,
  SAMPLE_OPPORTUNITY_TEXT,
  SAMPLE_OPPORTUNITY_TITLE,
  EvidenceRecord,
  createDraftEvidence
} from './types.js';
import { askAgentLLM } from '../llm/index.js';

export interface OpportunityReaderInput {
  opportunityText: string;
  opportunityTitle?: string;
  opportunityType?: string;
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language?: string;
  existingEvidence?: EvidenceRecord[];
}

type ReaderType = OpportunityReaderOutput['opportunityType'];

/** Normalizes the parser / LLM opportunity type into the reader output enum. */
function mapOpportunityType(type: string): ReaderType {
  return (['internship', 'scholarship', 'competition'].includes(type) ? type : 'other') as ReaderType;
}

/** Converts a Requirement into the reader output shape with an AI-suggested flag. */
function toReaderRequirement(req: Requirement, aiSuggested: boolean): ReaderRequirement {
  return {
    ...req,
    sourceSentence: req.sourceSentence || req.rule || req.label || '',
    aiSuggested
  };
}

/** Normalizes text for duplicate detection between parser and LLM output. */
function normalize(value?: string): string {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * The rule parser already covers a requirement if the label or the exact
 * source sentence matches. LLM duplicates are dropped so AI never shadows
 * the deterministic parser.
 */
function isDuplicate(existing: Requirement[], candidate: Requirement): boolean {
  const label = normalize(candidate.label || candidate.title);
  const sentence = normalize(candidate.sourceSentence);
  return existing.some(
    (e) =>
      (label && normalize(e.label || e.title) === label) ||
      (sentence && normalize(e.sourceSentence) === sentence)
  );
}

/**
 * Prompt with few-shot examples from the 4 benchmark sample opportunities,
 * followed by the real listing. The role prompt lives in the spec.
 */
function buildPrompt(opportunityText: string): string {
  const examples = OPPORTUNITY_READER_SPEC.fewShotExamples
    .map(
      (ex, i) =>
        `Example ${i + 1} listing:\n${ex.input}\nExample ${i + 1} JSON:\n${JSON.stringify(ex.output)}`
    )
    .join('\n\n');

  return `${examples}

Now extract requirements from this listing:
${opportunityText}

Return ONLY JSON of this shape: { "opportunityType": "internship" | "scholarship" | "competition" | "other", "title": string, "requirements": [ Requirement objects, each with an exact sourceSentence quote ], "evidenceNotes": string[] }.`;
}

/**
 * OpportunityReader: reads a listing into requirements.
 *
 * 1. Runs the deterministic rule parser (Part 6) FIRST.
 * 2. Only if requirements are missing (nothing parsed, or unparsed content)
 *    falls back to askAgentLLM with the reader role prompt.
 * 3. Anything the LLM adds is marked "AI-suggested" and needs the student's
 *    confirmation; parser output is never overwritten by the LLM.
 * 4. Output is validated with zod by the gateway.
 */
function buildOpportunityEvidenceDrafts(
  requirements: Requirement[],
  subjectId: string,
  providerUsed: string,
  existingEvidence?: EvidenceRecord[]
): EvidenceRecord[] {
  return requirements.map((req) =>
    createDraftEvidence({
      subjectType: 'opportunity',
      subjectId: subjectId || 'opportunity',
      kind: req.kind,
      key: req.id,
      value: req,
      source: {
        type: 'opportunity_reader',
        agent: 'OpportunityReader',
        provider: providerUsed,
        url: 'input://opportunity-text',
        sentence: req.sourceSentence || req.rule || req.label
      },
      trust: 'unverified',
      existingEvidence
    })
  );
}

export class OpportunityReader implements Agent<OpportunityReaderInput, OpportunityReaderOutput> {
  public readonly name = 'OpportunityReader';

  async run(input: OpportunityReaderInput): Promise<AgentResult<OpportunityReaderOutput>> {
    const startTime = Date.now();
    const text = (input.opportunityText || '').trim();

    // ----------------------------------------------------------------------
    // DEMO_MODE: cached, deterministic result (no network, no LLM).
    // ----------------------------------------------------------------------
    const isDemo = process.env.DEMO_MODE === 'true';
    if (isDemo) {
      const { checklist } = parseOpportunityToChecklist(SAMPLE_OPPORTUNITY_TEXT, SAMPLE_OPPORTUNITY_TITLE);
      const demoData: OpportunityReaderOutput = {
        opportunityType: mapOpportunityType(checklist.opportunityType),
        title: checklist.title,
        requirements: checklist.requirements.map((r) => toReaderRequirement(r, false)),
        evidenceNotes: ['DEMO_MODE: cached benchmark requirements parsed by the rule parser.']
      };

      const evidence = buildOpportunityEvidenceDrafts(
        checklist.requirements,
        checklist.title || SAMPLE_OPPORTUNITY_TITLE,
        'cache',
        input.existingEvidence
      );

      return {
        agent: this.name,
        status: 'done',
        data: demoData,
        evidence,
        sources: [
          { title: 'Benchmark Opportunity Listing', url: 'local://benchmark-opportunity', trust: 'Verified' }
        ],
        notes: ['DEMO_MODE active: returning cached benchmark requirements.'],
        confidence: 'high',
        providerUsed: 'cache',
        timeTakenMs: Date.now() - startTime
      };
    }

    // ----------------------------------------------------------------------
    // Empty input: clear message, nothing to read.
    // ----------------------------------------------------------------------
    if (!text) {
      return {
        agent: this.name,
        status: 'done',
        data: { opportunityType: 'other', title: 'Opportunity', requirements: [], evidenceNotes: [] },
        evidence: [],
        sources: [],
        notes: ['No opportunity text provided; nothing to read.'],
        confidence: 'low',
        providerUsed: 'rule-parser',
        timeTakenMs: Date.now() - startTime
      };
    }

    // ----------------------------------------------------------------------
    // STEP 1: Rule parser first (transparent, no AI).
    // ----------------------------------------------------------------------
    const { checklist, warnings } = parseOpportunityToChecklist(text, input.opportunityTitle);
    const parsedRequirements: Requirement[] = checklist.requirements;
    const missingSignals: string[] = [];
    if (parsedRequirements.length === 0) {
      missingSignals.push('No requirements could be parsed from the listing.');
    }
    missingSignals.push(...warnings);

    const sources: AgentSource[] = [
      { title: 'Pasted Opportunity Listing', url: 'input://opportunity-text', trust: 'Verified' }
    ];

    const buildResult = (
      requirements: Requirement[],
      aiSuggestedSet: Set<Requirement>,
      notes: string[],
      providerUsed: string,
      confidence: 'high' | 'medium' | 'low'
    ): AgentResult<OpportunityReaderOutput> => {
      const evidenceNotes = notes.slice();
      const evidence = buildOpportunityEvidenceDrafts(
        requirements,
        checklist.title || 'opportunity',
        providerUsed,
        input.existingEvidence
      );
      return {
        agent: this.name,
        status: 'done',
        data: {
          opportunityType: mapOpportunityType(checklist.opportunityType),
          title: checklist.title,
          requirements: requirements.map((r) => toReaderRequirement(r, aiSuggestedSet.has(r))),
          evidenceNotes
        },
        evidence,
        sources,
        notes,
        confidence,
        providerUsed,
        timeTakenMs: Date.now() - startTime
      };
    };

    // No missing requirements -> parser result is enough, skip the LLM.
    if (missingSignals.length === 0) {
      return buildResult(
        parsedRequirements,
        new Set(),
        [`Parsed ${parsedRequirements.length} requirement(s) with the rule parser; no LLM call needed.`],
        'rule-parser',
        'high'
      );
    }

    // ----------------------------------------------------------------------
    // STEP 2: Requirements are missing -> ask the LLM (Gemini Flash, Groq fallback).
    // ----------------------------------------------------------------------
    let llmRes = null;
    try {
      llmRes = await askAgentLLM<OpportunityReaderOutput>('opportunity_reader', {
        system: OPPORTUNITY_READER_SPEC.rolePrompt,
        prompt: buildPrompt(text),
        schema: OpportunityReaderOutputSchema,
        temperature: 0,
        language: input.language
      });
    } catch (err: any) {
      llmRes = null;
      console.warn('[OpportunityReader] LLM call failed:', err?.message || err);
    }

    if (!llmRes || !llmRes.data) {
      // Gateway offline / unconfigured: safe parser-only fallback.
      return buildResult(
        parsedRequirements,
        new Set(),
        [
          `Parsed ${parsedRequirements.length} requirement(s) with the rule parser.`,
          'LLM gateway unavailable: showing rule-parser results only.',
          ...warnings
        ],
        'rule-parser',
        parsedRequirements.length > 0 ? 'high' : 'low'
      );
    }

    // Merge: keep every parser requirement, add only genuinely new LLM items.
    const merged: Requirement[] = [...parsedRequirements];
    const aiSuggestedSet = new Set<Requirement>();
    for (const candidate of llmRes.data.requirements) {
      if (isDuplicate(merged, candidate)) continue;
      merged.push(candidate);
      aiSuggestedSet.add(candidate);
    }

    const notes = [
      `Rule parser extracted ${parsedRequirements.length} requirement(s).`,
      ...(aiSuggestedSet.size > 0
        ? [`${aiSuggestedSet.size} additional requirement(s) were AI-suggested and need the student's confirmation.`]
        : ['The LLM added no new requirements; parser output stands as-is.']),
      ...warnings
    ];

    return buildResult(
      merged,
      aiSuggestedSet,
      notes,
      llmRes.provider,
      aiSuggestedSet.size > 0 ? 'medium' : 'high'
    );
  }
}
