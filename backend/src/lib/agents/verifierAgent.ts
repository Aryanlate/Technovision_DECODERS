import {
  Agent,
  AgentResult,
  AgentSource,
  Checklist,
  StudentProfile,
  VerifierAgentOutput,
  VerifiedSource
} from './types.js';
import { checkOpportunityScam } from './scamChecker.js';

/** A candidate source the verifier can label. */
export interface VerifierSourceInput {
  title?: string;
  url: string;
  /** The fact this source is meant to support (used for corroboration). */
  fact?: string;
  sourceSentence?: string;
}

export interface VerifierAgentInput {
  profile?: StudentProfile;
  checklist?: Checklist;
  opportunityText?: string;
  /** The organisation's own domain, counted as official-looking when matched. */
  organizationDomain?: string;
  /** Sources gathered elsewhere (e.g. by the ResearchAgent). */
  sources?: VerifierSourceInput[];
}

interface CandidateSource {
  title: string;
  url: string;
  fact: string;
}

// Official-looking domain suffixes (.gov.in, .ac.in, .edu, etc.).
const OFFICIAL_SUFFIXES = ['.gov.in', '.gov', '.ac.in', '.ac', '.edu', '.edu.in', '.nic.in', '.res.in'];

const URGENCY_PATTERN =
  /\b(urgent|urgently|immediately|act now|limited seats|only \d+ seats|last date today|hurry)\b/i;
const PAYMENT_PATTERN =
  /\b(registration fee|application fee|security deposit|processing fee|training fee|pay\s+(?:rs|inr|\u20B9|\$)\s*\d+)\b/i;

function normalize(value?: string): string {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function isWebUrl(url: URL | null): boolean {
  return !!url && (url.protocol === 'https:' || url.protocol === 'http:');
}

function hostOf(raw: string): string {
  const u = parseUrl(raw);
  return u ? u.hostname.toLowerCase() : '';
}

/** Returns the matched official domain descriptor, or null. */
function matchOfficialDomain(host: string, organizationDomain?: string): string | null {
  const h = host.toLowerCase();
  if (!h) return null;

  if (organizationDomain) {
    const org = organizationDomain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');
    if (org && (h === org || h.endsWith(`.${org}`))) return `organisation's own domain (${org})`;
  }

  for (const suffix of OFFICIAL_SUFFIXES) {
    if (h === suffix.slice(1) || h.endsWith(suffix)) return suffix;
  }
  return null;
}

/** Probes a URL with a short timeout. Returns unknown when probing is unavailable. */
async function probeReachability(url: string, timeoutMs = 2500): Promise<'reachable' | 'unreachable' | 'unknown'> {
  if (typeof fetch !== 'function') return 'unknown';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);
    return res.status < 400 ? 'reachable' : 'unreachable';
  } catch {
    clearTimeout(timer);
    return 'unreachable';
  }
}

/** Collects candidate sources from explicit input plus URLs in the listing. */
function collectCandidates(input: VerifierAgentInput): CandidateSource[] {
  const out: CandidateSource[] = [];
  const seen = new Set<string>();

  const push = (url: string, title: string, fact?: string) => {
    const key = (url || '').trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ url: key, title: title || key, fact: fact || '' });
  };

  for (const s of input.sources || []) {
    push(s.url, s.title || s.url, s.fact || s.sourceSentence);
  }

  const text = input.opportunityText || '';
  const urlRegex = /https?:\/\/[^\s"'<>)\]]+/gi;
  for (const match of text.match(urlRegex) || []) {
    push(match.replace(/[.,;]+$/, ''), 'Link in opportunity listing');
  }

  return out;
}

/**
 * VerifierAgent: labels every source Verified, Needs review or Unverified.
 *
 * This is plain code — no LLM makes the decision. Each source is scored with
 * transparent checks and the exact reasons are returned with the label:
 *   1. HTTPS
 *   2. official-looking domain (.gov.in, .ac.in, .edu, or the organisation's own domain)
 *   3. URL reachable
 *   4. the same fact found on a second source
 *   5. no urgency or payment red flags
 */
export class VerifierAgent implements Agent<VerifierAgentInput, VerifierAgentOutput> {
  public readonly name = 'VerifierAgent';

  /** Cached demo result: already-labelled sample sources with reasons. */
  private cachedDemoResult(): VerifierAgentOutput {
    return {
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
        },
        {
          title: 'Host institute internship page',
          url: 'https://nitrkl.ac.in/internships/iot-embedded-2026',
          trust: 'Needs review',
          reasons: [
            'Uses HTTPS.',
            'Official-looking domain (.ac.in).',
            'URL reachable.',
            'Fact found on a single source only.',
            'No urgency or payment red flags.'
          ]
        },
        {
          title: 'fastinternship-jobs.xyz',
          url: 'http://fastinternship-jobs.xyz/apply',
          trust: 'Unverified',
          reasons: [
            'Does not use HTTPS.',
            'Domain is not an official-looking domain (.gov.in, .ac.in, .edu) or the organisation\u2019s own domain.',
            'Fact found on a single source only.',
            'Payment red flag: registration fee requested.'
          ]
        }
      ],
      counts: { verified: 1, needsReview: 1, unverified: 1 },
      summary: '1 Verified, 1 Needs review, 1 Unverified.',
      notes: ['DEMO_MODE active: returning cached labelled sources.'],
      confidence: 'high'
    };
  }

  async run(input: VerifierAgentInput): Promise<AgentResult<VerifierAgentOutput>> {
    const startTime = Date.now();
    const isDemo = process.env.DEMO_MODE === 'true';

    if (isDemo) {
      const data = this.cachedDemoResult();
      return {
        agent: this.name,
        status: 'done',
        data,
        sources: this.toAgentSources(data.sources),
        notes: ['DEMO_MODE active: returning cached source trust labels.'],
        confidence: data.confidence,
        providerUsed: 'cache',
        timeTakenMs: Date.now() - startTime
      };
    }

    const candidates = collectCandidates(input);
    const opportunityRedFlags = checkOpportunityScam(input.opportunityText || '').redFlags;

    if (candidates.length === 0) {
      const data: VerifierAgentOutput = {
        sources: [],
        counts: { verified: 0, needsReview: 0, unverified: 0 },
        summary: '0 Verified, 0 Needs review, 0 Unverified.',
        notes: [
          'No sources were provided or found in the listing; no researched fact can be presented as certain.'
        ],
        confidence: 'low'
      };
      return {
        agent: this.name,
        status: 'done',
        data,
        sources: [],
        notes: data.notes,
        confidence: 'low',
        providerUsed: 'rule-verifier',
        timeTakenMs: Date.now() - startTime
      };
    }

    const labelled: VerifiedSource[] = [];
    for (const candidate of candidates) {
      labelled.push(await this.labelSource(candidate, candidates, opportunityRedFlags));
    }

    const counts = {
      verified: labelled.filter((s) => s.trust === 'Verified').length,
      needsReview: labelled.filter((s) => s.trust === 'Needs review').length,
      unverified: labelled.filter((s) => s.trust === 'Unverified').length
    };

    const confidence: 'high' | 'medium' | 'low' =
      counts.unverified === 0 && counts.verified > 0
        ? 'high'
        : counts.unverified === 0
          ? 'medium'
          : 'low';

    const data: VerifierAgentOutput = {
      sources: labelled,
      counts,
      summary: `${counts.verified} Verified, ${counts.needsReview} Needs review, ${counts.unverified} Unverified.`,
      notes: [`Labelled ${labelled.length} source(s) with transparent trust checks.`],
      confidence
    };

    return {
      agent: this.name,
      status: 'done',
      data,
      sources: this.toAgentSources(labelled),
      notes: [data.summary, ...data.notes],
      confidence,
      providerUsed: 'rule-verifier',
      timeTakenMs: Date.now() - startTime
    };
  }

  /** Applies the transparent trust checks to a single source. */
  private async labelSource(
    candidate: CandidateSource,
    all: CandidateSource[],
    opportunityRedFlags: string[]
  ): Promise<VerifiedSource> {
    const reasons: string[] = [];
    let score = 0;

    const url = parseUrl(candidate.url);
    const web = isWebUrl(url);
    const https = url?.protocol === 'https:';

    // 1. HTTPS
    if (https) {
      score += 1;
      reasons.push('Uses HTTPS.');
    } else if (web) {
      score -= 2;
      reasons.push('Does not use HTTPS.');
    } else {
      reasons.push('Not a public web URL; trust checks cannot be applied.');
    }

    // 2. Official-looking domain
    const host = url?.hostname ? url.hostname.toLowerCase() : '';
    const official = host ? matchOfficialDomain(host, undefined) : null;
    if (official) {
      score += 1;
      reasons.push(`Official-looking domain (${official}).`);
    } else if (host) {
      reasons.push(
        'Domain is not an official-looking domain (.gov.in, .ac.in, .edu) or the organisation\u2019s own domain.'
      );
    }

    // 3. URL reachable
    if (web) {
      const reach = await probeReachability(candidate.url);
      if (reach === 'reachable') {
        score += 1;
        reasons.push('URL reachable.');
      } else if (reach === 'unreachable') {
        score -= 2;
        reasons.push('URL did not respond (not reachable).');
      } else {
        reasons.push('URL reachability could not be checked.');
      }
    }

    // 4. Same fact found on a second source
    const corroborated = this.isCorroborated(candidate, all);
    if (corroborated) {
      score += 1;
      reasons.push('Same fact found on a second source.');
    } else {
      reasons.push('Fact found on a single source only.');
    }

    // 5. Urgency / payment red flags
    const redFlag = this.findRedFlag(candidate, opportunityRedFlags);
    if (redFlag) {
      score -= 3;
      reasons.push(redFlag);
    } else {
      reasons.push('No urgency or payment red flags.');
    }

    // Transparent decision rules.
    let trust: VerifiedSource['trust'];
    if (!web || !https || redFlag) {
      trust = 'Unverified';
    } else if (score >= 3) {
      trust = 'Verified';
    } else if (score >= 1) {
      trust = 'Needs review';
    } else {
      trust = 'Unverified';
    }

    return { title: candidate.title, url: candidate.url, trust, reasons };
  }

  /** Corroborated when another source states the same fact, or shares the host. */
  private isCorroborated(candidate: CandidateSource, all: CandidateSource[]): boolean {
    const host = hostOf(candidate.url);
    const fact = normalize(candidate.fact);
    return all.some((other) => {
      if (other.url === candidate.url) return false;
      const otherFact = normalize(other.fact);
      if (fact && otherFact && fact === otherFact) return true;
      if (!fact && !otherFact && host && hostOf(other.url) === host) return true;
      return false;
    });
  }

  /** Returns a red-flag reason string, or null when nothing suspicious is found. */
  private findRedFlag(candidate: CandidateSource, opportunityRedFlags: string[]): string | null {
    const localText = `${candidate.title} ${candidate.fact}`;
    if (PAYMENT_PATTERN.test(localText)) return 'Payment red flag: a fee or deposit is mentioned.';
    if (URGENCY_PATTERN.test(localText)) return 'Urgency red flag: high-pressure wording detected.';
    if (opportunityRedFlags.length > 0) return `Red flag from the listing: ${opportunityRedFlags[0]}`;
    return null;
  }

  /** Maps verified sources onto the shared AgentSource envelope. */
  private toAgentSources(sources: VerifiedSource[]): AgentSource[] {
    return sources.map((s) => ({ title: s.title, url: s.url, trust: s.trust, reasons: s.reasons }));
  }
}
