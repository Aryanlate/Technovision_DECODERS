'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Finding,
  Checklist,
  Requirement,
  StudentProfile,
  SAMPLE_OPPORTUNITY_TEXT,
  SAMPLE_STUDENT_PROFILE,
  SAMPLE_CHECKLIST,
  evaluateProfileAgainstOpportunity,
  computeReadinessScore,
  simulateWhatIf,
  buildPrioritisedNextSteps,
  bestFitProject,
  trustForSourceUrl,
  resolveEntryKey,
  extractMissingSkills,
  getLearningForSkill,
  versionRef
} from '@opportunity-kit/shared';
import type { EligibilityFinding, EvidenceRecord } from '@opportunity-kit/shared';
import {
  hasStoredProfile,
  getStoredProfile,
  saveStoredProfile,
  getStoredChecklist
} from '../../lib/storage';
import { getEvidenceStore } from '../../lib/evidence/repository';
import {
  actionableEvidenceId,
  confirmEvidenceRecord,
  evaluateFromStore,
  evidenceBadge,
  indexRecords,
  refreshEvidenceRecord,
  resolveConflictingEvidence,
  syncAllEvidence,
  syncProfileEvidence,
  toEvaluationResult
} from '../../lib/evidence/bridge';
import { SectionTitle } from '../../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import type { BadgeStatus } from '../../components/Badge';
import { TableSkeleton, SummarySkeleton, FailureAlert } from '../../components/LoadingSkeleton';
import { generateMarkdownSummary, triggerPrintPdf, downloadDeadlineIcs, downloadJson } from '../../lib/export';
import { downloadChecklistPdf } from '../../lib/pdf';
import { buildTrackerDraft, findOpportunityDeadline } from '../../lib/resultToTracker';
import { createShareLink, shareUrl } from '../../lib/shareStore';
import { SaveToTrackerButton } from '../../components/SaveToTrackerButton';
import { getUserPlan, getUsageStats, canAccessAgentFeatures, UsageStats } from '../../lib/plans';
import { UpgradeNudge } from '../../components/UpgradeNudge';
import { getFeatureFlags } from '../../lib/flags';
import { useTranslation } from '../../lib/i18n/LanguageProvider';
import { statusLabel, localizeRuleReason } from '../../lib/i18n/rules';

/**
 * Demo agent-research modules. Each one shows a source link and a trust badge,
 * and is labelled AI-suggested because it is not produced by the rule engine.
 * A module with no source link is presented as Unverified and cannot be counted.
 */
interface AgentEvidenceModule {
  titleKey: string;
  rows: { labelKey: string; value: string }[];
  noteKey: string;
  sourceUrl: string;
}

const AGENT_EVIDENCE_MODULES: AgentEvidenceModule[] = [
  {
    titleKey: 'result.agents.modules.github.title',
    rows: [
      { labelKey: 'result.agents.modules.github.repository', value: 'alexsharma/portfolio-site' },
      { labelKey: 'result.agents.modules.github.commits', value: '14 commits read' },
      { labelKey: 'result.agents.modules.github.languages', value: 'HTML (62%), CSS (38%)' }
    ],
    noteKey: 'result.agents.modules.github.note',
    sourceUrl: 'https://github.com/alexsharma/portfolio-site'
  },
  {
    titleKey: 'result.agents.modules.employer.title',
    rows: [
      { labelKey: 'result.agents.modules.employer.employer', value: 'Engineering Internship Org' },
      { labelKey: 'result.agents.modules.employer.domainAge', value: '8+ years' }
    ],
    noteKey: 'result.agents.modules.employer.note',
    sourceUrl: ''
  },
  {
    titleKey: 'result.agents.modules.ats.title',
    rows: [
      { labelKey: 'result.agents.modules.ats.keywordMatch', value: 'HTML, CSS, JavaScript' },
      { labelKey: 'result.agents.modules.ats.actionVerbs', value: 'Engineered, Implemented' }
    ],
    noteKey: 'result.agents.modules.ats.note',
    sourceUrl: ''
  }
];

// ---------------------------------------------------------------------------
// Evidence badges.
//
// Every badge shows a word, never just a colour. The row badge explains why a
// requirement got its status; the per-version badge explains one stored record.
// ---------------------------------------------------------------------------

/** The badge word for a finding, from the evaluator's reason code. */
function findingBadge(finding: Finding): BadgeStatus | null {
  switch ((finding as EligibilityFinding).reasonCode) {
    case 'UNCONFIRMED_AI':
      return 'AI-suggested';
    case 'STALE':
      return 'Stale';
    case 'CONFLICT':
      return 'Conflict';
    case 'SUPPORTED':
      return 'Confirmed by you';
    case 'UNVERIFIED':
      return 'Unverified';
    default:
      return null;
  }
}

/** The badge word for one stored evidence version. */
function recordBadge(record: EvidenceRecord | undefined, fallbackOrigin: string, fallbackTrust: string): BadgeStatus {
  // The stored version wins; the fallback covers evidence described by the
  // decision but no longer in this snapshot.
  if (record) return evidenceBadge(record);

  if (fallbackOrigin === 'student_confirmed') return 'Confirmed by you';
  if (fallbackOrigin === 'ai_generated') return 'AI-suggested';
  if (fallbackTrust === 'verified') return 'Verified source';
  return 'Unverified';
}

/** The one action that clears a "Missing info" reason, or null when there is none. */
function missingInfoAction(reasonCode: string | undefined): 'confirm' | 'refresh' | 'resolve' | null {
  if (reasonCode === 'UNCONFIRMED_AI') return 'confirm';
  if (reasonCode === 'STALE') return 'refresh';
  if (reasonCode === 'CONFLICT') return 'resolve';
  return null;
}

/** Turns an enum-style word into something readable: student_confirmed -> student confirmed. */
function readableWord(value: string): string {
  return value.replace(/_/g, ' ');
}

export default function ResultPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [result, setResult] = useState<any>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [profile, setProfile] = useState<StudentProfile>(SAMPLE_STUDENT_PROFILE);
  const [isProfileMissing, setIsProfileMissing] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [activeFixValues, setActiveFixValues] = useState<{ [key: string]: string }>({});
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    plan: 'free',
    used: 3,
    limit: 5,
    remaining: 2,
    isUnlimited: false,
    isExceeded: false
  });
  const [hasAgentAccess, setHasAgentAccess] = useState(false);
  // "How this score is calculated" explainer visibility
  const [showScoreFormula, setShowScoreFormula] = useState(false);
  // What-if simulator: requirement ids the student assumed they will fix (never saved)
  const [assumedFixes, setAssumedFixes] = useState<string[]>([]);

  // Every stored version the current decision was computed from, so the "Why?"
  // drawer can show the origin, trust, source and time of each one.
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>([]);
  // requirementId of the row whose "Why?" drawer is open (one at a time).
  const [openWhyId, setOpenWhyId] = useState<string | null>(null);

  // The live inputs for a recompute, kept in refs so a store change always
  // reads the newest checklist and profile instead of a stale closure.
  const checklistRef = useRef<Checklist | null>(null);
  const profileRef = useRef<StudentProfile>(SAMPLE_STUDENT_PROFILE);

  /**
   * Recomputes the decision from the stored evidence. This is the only way the
   * result is produced: no verdict is ever read back from storage.
   */
  const recompute = useCallback(
    async (nextChecklist?: Checklist, nextProfile?: StudentProfile) => {
      const activeChecklist = nextChecklist ?? checklistRef.current;
      const activeProfile = nextProfile ?? profileRef.current;
      if (!activeChecklist) return;

      if (nextChecklist) checklistRef.current = nextChecklist;
      if (nextProfile) profileRef.current = nextProfile;

      try {
        const { decision, records } = await evaluateFromStore(
          getEvidenceStore(),
          activeChecklist,
          activeProfile
        );
        setEvidenceRecords(records);
        setResult(toEvaluationResult(decision, activeChecklist, SAMPLE_OPPORTUNITY_TEXT));
      } catch (err) {
        // IndexedDB unavailable (private mode, blocked storage): fall back to
        // the same pure rule engine so the flow still works with no backend.
        console.warn('[Evidence] live evaluation failed, using the rule engine directly:', err);
        setResult(
          evaluateProfileAgainstOpportunity(
            activeChecklist.requirements,
            activeProfile,
            activeChecklist.title || 'Opportunity Eligibility Checklist',
            SAMPLE_OPPORTUNITY_TEXT
          )
        );
      }
    },
    []
  );

  // Part 30: friendly, non-blocking Premium hints. They never replace a result.
  const [nudgesEnabled, setNudgesEnabled] = useState(false);
  const [gapNudgeAt, setGapNudgeAt] = useState<number | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // Show a nudge after a gap is closed, or once the free limit is reached.
  // Never while a paid plan is active, and never once dismissed.
  const activeNudge: 'gap' | 'limit' | null =
    !nudgesEnabled || nudgeDismissed || hasAgentAccess
      ? null
      : gapNudgeAt !== null
      ? 'gap'
      : usageStats.isExceeded
      ? 'limit'
      : null;

  // 1. Initial Load: profile and checklist, then the first live evaluation.
  //
  // Whatever is already on this device is recorded as evidence versions first
  // (the one-time migration also runs here), and the decision is recomputed
  // from those records. After that, every change the evidence store reports
  // recomputes the result again, so it is always live and never a stored verdict.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const profileExists = hasStoredProfile();
      const loadedProfile = getStoredProfile();

      let loadedChecklist = getStoredChecklist();
      if (!loadedChecklist || !loadedChecklist.requirements || loadedChecklist.requirements.length === 0) {
        loadedChecklist = SAMPLE_CHECKLIST;
      }

      checklistRef.current = loadedChecklist;
      profileRef.current = loadedProfile;
      setProfile(loadedProfile);
      setChecklist(loadedChecklist);
      setIsProfileMissing(
        !profileExists && (!loadedProfile || !loadedProfile.name || loadedProfile.name === 'Student')
      );

      // Seed the store from this device, then evaluate from what is stored.
      try {
        await syncAllEvidence(getEvidenceStore(), loadedChecklist, loadedProfile);
      } catch (err) {
        console.warn('[Evidence] seed write failed:', err);
      }
      if (!cancelled) await recompute(loadedChecklist, loadedProfile);
    };

    void load();

    // Live updates: an inline fix, a profile edit or an agent confirmation
    // writes a new evidence version, and the result recomputes.
    const unsubscribe = getEvidenceStore().subscribe(() => {
      void recompute();
    });

    const updatePlanState = () => {
      setUsageStats(getUsageStats());
      setHasAgentAccess(canAccessAgentFeatures());
    };
    updatePlanState();
    setNudgesEnabled(getFeatureFlags().ENABLE_UPGRADE_NUDGES);

    window.addEventListener('opportunitykit_plan_changed', updatePlanState);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('opportunitykit_plan_changed', updatePlanState);
    };
  }, [recompute]);

  // 2. Profile Setup Handlers
  const handleLoadSampleProfile = () => {
    setProfile(SAMPLE_STUDENT_PROFILE);
    profileRef.current = SAMPLE_STUDENT_PROFILE;
    saveStoredProfile(SAMPLE_STUDENT_PROFILE);
    setIsProfileMissing(false);

    // Record the sample facts as new evidence versions; the store change
    // recomputes the result live.
    syncProfileEvidence(getEvidenceStore(), SAMPLE_STUDENT_PROFILE)
      .catch((err) => console.warn('[Evidence] sample profile write failed:', err))
      .finally(() => void recompute());

    setInlineNotice(t('result.notices.loadedSample'));
    setTimeout(() => setInlineNotice(null), 3500);
  };

  // 3. Inline Fix Handler for "Missing info" rows
  // Updates profile in state and storage, re-runs rule engine instantly without reload!
  const handleApplyInlineFix = (finding: Finding, fixKind: string, overrideVal?: any) => {
    const rawInputVal = overrideVal !== undefined ? overrideVal : (activeFixValues[finding.requirementId] || '').trim();

    let updatedProfile = { ...profile };

    switch (finding.category || fixKind) {
      case 'links': {
        const urlVal = String(rawInputVal);
        if (!urlVal) return;

        let formattedUrl = urlVal;
        if (!/^https?:\/\//i.test(formattedUrl)) {
          formattedUrl = `https://${formattedUrl}`;
        }

        const isGitHub = finding.requirementId.includes('github') || /github/i.test(finding.title || '');
        const isPortfolio = finding.requirementId.includes('portfolio') || /portfolio/i.test(finding.title || '');

        const currentLinks = { ...(updatedProfile.links || { github: '', linkedin: '', instagram: '', portfolio: '' }) };

        if (isGitHub && !isPortfolio) {
          currentLinks.github = formattedUrl;
          updatedProfile.githubUrl = formattedUrl;
        } else if (isPortfolio && !isGitHub) {
          currentLinks.portfolio = formattedUrl;
          updatedProfile.portfolioUrl = formattedUrl;
        } else {
          // portfolioOrGithub requirement: if user entered github, save to github; else portfolio
          if (/github\.com/i.test(formattedUrl)) {
            currentLinks.github = formattedUrl;
            updatedProfile.githubUrl = formattedUrl;
          } else {
            currentLinks.portfolio = formattedUrl;
            updatedProfile.portfolioUrl = formattedUrl;
          }
        }

        updatedProfile.links = currentLinks;
        break;
      }

      case 'documents': {
        const docType = finding.requirementId.replace(/^req-doc-|^req-/, '') || 'resume';
        const currentDocs = [...(updatedProfile.documents || [])];

        if (!currentDocs.some((d) => d.type.toLowerCase() === docType.toLowerCase())) {
          currentDocs.push({
            id: `doc-${Date.now()}`,
            name: `${docType.charAt(0).toUpperCase() + docType.slice(1)}.pdf`,
            type: docType,
            verified: true
          });
        }

        updatedProfile.documents = currentDocs;
        if (docType === 'resume') {
          updatedProfile.hasResume = true;
          updatedProfile.resumeUrl = updatedProfile.resumeUrl || 'https://storage.example.com/resumes/my-resume.pdf';
        }
        break;
      }

      case 'availability': {
        const weeksNum = parseInt(rawInputVal, 10);
        if (isNaN(weeksNum) || weeksNum <= 0) return;
        updatedProfile.availabilityWeeks = weeksNum;
        break;
      }

      case 'education': {
        const yearNum = parseInt(rawInputVal, 10);
        if (isNaN(yearNum) || yearNum <= 0) return;
        updatedProfile.year = yearNum;
        updatedProfile.yearOfStudy = yearNum;
        break;
      }

      case 'academic': {
        const cgpaNum = parseFloat(rawInputVal);
        if (isNaN(cgpaNum) || cgpaNum <= 0) return;
        updatedProfile.cgpa = cgpaNum;
        break;
      }

      case 'skills': {
        const skillToAdd = String(rawInputVal).trim();
        if (!skillToAdd) return;
        const currentSkills = [...(updatedProfile.skills || [])];
        if (!currentSkills.some((s) => s.toLowerCase() === skillToAdd.toLowerCase())) {
          currentSkills.push(skillToAdd);
        }
        updatedProfile.skills = currentSkills;
        break;
      }

      default: {
        // Generic fallback or income/custom
        if (/income/i.test(finding.title || finding.requirementId)) {
          const incNum = parseFloat(rawInputVal.replace(/,/g, '')) || 450000;
          (updatedProfile as any).annualIncome = incNum;
        } else {
          // Add as custom document note
          const currentDocs = [...(updatedProfile.documents || [])];
          currentDocs.push({
            id: `custom-doc-${Date.now()}`,
            name: `${finding.title || 'Evidence'}.pdf`,
            type: finding.requirementId,
            verified: true
          });
          updatedProfile.documents = currentDocs;
        }
        break;
      }
    }

    // Persist the updated profile locally, then record it as a new evidence
    // version. The store change recomputes the decision live, so nothing is
    // evaluated here and no verdict is stored.
    setProfile(updatedProfile);
    profileRef.current = updatedProfile;
    saveStoredProfile(updatedProfile);

    syncProfileEvidence(getEvidenceStore(), updatedProfile)
      .catch((err) => console.warn('[Evidence] inline fix write failed:', err))
      .finally(() => void recompute());

    // Clear fix input
    setActiveFixValues((prev) => ({ ...prev, [finding.requirementId]: '' }));

    setInlineNotice(t('result.notices.updatedProfile', { title: finding.title || finding.requirementId }));
    setTimeout(() => setInlineNotice(null), 3500);

    // A gap was just closed: offer a friendly, non-blocking Premium hint.
    // The recomputed result above stays exactly where it is.
    setGapNudgeAt(Date.now());
    setNudgeDismissed(false);
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    const md = generateMarkdownSummary(result);
    navigator.clipboard.writeText(md);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  // What-if simulator toggle. This ONLY updates local state; it never writes to
  // the real profile or storage, so the evaluated evidence stays untouched.
  const toggleAssumedFix = (requirementId: string) => {
    setAssumedFixes((prev) =>
      prev.includes(requirementId)
        ? prev.filter((id) => id !== requirementId)
        : [...prev, requirementId]
    );
  };

  /**
   * The one real action a "Missing info" row can offer, keyed by the reason the
   * requirement has no confirmed fact. It writes a new evidence version, which
   * recomputes the result live.
   */
  const runEvidenceAction = async (
    action: 'confirm' | 'refresh' | 'resolve',
    finding: Finding
  ) => {
    const evidenceId = actionableEvidenceId(
      finding as EligibilityFinding,
      indexRecords(evidenceRecords)
    );
    if (!evidenceId) return;

    try {
      const store = getEvidenceStore();
      if (action === 'confirm') await confirmEvidenceRecord(store, evidenceId);
      else if (action === 'refresh') await refreshEvidenceRecord(store, evidenceId);
      else await resolveConflictingEvidence(store, evidenceId);

      setInlineNotice(t('result.notices.updatedProfile', { title: finding.title || finding.requirementId }));
      setTimeout(() => setInlineNotice(null), 3500);
    } catch (err) {
      console.warn('[Evidence] action failed:', err);
    } finally {
      void recompute();
    }
  };

  // Loading Skeleton State
  if (result === null) {
    return (
      <div className="space-y-6 pb-16">
        <div className="border-b border-[#111111] pb-6">
          <SectionTitle
            tag={t('result.loading.tag')}
            title={t('result.loading.title')}
            subtitle={t('result.loading.subtitle')}
          />
        </div>
        <SummarySkeleton />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  // If no findings or empty checklist
  const findings: Finding[] = (result as any)?.findings || result?.checklist || [];
  if (findings.length === 0) {
    return (
      <div className="py-12 max-w-xl mx-auto space-y-6">
        <FailureAlert
          type="empty_paste"
          message={t('result.empty.message')}
          actionLabel={t('result.empty.action')}
          onAction={() => router.push('/check')}
        />
        <div className="text-center">
          <Link href="/check">
            <Button variant="solid" size="md">
              {t('result.empty.cta')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Rule-based Readiness Score, What-if simulator, prioritised steps, best-fit project ---
  const requirements: Requirement[] = checklist?.requirements || SAMPLE_CHECKLIST.requirements;
  const scoreData = computeReadinessScore(requirements, findings);
  const whatIf = simulateWhatIf(requirements, profile, assumedFixes);
  const prioritisedSteps = buildPrioritisedNextSteps(requirements, findings);
  const projectFit = bestFitProject(requirements, profile);

  // Lookup maps so each rendered step can be localised without re-scanning.
  const findingByRequirementId = new Map(findings.map((f) => [f.requirementId, f]));
  const requirementById = new Map(requirements.map((r) => [r.id, r]));

  // Every stored version the decision was computed from, keyed by
  // `evidenceId@version`, so the "Why?" drawer can show its origin, trust,
  // source and time.
  const recordIndex = indexRecords(evidenceRecords);

  const counts = (result as any).counts || {
    matches: result.summary?.matches || 0,
    mismatches: result.summary?.mismatches || 0,
    missingInfo: result.summary?.missingInfo || 0,
    total: result.summary?.totalRequirements || findings.length
  };

  // When the What-if simulator is active the headline, counts and score show the
  // simulated numbers (clearly labelled below as "What-if, not saved").
  const isWhatIfActive = assumedFixes.length > 0;
  const shownCounts = isWhatIfActive
    ? whatIf.counts
    : {
        matches: counts.matches || 0,
        mismatches: counts.mismatches || 0,
        missingInfo: counts.missingInfo || 0
      };
  const matches = shownCounts.matches || 0;
  const mismatches = shownCounts.mismatches || 0;
  const missingInfo = shownCounts.missingInfo || 0;
  const total = matches + mismatches + missingInfo || 1;

  const shownScore = isWhatIfActive ? whatIf.score.score : scoreData.score;
  const shownLabel = isWhatIfActive ? whatIf.readiness : scoreData.label;

  // SummaryBar string: "3 Match · 1 Mismatch · 2 Missing info → Not ready to apply yet"
  const verdictText =
    shownLabel === 'Ready to apply'
      ? t('result.verdict.ready')
      : shownLabel === 'Almost ready'
      ? t('result.verdict.almost')
      : t('result.verdict.notReady');

  const summaryHeadline = t('result.summaryHeadline', {
    matchCount: matches,
    matchLabel: statusLabel(t, 'Match'),
    mismatchCount: mismatches,
    mismatchLabel: statusLabel(t, 'Mismatch'),
    missingCount: missingInfo,
    missingLabel: statusLabel(t, 'Missing info'),
    verdict: verdictText
  });

  const matchPct = (matches / total) * 100;
  const mismatchPct = (mismatches / total) * 100;
  const missingPct = (missingInfo / total) * 100;

  // --- Export & tracker wiring (always uses the SAVED result, never what-if) ---
  const opportunityDeadline = findOpportunityDeadline(requirements);

  const plainNextSteps = prioritisedSteps.map((step) => `${step.title}: ${step.action}`);

  const trackerDraft = buildTrackerDraft({
    result,
    checklist,
    score: scoreData.score,
    label: scoreData.label,
    counts: {
      matches: counts.matches || 0,
      mismatches: counts.mismatches || 0,
      missingInfo: counts.missingInfo || 0,
      total: findings.length
    },
    nextSteps: plainNextSteps
  });

  const handleDownloadChecklistPdf = () => {
    try {
      downloadChecklistPdf({
        opportunityTitle: result.opportunityTitle || checklist?.title || 'Opportunity',
        timestamp: result.timestamp,
        rows: findings.map((f) => ({
          title: f.title || f.requirementId,
          expected: f.expected || '—',
          studentValue: f.studentValue || 'Not provided',
          status: f.status,
          reason: f.reason || ''
        })),
        nextSteps: plainNextSteps,
        score: scoreData.score,
        label: scoreData.label,
        counts: {
          matches: counts.matches || 0,
          mismatches: counts.mismatches || 0,
          missingInfo: counts.missingInfo || 0
        }
      });
      setInlineNotice(t('result.notices.pdfDownloaded'));
      setTimeout(() => setInlineNotice(null), 3500);
    } catch (err) {
      console.warn('[Export] PDF failed:', err);
      setInlineNotice(t('result.notices.pdfFailed'));
      setTimeout(() => setInlineNotice(null), 4000);
    }
  };

  const handleAddToCalendar = () => {
    if (!opportunityDeadline) {
      setInlineNotice(t('result.notices.noDeadline'));
      setTimeout(() => setInlineNotice(null), 4000);
      return;
    }
    try {
      downloadDeadlineIcs({
        title: result.opportunityTitle || checklist?.title || 'Opportunity',
        deadline: opportunityDeadline,
        description: `OpportunityKit deadline reminder. Readiness ${scoreData.score}% (${scoreData.label}).`,
        url: trackerDraft.sourceUrl || undefined
      });
      setInlineNotice(t('result.notices.calendarDownloaded'));
      setTimeout(() => setInlineNotice(null), 3500);
    } catch (err) {
      console.warn('[Export] Calendar failed:', err);
      setInlineNotice(t('result.notices.calendarFailed'));
      setTimeout(() => setInlineNotice(null), 4000);
    }
  };

  const handleShareResult = async () => {
    try {
      const { snapshot } = await createShareLink({
        opportunityTitle: result.opportunityTitle || checklist?.title || 'Opportunity',
        opportunityType: checklist?.opportunityType,
        sourceUrl: trackerDraft.sourceUrl,
        sourceLabel: trackerDraft.source,
        readinessScore: scoreData.score,
        readinessLabel: scoreData.label,
        counts: {
          matches: counts.matches || 0,
          mismatches: counts.mismatches || 0,
          missingInfo: counts.missingInfo || 0
        },
        findings: findings.map((f) => ({
          requirementId: f.requirementId,
          title: f.title || f.requirementId,
          status: f.status,
          reason: f.reason || ''
        })),
        nextSteps: plainNextSteps
      });

      const link = shareUrl(snapshot.id);
      try {
        await navigator.clipboard.writeText(link);
        setInlineNotice(t('result.notices.linkCopied'));
      } catch {
        setInlineNotice(t('result.notices.linkCreated', { link }));
      }
      setTimeout(() => setInlineNotice(null), 6000);
    } catch (err) {
      console.warn('[Share] Failed:', err);
      setInlineNotice(t('result.notices.linkFailed'));
      setTimeout(() => setInlineNotice(null), 4000);
    }
  };

  const handleExportData = () => {
    downloadJson(`opportunitykit-export-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      profile,
      tracker: [trackerDraft]
    });
    setInlineNotice(t('result.notices.exported'));
    setTimeout(() => setInlineNotice(null), 3500);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <SectionTitle
            tag={t('result.header.tag')}
            title={t('result.header.title')}
            subtitle={t('result.header.subtitle')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/check">
            <Button variant="outline" size="sm">
              {t('result.action.editChecklist')}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
            {copiedNotice ? t('result.action.copiedMarkdown') : t('result.action.copySummary')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadChecklistPdf}>
            {t('result.action.preparePdf')}
          </Button>
          <Button variant="outline" size="sm" onClick={triggerPrintPdf}>
            {t('result.action.printPdf')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCalendar}
            title={
              opportunityDeadline
                ? t('result.deadlineTooltip', { deadline: opportunityDeadline })
                : t('result.noDeadlineTooltip')
            }
          >
            {t('result.action.addToCalendar')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareResult}>
            {t('result.action.shareReadonly')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            {t('result.action.exportJson')}
          </Button>
          <SaveToTrackerButton draft={trackerDraft} size="sm" />
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {inlineNotice && (
        <div className="p-3 border border-[#2F7D5B] bg-[#2F7D5B]/10 text-[#2F7D5B] text-xs font-mono font-bold flex items-center justify-between">
          <span>✓ {inlineNotice}</span>
          <button onClick={() => setInlineNotice(null)} className="underline text-xs">
            {t('result.action.dismiss')}
          </button>
        </div>
      )}

      {/* Friendly, non-blocking Premium hint (never hides a shown result) */}
      {activeNudge && (
        <UpgradeNudge
          variant={activeNudge}
          limit={usageStats.limit}
          onDismiss={() => setNudgeDismissed(true)}
        />
      )}

      {/* Friendly Prompt: Missing Profile */}
      {isProfileMissing && (
        <FailureAlert
          type="missing_profile"
          message={t('result.missingProfile.message')}
          actionLabel={t('result.missingProfile.action')}
          onAction={handleLoadSampleProfile}
        />
      )}

      {/* Friendly Usage Counter & Upgrade Notice (Never a hard block) */}
      <div className="p-3.5 border border-[#111111] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F7D5B] animate-pulse" />
          <span className="font-bold text-[#111111]">
            {usageStats.isUnlimited
              ? t('result.usage.planUnlimited', { plan: usageStats.plan.toUpperCase() })
              : t('result.usage.freeUsed', { used: usageStats.used, limit: usageStats.limit })}
          </span>
          {!usageStats.isUnlimited && (
            <span className="text-[#111111]/70 hidden md:inline">
              {t('result.usage.remaining', { remaining: usageStats.remaining })}
            </span>
          )}
        </div>

        {!usageStats.isUnlimited ? (
          <Link href="/pricing" className="shrink-0">
            <span className="font-bold underline hover:text-[#2F7D5B]">
              {t('result.usage.upgrade')}
            </span>
          </Link>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#2F7D5B] text-white">
            {t('result.usage.unlimitedActive')}
          </span>
        )}
      </div>

      {/* ==================================================================== */}
      {/* SUMMARY BAR AT TOP */}
      {/* Format: ("3 Match · 1 Mismatch · 2 Missing info → Not ready to apply yet") */}
      {/* ==================================================================== */}
      <Card variant="cream" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#111111]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
              {t('result.verdictLabel')}
            </span>
            <h2 className="font-headline text-xl sm:text-2xl uppercase tracking-tight text-[#111111] mt-0.5" id="summary-bar-text">
              {summaryHeadline}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              status={
                shownLabel === 'Ready to apply'
                  ? 'Match'
                  : shownLabel === 'Almost ready'
                  ? 'Missing info'
                  : 'Mismatch'
              }
              size="md"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* READINESS SCORE (0-100%) + visible rule-based formula          */}
        {/* ============================================================ */}
        <div className="mt-5 p-4 border border-[#111111] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="font-headline text-5xl sm:text-6xl leading-none text-[#111111]"
              aria-label={t('result.a11y.score', { score: shownScore })}
            >
              {shownScore}%
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#111111]/70 block">
                {t('result.readinessScoreLabel')}
              </span>
              <span className="font-headline text-lg uppercase tracking-tight text-[#111111] block">
                {statusLabel(t, shownLabel)}
              </span>
              {isWhatIfActive && (
                <span className="text-[10px] font-mono font-bold uppercase text-[#D98A1F]">
                  {t('result.whatIfNotSavedActual', { score: scoreData.score })}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowScoreFormula((prev) => !prev)}
            className="self-start sm:self-center text-xs font-mono font-bold underline text-[#111111] hover:text-[#2F7D5B] shrink-0"
            aria-expanded={showScoreFormula}
          >
            {showScoreFormula ? t('result.hide') : t('result.showFormula')}
          </button>
        </div>

        {/* Formula + per-row points breakdown */}
        {showScoreFormula && (
          <div className="mt-3 border border-[#111111] bg-[#F1EEE6] p-4 space-y-3">
            <p className="text-xs font-mono text-[#111111] leading-relaxed">
              <span className="font-bold uppercase">{t('result.formulaLabel')}</span>
              {scoreData.formula}
            </p>
            <div className="overflow-x-auto border border-[#111111] bg-white">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#111111] bg-[#F1EEE6] font-bold uppercase tracking-wider">
                    <th className="p-2 border-r border-[#111111]">{t('result.scoreTable.requirement')}</th>
                    <th className="p-2 border-r border-[#111111]">{t('result.scoreTable.weight')}</th>
                    <th className="p-2 border-r border-[#111111]">{t('result.scoreTable.status')}</th>
                    <th className="p-2 text-right">{t('result.scoreTable.points')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/30">
                  {scoreData.rows.map((row) => (
                    <tr key={row.requirementId}>
                      <td className="p-2 border-r border-[#111111]/30">{row.title}</td>
                      <td className="p-2 border-r border-[#111111]/30">
                        {row.required ? t('result.scoreTable.required') : t('result.scoreTable.optional')} (
                        {row.weight})
                      </td>
                      <td className="p-2 border-r border-[#111111]/30">
                        {statusLabel(t, row.status)} ({row.factor})
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        {row.points} / {row.maxPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#111111] font-bold">
                    <td className="p-2 border-r border-[#111111]/30" colSpan={3}>
                      {t('result.scoreTable.total')}
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">
                      {scoreData.earnedPoints} / {scoreData.totalPoints} = {scoreData.score}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* What-if simulator banner (never saved) */}
        {isWhatIfActive && (
          <div className="mt-3 p-3 border border-[#D98A1F] bg-[#D98A1F]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D98A1F] block">
                {t('result.whatIf.banner')}
              </span>
              <p className="text-sm font-mono font-bold text-[#111111]">
                {whatIf.headline} —{' '}
                {t('result.whatIf.counts', {
                  matchCount: whatIf.counts.matches,
                  matchLabel: statusLabel(t, 'Match'),
                  mismatchCount: whatIf.counts.mismatches,
                  mismatchLabel: statusLabel(t, 'Mismatch'),
                  missingCount: whatIf.counts.missingInfo,
                  missingLabel: statusLabel(t, 'Missing info'),
                  score: whatIf.score.score
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAssumedFixes([])}
              className="self-start sm:self-center text-xs font-mono font-bold underline text-[#111111] hover:text-[#D98A1F] shrink-0"
            >
              {t('result.whatIf.clear')}
            </button>
          </div>
        )}

        {/* Breakdown Metric Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 my-5">
          <div className="border border-[#111111] bg-white p-3 sm:p-4 text-center">
            <span className="font-headline text-2xl sm:text-4xl text-[#2F7D5B] block leading-none">
              {matches}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2F7D5B] block mt-1.5">
              {statusLabel(t, 'Match')}
            </span>
          </div>

          <div className="border border-[#111111] bg-white p-3 sm:p-4 text-center">
            <span className="font-headline text-2xl sm:text-4xl text-[#C0453A] block leading-none">
              {mismatches}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C0453A] block mt-1.5">
              {statusLabel(t, 'Mismatch')}
            </span>
          </div>

          <div className="border border-[#111111] bg-white p-3 sm:p-4 text-center">
            <span className="font-headline text-2xl sm:text-4xl text-[#D98A1F] block leading-none">
              {missingInfo}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#D98A1F] block mt-1.5">
              {statusLabel(t, 'Missing info')}
            </span>
          </div>
        </div>

        {/* Proportional Segmented Progress Bar */}
        <div className="space-y-1.5">
          <div
            className="w-full h-4 sm:h-5 border border-[#111111] bg-[#111111]/10 flex overflow-hidden p-0.5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={matches}
            aria-label={t('result.a11y.progress', {
              matchCount: matches,
              matchLabel: statusLabel(t, 'Match'),
              mismatchCount: mismatches,
              mismatchLabel: statusLabel(t, 'Mismatch'),
              missingCount: missingInfo,
              missingLabel: statusLabel(t, 'Missing info')
            })}
          >
            {matches > 0 && (
              <div
                style={{ width: `${matchPct}%` }}
                className="h-full bg-[#2F7D5B] border-r border-[#111111] last:border-r-0 transition-all duration-300"
                title={t('result.segmentTitle', {
                  count: matches,
                  label: statusLabel(t, 'Match'),
                  percent: Math.round(matchPct)
                })}
              />
            )}
            {mismatches > 0 && (
              <div
                style={{ width: `${mismatchPct}%` }}
                className="h-full bg-[#C0453A] border-r border-[#111111] last:border-r-0 transition-all duration-300"
                title={t('result.segmentTitle', {
                  count: mismatches,
                  label: statusLabel(t, 'Mismatch'),
                  percent: Math.round(mismatchPct)
                })}
              />
            )}
            {missingInfo > 0 && (
              <div
                style={{ width: `${missingPct}%` }}
                className="h-full bg-[#D98A1F] transition-all duration-300"
                title={t('result.segmentTitle', {
                  count: missingInfo,
                  label: statusLabel(t, 'Missing info'),
                  percent: Math.round(missingPct)
                })}
              />
            )}
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono uppercase text-[#111111]/70">
            <span>0%</span>
            <span>{t('result.totalCriteria', { total })}</span>
            <span>100%</span>
          </div>
        </div>
      </Card>

      {/* ==================================================================== */}
      {/* AUDIT TABLE: Requirement | Opportunity Asks | Your Profile | Status Badge | Reason & Rule */}
      {/* Missing info rows have inline fix field that updates status instantly without reload! */}
      {/* ==================================================================== */}
      <Card variant="cream">
        <CardHeader>
          <CardTitle>{t('result.audit.title')}</CardTitle>
          <CardDescription>{t('result.audit.description')}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto border border-[#111111] bg-white">
            <table className="w-full border-collapse text-left font-body text-sm">
              <thead>
                <tr className="border-b-2 border-[#111111] bg-[#F1EEE6] text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                  <th scope="col" className="p-3.5 border-r border-[#111111]">
                    {t('result.audit.requirement')}
                  </th>
                  <th scope="col" className="p-3.5 border-r border-[#111111]">
                    {t('result.audit.asks')}
                  </th>
                  <th scope="col" className="p-3.5 border-r border-[#111111]">
                    {t('result.audit.profile')}
                  </th>
                  <th scope="col" className="p-3.5 border-r border-[#111111] text-center">
                    {t('result.audit.status')}
                  </th>
                  <th scope="col" className="p-3.5">
                    {t('result.audit.reason')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]">
                {findings.map((f, idx) => {
                  const isMissing = f.status === 'Missing info';

                  // Evidence traceability for this row: its badge comes from the
                  // evaluator's reason code, its drawer is built from the stored
                  // versions the decision was computed from, and Missing info rows
                  // offer the one action that clears the reason.
                  const eligibility = f as EligibilityFinding;
                  const rowKey = f.requirementId || String(idx);
                  const supporting = eligibility.supportingEvidence || [];
                  const excluded = eligibility.excludedEvidence || [];
                  const evidenceBadge = findingBadge(f);
                  const evidenceAction = missingInfoAction(eligibility.reasonCode);
                  const isWhyOpen = openWhyId === rowKey;

                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        className={`transition-colors ${
                          isMissing
                            ? 'bg-[#D98A1F]/5 hover:bg-[#D98A1F]/10'
                            : f.status === 'Mismatch'
                            ? 'bg-[#C0453A]/5 hover:bg-[#C0453A]/10'
                            : 'hover:bg-[#111111]/5'
                        }`}
                      >
                        {/* 1. Requirement */}
                        <td className="p-3.5 border-r border-[#111111] font-bold text-xs uppercase font-headline text-[#111111] align-top min-w-[150px]">
                          {f.title || f.requirementId}
                        </td>

                        {/* 2. Opportunity Asks */}
                        <td className="p-3.5 border-r border-[#111111] text-xs font-mono text-[#111111]/90 align-top min-w-[180px]">
                          {f.expected || t('result.audit.specifiedInChecklist')}
                        </td>

                        {/* 3. Your Profile */}
                        <td className="p-3.5 border-r border-[#111111] text-xs font-mono align-top min-w-[160px]">
                          {f.studentValue === 'Not provided' ? (
                            <span className="italic text-[#111111]/50">{t('common.notProvided')}</span>
                          ) : (
                            <span className="font-bold text-[#111111]">{f.studentValue}</span>
                          )}
                        </td>

                        {/* 4. Status Badge + evidence badge */}
                        <td className="p-3.5 border-r border-[#111111] align-top text-center shrink-0 min-w-[130px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <Badge status={f.status} size="sm" />
                            {evidenceBadge && <Badge status={evidenceBadge} size="sm" />}
                          </div>
                        </td>

                        {/* 5. One-line Reason with Rule Used */}
                        <td className="p-3.5 text-xs font-mono align-top min-w-[240px]">
                          <div className="space-y-1">
                            <p className="text-[#111111] font-medium leading-relaxed">
                              {localizeRuleReason(t, f).reason}
                            </p>
                            <span className="inline-block text-[10px] uppercase font-bold text-[#111111]/60 px-1.5 py-0.2 bg-[#F1EEE6] border border-[#111111]/20">
                              {t('result.audit.rulePrefix', { rule: f.ruleUsed })}
                            </span>

                            {/* Evidence action for Missing info rows that have a real fix */}
                            {evidenceAction && (
                              <div className="pt-1 flex flex-wrap items-center gap-2">
                                <Button
                                  variant="solid"
                                  size="sm"
                                  onClick={() => runEvidenceAction(evidenceAction, f)}
                                >
                                  {t(`result.why.actions.${evidenceAction}`)}
                                </Button>
                                <span className="text-[10px] font-body text-[#111111]/70">
                                  {t(`result.why.${evidenceAction}Hint`)}
                                </span>
                              </div>
                            )}

                            {/* "Why?" drawer toggle */}
                            <button
                              type="button"
                              aria-expanded={isWhyOpen}
                              aria-controls={`why-${rowKey}`}
                              onClick={() => setOpenWhyId(isWhyOpen ? null : rowKey)}
                              className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wide border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] px-2 py-0.5 transition-colors"
                            >
                              {isWhyOpen ? t('result.why.close') : t('result.why.open')}
                            </button>

                            {/* What-if toggle: local only, never saved to the profile */}
                            {f.status !== 'Match' && (
                              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={assumedFixes.includes(f.requirementId)}
                                  onChange={() => toggleAssumedFix(f.requirementId)}
                                  className="h-3.5 w-3.5 accent-[#111111]"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wide text-[#111111]">
                                  {t('result.audit.assumeFix')}
                                </span>
                                <span className="text-[9px] font-bold uppercase text-[#D98A1F]">
                                  {t('result.audit.whatIfNotSaved')}
                                </span>
                              </label>
                            )}

                            {/* Skill Mismatch: "Learn this" links and typical hours */}
                            {(() => {
                              if (f.status !== 'Mismatch') return null;
                              const isSkill = f.category === 'skills' || f.requirementId === 'req-skills' || f.ruleUsed === 'listRule';
                              if (!isSkill) return null;
                              let missing = extractMissingSkills(f.reason);
                              if (missing.length === 0 && f.expected) {
                                missing = f.expected.split(',').map((s: string) => s.trim()).filter(Boolean);
                              }
                              const items = missing
                                .map((skillName) => ({ skillName, info: getLearningForSkill(skillName) }))
                                .filter((entry): entry is { skillName: string; info: NonNullable<ReturnType<typeof getLearningForSkill>> } => Boolean(entry.info));
                              if (items.length === 0) return null;

                              return (
                                <div className="pt-2 mt-1.5 border-t border-[#111111]/15 space-y-1.5">
                                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C0453A]">
                                    Gap Resources:
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {items.flatMap(({ skillName, info }) =>
                                      info.links.map((link, lIdx) => (
                                        <a
                                          key={`${skillName}-${lIdx}`}
                                          href={link.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold bg-[#F1EEE6] hover:bg-[#111111] hover:text-[#F1EEE6] text-[#111111] border border-[#111111] transition-colors"
                                          title={`${link.title} (Free tutorial)`}
                                        >
                                          <span>Learn this ({info.skill})</span>
                                          <span className="text-[10px] text-[#2F7D5B] font-mono font-bold">~{link.hours} hrs</span>
                                          <span className="text-[10px]">↗</span>
                                        </a>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>

                      {/* Inline Fix Row for "Missing info" */}
                      {isMissing && (
                        <tr className="bg-[#D98A1F]/10 border-b border-[#111111]">
                          <td colSpan={5} className="p-3 sm:px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#D98A1F] uppercase">
                                  {t('result.audit.quickFix')}
                                </span>
                                <span className="text-xs font-body text-[#111111]">
                                  {localizeRuleReason(t, f).nextStep || t('result.audit.defaultNextStep')}
                                </span>
                              </div>

                              {/* Interactive Inline Fix Field */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Link fix */}
                                {f.category === 'links' && (
                                  <>
                                    <input
                                      type="text"
                                      placeholder={t('result.placeholder.link')}
                                      value={activeFixValues[f.requirementId] || ''}
                                      onChange={(e) =>
                                        setActiveFixValues({
                                          ...activeFixValues,
                                          [f.requirementId]: e.target.value
                                        })
                                      }
                                      className="px-2.5 py-1 text-xs border border-[#111111] bg-white font-mono min-w-[220px]"
                                    />
                                    <Button
                                      variant="solid"
                                      size="sm"
                                      onClick={() => handleApplyInlineFix(f, 'links')}
                                    >
                                      {t('result.fix.saveLink')}
                                    </Button>
                                  </>
                                )}

                                {/* Document fix */}
                                {f.category === 'documents' && (
                                  <Button
                                    variant="solid"
                                    size="sm"
                                    onClick={() => handleApplyInlineFix(f, 'documents')}
                                    >
                                      {t('result.fix.markDocumentReady')}
                                    </Button>
                                )}

                                {/* Availability fix */}
                                {f.category === 'availability' && (
                                  <>
                                    <input
                                      type="number"
                                      placeholder={t('result.placeholder.weeks')}
                                      value={activeFixValues[f.requirementId] || ''}
                                      onChange={(e) =>
                                        setActiveFixValues({
                                          ...activeFixValues,
                                          [f.requirementId]: e.target.value
                                        })
                                      }
                                      className="w-28 px-2.5 py-1 text-xs border border-[#111111] bg-white font-mono"
                                    />
                                    <Button
                                      variant="solid"
                                      size="sm"
                                      onClick={() => handleApplyInlineFix(f, 'availability')}
                                    >
                                      {t('result.fix.setWeeks')}
                                    </Button>
                                  </>
                                )}

                                {/* Education Year fix */}
                                {f.category === 'education' && (
                                  <>
                                    <select
                                      value={activeFixValues[f.requirementId] || '2'}
                                      onChange={(e) =>
                                        setActiveFixValues({
                                          ...activeFixValues,
                                          [f.requirementId]: e.target.value
                                        })
                                      }
                                      className="px-2 py-1 text-xs border border-[#111111] bg-white font-mono"
                                    >
                                      <option value="1">{t('result.yearOption.one')}</option>
                                      <option value="2">{t('result.yearOption.two')}</option>
                                      <option value="3">{t('result.yearOption.three')}</option>
                                      <option value="4">{t('result.yearOption.four')}</option>
                                    </select>
                                    <Button
                                      variant="solid"
                                      size="sm"
                                      onClick={() =>
                                        handleApplyInlineFix(
                                          f,
                                          'education',
                                          activeFixValues[f.requirementId] || '2'
                                        )
                                      }
                                    >
                                      {t('result.fix.setYear')}
                                    </Button>
                                  </>
                                )}

                                {/* Academic CGPA fix */}
                                {f.category === 'academic' && (
                                  <>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder={t('result.placeholder.cgpa')}
                                      value={activeFixValues[f.requirementId] || ''}
                                      onChange={(e) =>
                                        setActiveFixValues({
                                          ...activeFixValues,
                                          [f.requirementId]: e.target.value
                                        })
                                      }
                                      className="w-28 px-2.5 py-1 text-xs border border-[#111111] bg-white font-mono"
                                    />
                                    <Button
                                      variant="solid"
                                      size="sm"
                                      onClick={() => handleApplyInlineFix(f, 'academic')}
                                    >
                                      {t('result.fix.setCgpa')}
                                    </Button>
                                  </>
                                )}

                                {/* Other / General fix */}
                                {!['links', 'documents', 'availability', 'education', 'academic'].includes(
                                  f.category || ''
                                ) && (
                                  <>
                                    <input
                                      type="text"
                                      placeholder={t('result.placeholder.generic')}
                                      value={activeFixValues[f.requirementId] || ''}
                                      onChange={(e) =>
                                        setActiveFixValues({
                                          ...activeFixValues,
                                          [f.requirementId]: e.target.value
                                        })
                                      }
                                      className="px-2.5 py-1 text-xs border border-[#111111] bg-white font-mono min-w-[180px]"
                                    />
                                    <Button
                                      variant="solid"
                                      size="sm"
                                      onClick={() => handleApplyInlineFix(f, 'custom')}
                                    >
                                      {t('result.fix.update')}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* "Why?" drawer: the exact evidence versions behind this row */}
                      {isWhyOpen && (
                        <tr id={`why-${rowKey}`} className="bg-[#F1EEE6] border-b border-[#111111]">
                          <td colSpan={5} className="p-4 sm:px-6">
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#111111]/20">
                              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
                                {t('result.why.title')}
                              </span>
                              <button
                                type="button"
                                onClick={() => setOpenWhyId(null)}
                                className="text-[10px] uppercase font-bold border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] px-2 py-0.5 transition-colors"
                              >
                                {t('result.why.close')}
                              </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 pt-3">
                              {/* Supporting evidence: the confirmed facts that back the status */}
                              <div>
                                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2F7D5B]">
                                  {t('result.why.supporting')}
                                </div>
                                {supporting.length === 0 ? (
                                  <p className="mt-1.5 text-xs font-body text-[#111111]/60">
                                    {t('result.why.noSupporting')}
                                  </p>
                                ) : (
                                  <ul className="mt-1.5 space-y-2">
                                    {supporting.map((item) => {
                                      const record = recordIndex.get(versionRef(item));
                                      const source = record?.source;
                                      return (
                                        <li
                                          key={versionRef(item)}
                                          className="border border-[#111111]/25 bg-white p-2.5"
                                        >
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Badge status={recordBadge(record, item.origin, item.trust)} size="sm" />
                                            <span className="font-mono text-[10px] font-bold text-[#111111]">
                                              {t('result.why.evidenceId')}: {item.evidenceId}
                                            </span>
                                            <span className="font-mono text-[10px] text-[#111111]/70">
                                              {t('result.why.versionLabel', { version: item.version })}
                                            </span>
                                          </div>
                                          <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px] font-mono text-[#111111]/80">
                                            <dt className="font-bold uppercase">{t('result.why.originLabel')}</dt>
                                            <dd>{readableWord(record?.origin || item.origin)}</dd>
                                            <dt className="font-bold uppercase">{t('result.why.trustLabel')}</dt>
                                            <dd>{readableWord(record?.trust || item.trust)}</dd>
                                            <dt className="font-bold uppercase">{t('result.why.recordedLabel')}</dt>
                                            <dd>
                                              {record
                                                ? new Date(record.createdAt).toLocaleString()
                                                : t('result.why.noSource')}
                                            </dd>
                                          </dl>
                                          <div className="mt-1.5 text-[10px] font-mono">
                                            <span className="font-bold uppercase text-[#111111]/70">
                                              {t('result.why.sourceLabel')}:{' '}
                                            </span>
                                            {source?.url ? (
                                              <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline text-[#111111] break-all"
                                              >
                                                {source.url}
                                              </a>
                                            ) : source?.sentence ? (
                                              <span className="italic text-[#111111]">“{source.sentence}”</span>
                                            ) : (
                                              <span className="text-[#111111]/60">{t('result.why.noSource')}</span>
                                            )}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>

                              {/* Excluded evidence: everything that was left out, and why */}
                              <div>
                                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D98A1F]">
                                  {t('result.why.excluded')}
                                </div>
                                {excluded.length === 0 ? (
                                  <p className="mt-1.5 text-xs font-body text-[#111111]/60">
                                    {t('result.why.noExcluded')}
                                  </p>
                                ) : (
                                  <ul className="mt-1.5 space-y-2">
                                    {excluded.map((item) => {
                                      const record = recordIndex.get(versionRef(item));
                                      return (
                                        <li
                                          key={versionRef(item)}
                                          className="border border-[#111111]/25 bg-white p-2.5"
                                        >
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                              status={recordBadge(record, record?.origin || '', record?.trust || '')}
                                              size="sm"
                                            />
                                            <span className="font-mono text-[10px] font-bold text-[#111111]">
                                              {t('result.why.evidenceId')}: {item.evidenceId}
                                            </span>
                                            <span className="font-mono text-[10px] text-[#111111]/70">
                                              {t('result.why.versionLabel', { version: item.version })}
                                            </span>
                                          </div>
                                          <div className="mt-1.5 text-[10px] font-mono">
                                            <span className="font-bold uppercase text-[#111111]/70">
                                              {t('result.why.reasonLabel')}:{' '}
                                            </span>
                                            <span className="text-[#111111]">{item.why}</span>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </div>

                            {/* The one action that clears a Missing info reason */}
                            {evidenceAction && (
                              <div className="mt-3 pt-3 border-t border-[#111111]/20 flex flex-wrap items-center gap-2">
                                <Button
                                  variant="solid"
                                  size="sm"
                                  onClick={() => runEvidenceAction(evidenceAction, f)}
                                >
                                  {t(`result.why.actions.${evidenceAction}`)}
                                </Button>
                                <span className="text-[10px] font-body text-[#111111]/70">
                                  {t(`result.why.${evidenceAction}Hint`)}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ==================================================================== */}
      {/* BEST-FIT PROJECT HIGHLIGHT (ranked by tag/tech overlap with rules)   */}
      {/* ==================================================================== */}
      <Card variant="white">
        <CardHeader>
          <CardTitle>{t('result.project.title')}</CardTitle>
          <CardDescription>{projectFit.rule}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-[#111111] bg-[#F1EEE6]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#111111]/70 block">
              {t('result.project.lead')}
            </span>
            <p className="font-headline text-lg text-[#111111] mt-1">{projectFit.headline}</p>
            <p className="text-xs font-body text-[#111111]/80 mt-1">{projectFit.reason}</p>
          </div>

          {projectFit.ranked.length > 1 && (
            <ul className="mt-3 space-y-1.5 text-xs font-mono">
              {projectFit.ranked.map((p) => (
                <li
                  key={p.projectId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border border-[#111111]/25 bg-white px-2.5 py-1.5"
                >
                  <span className="font-bold text-[#111111]">{p.title}</span>
                  <span className="text-[#111111]/70">
                    {p.score === 1
                      ? t('result.project.matchOne', { score: p.score })
                      : t('result.project.matchMany', { score: p.score })}
                    {p.matchedTags.length > 0 ? ` (${p.matchedTags.join(', ')})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ==================================================================== */}
      {/* NEXT STEPS: ordered by quickest fix first, with effort estimates      */}
      {/* ==================================================================== */}
      <Card variant="white">
        <CardHeader>
          <CardTitle>{t('result.nextSteps.title')}</CardTitle>
          <CardDescription>{t('result.nextSteps.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {prioritisedSteps.length === 0 ? (
            <div className="p-4 border border-[#2F7D5B] bg-[#2F7D5B]/10 text-[#2F7D5B] font-mono text-sm font-bold flex items-center gap-2">
              <span>{t('result.nextSteps.allSatisfied')}</span>
            </div>
          ) : (
            <ol className="space-y-2.5 font-mono text-sm text-[#111111]">
              {prioritisedSteps.map((step) => {
                const finding = findingByRequirementId.get(step.requirementId);
                const req = requirementById.get(step.requirementId);
                const effortKey = req ? resolveEntryKey(req) : 'custom:generic';
                const effortAction =
                  effortKey === 'skills' && finding
                    ? t('result.effort.skills.action', {
                        skills: extractMissingSkills(finding.reason).join(', ')
                      })
                    : t(`result.effort.${effortKey}.action`);
                const effortEstimate = t(`result.effort.${effortKey}.estimate`);

                return (
                  <li
                    key={step.requirementId}
                    className="p-3 border border-[#111111] bg-[#F1EEE6] leading-relaxed flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold">
                        {t('result.nextSteps.stepLine', {
                          order: step.order,
                          status: statusLabel(t, step.status),
                          title: step.title,
                          action: effortAction
                        })}
                      </span>
                      {step.detail && finding && (
                        <p className="text-[11px] text-[#111111]/70 mt-0.5">
                          {localizeRuleReason(t, finding).nextStep}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-bold uppercase border border-[#111111] bg-white px-2 py-0.5 whitespace-nowrap"
                      title={t('result.nextSteps.estimatedEffort')}
                    >
                      {t('result.nextSteps.estimateSuffix', { estimate: effortEstimate })}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-[#111111]">
            <Link href="/profile">
              <Button variant="solid" size="md">
                {t('result.nextSteps.editProfile')}
              </Button>
            </Link>
            <Link href="/check">
              <Button variant="outline" size="md">
                {t('result.nextSteps.checkAnother')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ==================================================================== */}
      {/* 4. AGENT FEATURES & DEEP INSIGHTS (Gated by Plan) */}
      {/* ==================================================================== */}
      <Card variant={hasAgentAccess ? 'cream' : 'white'} className="border-2 border-[#111111]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75">
                {t('result.agents.eyebrow')}
              </span>
              {hasAgentAccess ? (
                <span className="text-[10px] font-mono font-bold bg-[#2F7D5B] text-white px-2 py-0.5 border border-[#111111]">
                  {t('result.agents.premiumUnlocked')}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold bg-[#111111] text-[#F1EEE6] px-2 py-0.5 border border-[#111111]">
                  {t('result.agents.studentFeature')}
                </span>
              )}
            </div>
            <CardTitle className="mt-1">{t('result.agents.title')}</CardTitle>
            <CardDescription>
              {hasAgentAccess
                ? t('result.agents.descriptionUnlocked')
                : t('result.agents.descriptionLocked')}
            </CardDescription>
          </div>

          {!hasAgentAccess && (
            <Link href="/pricing" className="shrink-0">
              <Button variant="solid" size="sm" id="unlock-agents-btn">
                {t('result.agents.upgrade')}
              </Button>
            </Link>
          )}
        </CardHeader>

        <CardContent>
          {hasAgentAccess ? (
            /* Unlocked Premium Modules */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AGENT_EVIDENCE_MODULES.map((module) => {
                  const trust = trustForSourceUrl(module.sourceUrl);
                  return (
                    <div key={module.titleKey} className="p-4 border border-[#111111] bg-white space-y-2">
                      <span className="text-xs font-mono font-bold uppercase text-[#2F7D5B] block">
                        ✓ {t(module.titleKey)}
                      </span>
                      <div className="text-xs font-mono space-y-1 text-[#111111]">
                        {module.rows.map((row) => (
                          <div key={row.labelKey}>
                            {t(row.labelKey)}: <span className="font-bold">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#111111]/70 pt-1 border-t border-[#111111]/10">
                        {t(module.noteKey)}
                      </p>

                      {/* Every researched fact shows its source link and trust badge. */}
                      <div className="pt-2 border-t border-[#111111]/15 space-y-1.5">
                        <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111]/60">
                          {t('result.agents.source')}
                        </span>
                        {module.sourceUrl ? (
                          <a
                            href={module.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[11px] font-mono underline break-all hover:opacity-80"
                          >
                            {module.sourceUrl}
                          </a>
                        ) : (
                          <span className="block text-[11px] font-mono text-[#111111]/60 italic">
                            {t('result.agents.noSource')}
                          </span>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <Badge status={trust} size="sm" />
                          <Badge status="AI-suggested" size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border border-[#2F7D5B] bg-[#2F7D5B]/10 text-xs font-mono text-[#111111]">
                <span className="font-bold uppercase text-[#2F7D5B]">{t('result.agents.invariantLabel')}</span>{' '}
                {t('result.agents.invariantBody')}
              </div>
            </div>
          ) : (
            /* Gated Free Tier Preview */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-dashed border-[#111111]/40 bg-[#F1EEE6]/50 space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                  {t('result.agents.preview.githubTitle')}
                </span>
                <p className="text-xs font-body text-[#111111]/80">
                  {t('result.agents.preview.githubDesc')}
                </p>
                <span className="text-[10px] font-mono font-bold text-[#D98A1F] block pt-1">
                  {t('result.agents.preview.available')}
                </span>
              </div>

              <div className="p-4 border border-dashed border-[#111111]/40 bg-[#F1EEE6]/50 space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                  {t('result.agents.preview.employerTitle')}
                </span>
                <p className="text-xs font-body text-[#111111]/80">
                  {t('result.agents.preview.employerDesc')}
                </p>
                <span className="text-[10px] font-mono font-bold text-[#D98A1F] block pt-1">
                  {t('result.agents.preview.available')}
                </span>
              </div>

              <div className="p-4 border border-dashed border-[#111111]/40 bg-[#F1EEE6]/50 space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                  {t('result.agents.preview.atsTitle')}
                </span>
                <p className="text-xs font-body text-[#111111]/80">
                  {t('result.agents.preview.atsDesc')}
                </p>
                <span className="text-[10px] font-mono font-bold text-[#D98A1F] block pt-1">
                  {t('result.agents.preview.available')}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
