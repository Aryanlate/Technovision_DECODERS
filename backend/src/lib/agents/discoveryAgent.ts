import {
  Agent,
  AgentResult,
  AgentSource,
  DiscoveryAgentOutput,
  DiscoveryListingCard,
  DiscoveryListingsOutputSchema,
  DiscoveryListingsOutput,
  DISCOVERY_AGENT_SPEC,
  StudentProfile,
  SAMPLE_STUDENT_PROFILE,
  CURATED_DISCOVERY_OPPORTUNITIES,
  buildLocalDiscoveryCards,
  rankDiscoveryCards,
  skillGapSummary,
  trustForSourceUrl,
  compare,
  detectOpportunityType
} from './types.js';
import { askAgentLLM } from '../llm/index.js';
import { OpportunityReader } from './opportunityReader.js';
import { VerifierAgent } from './verifierAgent.js';

export interface DiscoveryAgentInput {
  profile?: StudentProfile;
  opportunityTitle?: string;
  domain?: string;
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language?: string;
}

/** One candidate opportunity, ready to be read, verified and compared. */
interface ListingInput {
  title: string;
  organisation: string;
  sourceUrl: string;
  opportunityType: string;
  fitReason: string;
  text: string;
}

/** Prompt handed to the search-capable provider (profile in, listings out). */
function buildSearchPrompt(profile: StudentProfile, opportunityTitle?: string): string {
  const skills = (profile.skills || []).join(', ') || 'none listed';
  const projects = (profile.projects || []).map((p) => p.title).join(', ') || 'none listed';
  return `Student profile:
- Year: ${profile.year ?? 'not provided'}
- Branch: ${profile.branch || 'not provided'}
- CGPA: ${profile.cgpa ?? 'not provided'}
- Skills: ${skills}
- Projects: ${projects}
${opportunityTitle ? `- Already evaluating: ${opportunityTitle}` : ''}

Find real, current internships, scholarships and competitions that fit this profile. Return only listings you can link to. Never invent a listing.

Return ONLY JSON of this shape: { "listings": [ { "title": string, "organisation": string, "sourceUrl": string, "fitReason": string, "description": string } ], "notes": string[], "confidence": "high" | "medium" | "low" }.`;
}

/**
 * DiscoveryAgent: finds opportunities for the student's profile, then decides
 * how close each one is to ready.
 *
 * 1. Calls a search-capable provider through the gateway for real, linkable
 *    internships, scholarships and competitions. If live search is
 *    unavailable (or nothing linkable comes back), it uses a curated local
 *    list of 12 sample opportunities instead.
 * 2. Runs every result through the OpportunityReader, then the Verifier,
 *    then the comparison engine.
 * 3. Ranks the results by closeness to ready (fewest Mismatch, then fewest
 *    Missing info) and summarises the skills missing most often.
 */
export class DiscoveryAgent implements Agent<DiscoveryAgentInput, DiscoveryAgentOutput> {
  public readonly name = 'DiscoveryAgent';

  private reader = new OpportunityReader();
  private verifier = new VerifierAgent();

  async run(input: DiscoveryAgentInput): Promise<AgentResult<DiscoveryAgentOutput>> {
    const startTime = Date.now();
    const profile = input.profile ?? SAMPLE_STUDENT_PROFILE;
    const isDemo = process.env.DEMO_MODE === 'true';

    // ----------------------------------------------------------------------
    // DEMO_MODE: deterministic result built from the curated list with the
    // rule parser and the rule engine only (no network, no LLM).
    // ----------------------------------------------------------------------
    if (isDemo) {
      const data = buildLocalDiscoveryCards(profile);
      return {
        agent: this.name,
        status: 'done',
        data,
        sources: this.toSources(data.listings),
        notes: ['DEMO_MODE active: returning cached discovery results.', ...data.notes],
        confidence: 'high',
        providerUsed: 'cache',
        timeTakenMs: Date.now() - startTime
      };
    }

    try {
      // 1. Discover listings (search first, curated list as fallback).
      const { listings, providerUsed, searched } = await this.findListings(
        profile,
        input.opportunityTitle,
        input.language
      );

      // 2. Run every listing through OpportunityReader -> Verifier -> compare.
      const cards = await Promise.all(
        listings.map((l) => this.buildCard(l, profile, input.language))
      );

      const ranked = rankDiscoveryCards(cards);
      const data: DiscoveryAgentOutput = {
        listings: ranked,
        skillGaps: skillGapSummary(cards, profile),
        notes: [
          searched
            ? `Live search returned ${listings.length} linkable listing(s).`
            : `Live search unavailable: used the curated list of ${listings.length} sample opportunities.`,
          `Ranked by closeness to ready (fewest Mismatch, then fewest Missing info).`
        ],
        confidence: searched ? 'medium' : 'high'
      };

      return {
        agent: this.name,
        status: 'done',
        data,
        sources: this.toSources(ranked),
        notes: data.notes,
        confidence: data.confidence,
        providerUsed,
        timeTakenMs: Date.now() - startTime
      };
    } catch (err: any) {
      // Never leave the page empty: fall back to the curated local list.
      const data = buildLocalDiscoveryCards(profile);
      return {
        agent: this.name,
        status: 'done',
        data,
        sources: this.toSources(data.listings),
        notes: [
          `Discovery error (${err?.message || err}); returned the curated local list instead.`
        ],
        confidence: 'low',
        providerUsed: 'curated-fallback',
        timeTakenMs: Date.now() - startTime
      };
    }
  }

  /**
   * Asks a search-capable provider for linkable listings. Falls back to the
   * curated local list when live search is unavailable or returns nothing.
   */
  private async findListings(
    profile: StudentProfile,
    opportunityTitle?: string,
    language?: string
  ): Promise<{ listings: ListingInput[]; providerUsed: string; searched: boolean }> {
    const curated: ListingInput[] = CURATED_DISCOVERY_OPPORTUNITIES.map((opp) => ({
      title: opp.title,
      organisation: opp.organisation,
      sourceUrl: opp.sourceUrl,
      opportunityType: opp.opportunityType,
      fitReason: opp.fitReason,
      text: opp.text
    }));

    let llmRes: { data: DiscoveryListingsOutput | null; provider: string } | null = null;
    try {
      llmRes = await askAgentLLM<DiscoveryListingsOutput>('discovery_agent', {
        system: DISCOVERY_AGENT_SPEC.rolePrompt,
        prompt: buildSearchPrompt(profile, opportunityTitle),
        schema: DiscoveryListingsOutputSchema,
        needsWebSearch: true,
        temperature: 0,
        language
      });
    } catch (err: any) {
      console.warn('[DiscoveryAgent] Search call failed:', err?.message || err);
      llmRes = null;
    }

    // Keep only listings we can actually link to.
    const found = (llmRes?.data?.listings || []).filter(
      (l) => (l.sourceUrl || '').trim() && (l.title || '').trim()
    );

    if (found.length === 0) {
      return { listings: curated, providerUsed: 'curated-fallback', searched: false };
    }

    return {
      listings: found.map((l) => {
        const text = (l.description || l.fitReason || '').trim();
        return {
          title: l.title,
          organisation: l.organisation || 'Unknown organisation',
          sourceUrl: l.sourceUrl,
          opportunityType: detectOpportunityType(`${l.title} ${text}`),
          fitReason: l.fitReason || 'Matches your profile.',
          text
        };
      }),
      providerUsed: llmRes?.provider || 'search',
      searched: true
    };
  }

  /**
   * Reads, verifies and compares a single listing, then packages the result
   * as a discovery card (status counts + the single fix that unlocks it).
   */
  private async buildCard(
    listing: ListingInput,
    profile: StudentProfile,
    language?: string
  ): Promise<DiscoveryListingCard> {
    // OpportunityReader: rule parser first, LLM only when signals are missing.
    const readerRes = await this.reader.run({
      opportunityText: listing.text,
      opportunityTitle: listing.title,
      language
    });
    const requirements = readerRes.data?.requirements ?? [];
    const aiSuggestedCount = requirements.filter((r) => r.aiSuggested).length;

    // Verifier: labels the listing's source URL with a transparent trust label.
    const verifierRes = await this.verifier.run({
      sources: [{ title: listing.organisation, url: listing.sourceUrl, fact: listing.title }],
      opportunityText: listing.text
    });
    const labelled = verifierRes.data?.sources?.find((s) => s.url === listing.sourceUrl);

    // Comparison engine: the only thing that decides Match / Mismatch / Missing info.
    const result = compare(requirements, profile);

    return {
      title: listing.title,
      organisation: listing.organisation,
      sourceUrl: listing.sourceUrl,
      opportunityType: listing.opportunityType,
      fitReason: listing.fitReason,
      rawText: listing.text,
      trust: labelled?.trust ?? trustForSourceUrl(listing.sourceUrl),
      trustReasons: labelled?.reasons ?? [],
      counts: {
        matches: result.counts.matches,
        mismatches: result.counts.mismatches,
        missingInfo: result.counts.missingInfo,
        total: result.counts.total ?? requirements.length
      },
      readiness: result.readiness as DiscoveryListingCard['readiness'],
      singleFix: result.nextSteps[0] || '',
      nextSteps: result.nextSteps,
      requirements,
      findings: result.findings,
      aiSuggestedCount
    };
  }

  /** One AgentSource per card, carrying its trust label and reasons. */
  private toSources(cards: DiscoveryListingCard[]): AgentSource[] {
    return cards.map((c) => ({
      title: `${c.organisation}: ${c.title}`,
      url: c.sourceUrl,
      trust: c.trust,
      reasons: c.trustReasons
    }));
  }
}
