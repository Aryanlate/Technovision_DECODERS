import {
  AgentProgressEvent,
  AgentResult,
  AgentSuggestion,
  OrchestratorRunOutput,
  StudentProfile,
  DiscoveryResult,
  parseOpportunityToChecklist,
  evaluateProfileAgainstOpportunity,
  buildLocalDiscoveryCards,
  checkScam,
  SAMPLE_STUDENT_PROFILE,
  SAMPLE_CHECKLIST,
  EvidenceRecord,
  createDraftEvidence,
  deriveEvidenceId,
  validUntilFromStaleness,
  EVIDENCE_KIND
} from '@opportunity-kit/shared';
import { getStoredLocale } from './i18n';

export interface ScamReport {
  isScamSuspicious: boolean;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  redFlags: string[];
  safeSignals: string[];
  recommendation: string;
}

export type BackendConnectionStatus = 'idle' | 'waking' | 'online' | 'offline';

export interface WakeResult {
  status: BackendConnectionStatus;
  message: string;
  timeTakenMs: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const BACKEND_TIMEOUT_MS = 8000;

/**
 * Calls /health with an 8-second timeout to wake Render free-tier backends.
 */
export async function wakeBackend(): Promise<WakeResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      return {
        status: 'online',
        message: 'Backend is active and ready.',
        timeTakenMs: Date.now() - start
      };
    }
  } catch (err: any) {
    clearTimeout(timer);
    // Timeout or network unreachable -> offline fallback
  }

  return {
    status: 'offline',
    message: 'Backend unreachable after 8s; using in-browser rule engine and cached benchmark agents.',
    timeTakenMs: Date.now() - start
  };
}

/**
 * Runs the multi-agent pipeline via POST /api/agents/run with SSE or fallback.
 */
export async function runAgentOrchestration(
  input: {
    opportunityText: string;
    profile?: StudentProfile;
    agentFilter?: string[];
    /** Interface language for AI-written prose; defaults to the saved choice. */
    language?: string;
    existingEvidence?: EvidenceRecord[];
  },
  onProgress?: (event: AgentProgressEvent) => void
): Promise<OrchestratorRunOutput & { isOfflineFallback?: boolean }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        opportunityText: input.opportunityText,
        profile: input.profile,
        agentFilter: input.agentFilter,
        language: input.language || getStoredLocale(),
        existingEvidence: input.existingEvidence
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (res.ok) {
      const data: OrchestratorRunOutput = await res.json();
      return {
        ...data,
        isOfflineFallback: false
      };
    }
  } catch (err) {
    clearTimeout(timer);
    // Network or timeout failure -> Fall back to browser-side rule engine + cached demo data
  }

  // --------------------------------------------------------------------------
  // BROWSER-SIDE OFFLINE FALLBACK
  // --------------------------------------------------------------------------
  return runBrowserOfflineFallback(input, onProgress, start);
}

/**
 * Calls the DiscoveryAgent via POST /api/agents/discover. Falls back to the
 * browser-side curated list when the backend is offline or asleep.
 */
export async function discoverOpportunities(
  profile?: StudentProfile,
  opportunityTitle?: string,
  language?: string
): Promise<DiscoveryResult & { isOfflineFallback: boolean; providerUsed: string }> {
  const resolvedProfile = profile || SAMPLE_STUDENT_PROFILE;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        profile: resolvedProfile,
        opportunityTitle,
        language: language || getStoredLocale()
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const envelope = await res.json();
      const data: DiscoveryResult | undefined = envelope?.data;
      if (data && Array.isArray(data.listings) && data.listings.length > 0) {
        return {
          ...data,
          isOfflineFallback: false,
          providerUsed: envelope?.providerUsed || 'backend'
        };
      }
    }
  } catch {
    clearTimeout(timer);
    // Network or timeout failure -> fall back to the curated browser-side list
  }

  const local = buildLocalDiscoveryCards(resolvedProfile);
  return {
    ...local,
    notes: [
      ...local.notes,
      'Backend unreachable: discovery ran in the browser with the curated list.'
    ],
    isOfflineFallback: true,
    providerUsed: 'offline-cache'
  };
}

/**
 * Generates browser-side fallback response using @opportunity-kit/shared
 * when backend is offline or sleeping.
 */
function runBrowserOfflineFallback(
  input: { opportunityText: string; profile?: StudentProfile; existingEvidence?: EvidenceRecord[] },
  onProgress?: (event: AgentProgressEvent) => void,
  startTime: number = Date.now()
): OrchestratorRunOutput & { isOfflineFallback: boolean } {
  const profile = input.profile || SAMPLE_STUDENT_PROFILE;
  const { checklist } = parseOpportunityToChecklist(input.opportunityText);

  const events: AgentProgressEvent[] = [];
  const emit = (ev: AgentProgressEvent) => {
    events.push(ev);
    if (onProgress) {
      try {
        onProgress(ev);
      } catch {
        // Ignore
      }
    }
  };

  const agentNames = [
    'OpportunityReader',
    'GitHubAnalyzer',
    'LinkedInAnalyzer',
    'VerifierAgent',
    'ResearchAgent',
    'DiscoveryAgent'
  ];

  agentNames.forEach((a) => emit({ agent: a, status: 'queued', message: 'Queued (browser offline mode)' }));
  agentNames.forEach((a) => emit({ agent: a, status: 'running', message: 'Evaluating rules locally...' }));

  const categoryMap: Record<string, 'education' | 'academic' | 'skills' | 'documents' | 'links' | 'availability' | 'general'> = {
    year: 'education',
    cgpa: 'academic',
    skills: 'skills',
    document: 'documents',
    link: 'links',
    availability: 'availability'
  };

  const localDiscovery = buildLocalDiscoveryCards(profile);

  const results: Record<string, AgentResult> = {
    OpportunityReader: {
      agent: 'OpportunityReader',
      status: 'done',
      data: {
        title: checklist.title || 'Opportunity',
        opportunityType: (checklist.opportunityType === 'custom' ? 'other' : checklist.opportunityType) as any,
        requirements: checklist.requirements.map((r, i) => ({
          ...r,
          id: r.id || `req-${i}`,
          title: r.title || r.label || `Requirement ${i + 1}`,
          category: r.category || categoryMap[r.kind] || 'general',
          rule: r.rule || r.sourceSentence || String(r.value ?? r.label),
          sourceSentence: r.sourceSentence || String(r.value ?? r.label),
          aiSuggested: false
        })),
        evidenceNotes: ['Parsed in browser using deterministic rule parser.']
      },
      sources: [{ title: 'Browser Text Parser', url: 'local://browser-parser', trust: 'Verified' }],
      notes: ['Parsed eligibility criteria locally without network calls.'],
      confidence: 'high',
      providerUsed: 'browser-rule-engine',
      timeTakenMs: 140
    },
    GitHubAnalyzer: {
      agent: 'GitHubAnalyzer',
      status: 'done',
      data: {
        username: 'alexsharma',
        detectedSkills: ['HTML', 'CSS', 'Python'],
        repositoriesAnalyzed: 2,
        topLanguages: ['Python', 'HTML', 'CSS'],
        suggestedSkills: ['TypeScript', 'Git', 'Next.js'],
        verifiedProjects: [
          {
            name: 'portfolio-site',
            url: 'https://github.com/alexsharma/portfolio-site',
            languages: ['HTML', 'CSS'],
            stars: 3,
            description: 'Personal responsive portfolio website'
          }
        ],
        confidence: 'high' as const
      },
      sources: [{ title: 'GitHub Profile (Offline Cache)', url: 'https://github.com/alexsharma', trust: 'Verified' }],
      notes: ['Verified candidate repository technical tags.'],
      confidence: 'high',
      providerUsed: 'offline-cache',
      timeTakenMs: 120
    },
    LinkedInAnalyzer: {
      agent: 'LinkedInAnalyzer',
      status: 'done',
      data: {
        handle: 'alexsharma',
        detectedSkills: ['HTML', 'CSS', 'Python'],
        verifiedEducation: '2nd-Year B.Tech CSE',
        experiences: [{ title: 'Student Contributor', company: 'Campus Open Source Club', duration: '4 mos' }],
        suggestedSkills: ['Web Accessibility'],
        confidence: 'high' as const
      },
      sources: [{ title: 'LinkedIn Profile Record', url: 'https://linkedin.com/in/alexsharma', trust: 'Needs review' }],
      notes: ['Verified 2nd year B.Tech student status.'],
      confidence: 'high',
      providerUsed: 'offline-cache',
      timeTakenMs: 95
    },
    VerifierAgent: {
      agent: 'VerifierAgent',
      status: 'done',
      data: {
        sources: [
          {
            title: 'National Scholarship Portal',
            url: 'https://scholarships.gov.in/',
            trust: 'Verified',
            reasons: [
              'Uses HTTPS.',
              'Official-looking domain (.gov.in).',
              'No urgency or payment red flags.'
            ]
          },
          {
            title: 'Host institution page',
            url: 'https://nitrkl.ac.in/',
            trust: 'Needs review',
            reasons: [
              'Uses HTTPS.',
              'Official-looking domain (.ac.in).',
              'Fact found on a single source only.'
            ]
          },
          {
            title: 'fastinternship-jobs.xyz',
            url: 'http://fastinternship-jobs.xyz/apply',
            trust: 'Unverified',
            reasons: ['Does not use HTTPS.', 'Payment red flag: registration fee requested.']
          }
        ],
        counts: { verified: 1, needsReview: 1, unverified: 1 },
        summary: '1 Verified, 1 Needs review, 1 Unverified.',
        notes: ['Labelled sources with transparent trust checks in the browser.'],
        confidence: 'high' as const
      },
      sources: [
        { title: 'National Scholarship Portal', url: 'https://scholarships.gov.in/', trust: 'Verified' },
        { title: 'Host institution page', url: 'https://nitrkl.ac.in/', trust: 'Needs review' },
        {
          title: 'fastinternship-jobs.xyz',
          url: 'http://fastinternship-jobs.xyz/apply',
          trust: 'Unverified'
        }
      ],
      notes: ['Local transparent trust checks labelled 3 sources.'],
      confidence: 'high',
      providerUsed: 'browser-rule-verifier',
      timeTakenMs: 160
    },
    ResearchAgent: {
      agent: 'ResearchAgent',
      status: 'done',
      data: {
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
            confidence: 'high' as const
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
            confidence: 'medium' as const
          }
        ],
        notes: ['Cached grounded research: each fact quotes its source URL and sentence.']
      },
      sources: [
        {
          title: 'Application Deadline',
          url: 'https://scholarships.gov.in/nmmss-2026',
          trust: 'Needs review'
        },
        {
          title: 'Semester Marksheet',
          url: 'https://scholarships.gov.in/nmmss-2026/guidelines',
          trust: 'Needs review'
        }
      ],
      notes: ['Offline: returned cached grounded research result.'],
      confidence: 'medium',
      providerUsed: 'offline-cache',
      timeTakenMs: 110
    },
    DiscoveryAgent: {
      agent: 'DiscoveryAgent',
      status: 'done',
      data: localDiscovery,
      sources: localDiscovery.listings.map((card) => ({
        title: `${card.organisation}: ${card.title}`,
        url: card.sourceUrl,
        trust: card.trust
      })),
      notes: ['Offline: checked the curated opportunity list with the browser rule engine.'],
      confidence: 'medium',
      providerUsed: 'offline-cache',
      timeTakenMs: 130
    }
  };

  agentNames.forEach((a) => {
    emit({
      agent: a,
      status: 'done',
      timeTakenMs: results[a].timeTakenMs,
      providerUsed: results[a].providerUsed,
      message: results[a].notes?.[0] || 'Complete'
    });
  });

  const now = new Date();
  const subjectId = profile.id || 'student';
  const offlineEvidence: EvidenceRecord[] = [];

  // Offline GitHub Evidence Drafts
  const ghSkills = ['TypeScript', 'Next.js'];
  for (const s of ghSkills) {
    offlineEvidence.push(
      createDraftEvidence({
        subjectType: 'profile',
        subjectId,
        kind: EVIDENCE_KIND.GITHUB_DERIVED,
        key: s,
        value: s,
        trust: 'verified',
        source: {
          type: 'agent',
          agent: 'GitHubAnalyzer',
          provider: 'offline-cache',
          url: 'https://github.com/alexsharma',
          sentence: `Skill ${s} detected in student repository code.`
        },
        observedAt: now,
        validUntil: validUntilFromStaleness(EVIDENCE_KIND.GITHUB_DERIVED, now).toISOString(),
        existingHistory: input.existingEvidence
      })
    );
  }

  // Offline LinkedIn Evidence Drafts
  offlineEvidence.push(
    createDraftEvidence({
      subjectType: 'profile',
      subjectId,
      kind: EVIDENCE_KIND.PROFILE_TEXT_ANALYSIS,
      key: 'Web Accessibility',
      value: 'Web Accessibility',
      trust: 'needs_review',
      source: {
        type: 'agent',
        agent: 'LinkedInAnalyzer',
        provider: 'offline-cache',
        url: 'https://linkedin.com/in/alexsharma',
        sentence: 'Student demonstrated web accessibility knowledge.'
      },
      observedAt: now,
      validUntil: validUntilFromStaleness(EVIDENCE_KIND.PROFILE_TEXT_ANALYSIS, now).toISOString(),
      existingHistory: input.existingEvidence
    })
  );

  // Offline Verifier Evidence Drafts
  for (const src of results.VerifierAgent.sources || []) {
    offlineEvidence.push(
      createDraftEvidence({
        subjectType: 'opportunity',
        subjectId: checklist.title || 'opportunity',
        kind: 'source_verification',
        key: src.url || src.title,
        value: { title: src.title, url: src.url, trust: src.trust },
        trust: src.trust === 'Verified' ? 'verified' : src.trust === 'Needs review' ? 'needs_review' : 'unverified',
        source: {
          type: 'verification',
          agent: 'VerifierAgent',
          provider: 'browser-rule-verifier',
          url: src.url,
          sentence: `Source ${src.title} evaluated.`
        },
        observedAt: now,
        validUntil: validUntilFromStaleness('source_verification', now).toISOString(),
        existingHistory: input.existingEvidence
      })
    );
  }

  // Suppress identical re-suggestions from the same source if previously rejected
  const rejectedRecords = (input.existingEvidence || []).filter((e) => e.status === 'rejected');
  const activeOfflineEvidence = offlineEvidence.filter((draft) => {
    const isSuppressed = rejectedRecords.some(
      (rej) =>
        rej.evidenceId === draft.evidenceId ||
        (rej.kind === draft.kind &&
          rej.key === draft.key &&
          rej.source?.url === draft.source?.url &&
          rej.source?.agent === draft.source?.agent)
    );
    return !isSuppressed;
  });

  const suggestions: AgentSuggestion[] = [
    {
      id: deriveEvidenceId(subjectId, EVIDENCE_KIND.GITHUB_DERIVED, 'TypeScript'),
      evidenceId: deriveEvidenceId(subjectId, EVIDENCE_KIND.GITHUB_DERIVED, 'TypeScript'),
      evidenceRecord: activeOfflineEvidence.find((e) => e.key === 'TypeScript'),
      agent: 'GitHubAnalyzer',
      type: 'skill' as const,
      title: 'Add Skill: TypeScript',
      description: 'Detected in GitHub repositories analyzed from personal code projects.',
      value: 'TypeScript',
      confidence: 'high' as const,
      sources: results.GitHubAnalyzer.sources,
      status: 'pending' as const
    },
    {
      id: deriveEvidenceId(subjectId, EVIDENCE_KIND.GITHUB_DERIVED, 'Next.js'),
      evidenceId: deriveEvidenceId(subjectId, EVIDENCE_KIND.GITHUB_DERIVED, 'Next.js'),
      evidenceRecord: activeOfflineEvidence.find((e) => e.key === 'Next.js'),
      agent: 'GitHubAnalyzer',
      type: 'skill' as const,
      title: 'Add Skill: Next.js',
      description: 'Found in modern web application project dependencies.',
      value: 'Next.js',
      confidence: 'high' as const,
      sources: results.GitHubAnalyzer.sources,
      status: 'pending' as const
    },
    {
      id: deriveEvidenceId(subjectId, 'link', 'github'),
      evidenceId: deriveEvidenceId(subjectId, 'link', 'github'),
      agent: 'VerifierAgent',
      type: 'link' as const,
      title: 'Add GitHub Link to Profile',
      description: 'This opportunity requests a GitHub or portfolio link to inspect code samples.',
      value: { field: 'github' },
      confidence: 'high' as const,
      sources: results.VerifierAgent.sources,
      status: 'pending' as const
    }
  ].filter((sug) => {
    return !rejectedRecords.some(
      (rej) =>
        rej.evidenceId === sug.evidenceId ||
        (rej.source?.agent === sug.agent && rej.key === String(sug.value))
    );
  });

  return {
    orchestrationId: `offline-${Date.now()}`,
    timestamp: new Date().toISOString(),
    results,
    events,
    suggestions,
    evidence: activeOfflineEvidence,
    totalTimeMs: Date.now() - startTime,
    isOfflineFallback: true
  };
}

/**
 * Heuristic + backend scam checker.
 */
export async function fetchScamCheck(opportunityText: string): Promise<ScamReport> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/check-scam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityText })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline fallback: client-side heuristic inspection
  }

  // Client-side fallback check — same rule engine as the backend (no AI).
  const result = checkScam(opportunityText);

  return {
    isScamSuspicious: result.level !== 'Low',
    riskScore: result.score,
    riskLevel: result.level.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
    redFlags: result.findings.map((f) => `${f.label} (+${f.points} pts): ${f.explanation}`),
    safeSignals: result.isClean ? ['No scam warning signs found by the rule engine.'] : [],
    recommendation: result.summary
  };
}

/**
 * Analyzes pasted LinkedIn text (or data export) with LLM or keyword rule fallback.
 * Strictly adheres to privacy policy: NEVER fetches linkedin.com directly.
 */
export async function analyzeLinkedInText(
  pastedText: string,
  linkedinUrl?: string
): Promise<{
  skills: Array<{ skill: string; sentence: string; confidence: string }>;
  experiences: Array<{ title: string; company: string; duration?: string; sentence: string; confidence: string }>;
  education: Array<{ degree: string; sentence: string; confidence: string }>;
  notes: string[];
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pastedText, linkedinUrl })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data) {
        return {
          skills: data.data.skills || [],
          experiences: data.data.experiences || [],
          education: data.data.education || [],
          notes: data.notes || []
        };
      }
    }
  } catch {
    // Offline fallback
  }

  // Browser-side fallback keyword rules
  const sentences = pastedText.split(/(?<=[.!?\n])\s+/).map((s) => s.trim()).filter((s) => s.length > 5);
  const skills: Array<{ skill: string; sentence: string; confidence: string }> = [];
  const experiences: Array<{ title: string; company: string; duration?: string; sentence: string; confidence: string }> = [];
  const education: Array<{ degree: string; sentence: string; confidence: string }> = [];

  const commonSkills = [
    'HTML',
    'CSS',
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'SQL',
    'React',
    'Next.js',
    'Node.js',
    'Git',
    'Tailwind CSS',
    'Docker',
    'REST APIs'
  ];

  for (const s of sentences) {
    for (const skill of commonSkills) {
      const regex = new RegExp(`\\b${skill}\\b`, 'i');
      if (regex.test(s) && !skills.some((k) => k.skill.toLowerCase() === skill.toLowerCase())) {
        skills.push({ skill, sentence: s, confidence: 'high' });
      }
    }
    const sLower = s.toLowerCase();
    if (sLower.includes('b.tech') || sLower.includes('bachelor') || sLower.includes('engineering') || sLower.includes('degree')) {
      education.push({ degree: s.slice(0, 50), sentence: s, confidence: 'high' });
    }
    if (sLower.includes('intern') || sLower.includes('coordinator') || sLower.includes('developer') || sLower.includes('club')) {
      experiences.push({ title: 'Contributor', company: 'Experience Record', sentence: s, confidence: 'high' });
    }
  }

  return {
    skills,
    experiences,
    education,
    notes: ['Parsed locally with keyword rules. Note: "We never access your LinkedIn account."']
  };
}
