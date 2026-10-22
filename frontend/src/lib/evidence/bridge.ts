import {
  contentHash,
  currentVersion,
  evaluate,
  isStale,
  profileEvidenceFromProfile,
  requirementEvidenceFromRequirements,
  versionRef,
  type Checklist,
  type Decision,
  type EligibilityFinding,
  type EvaluationResult,
  type EvaluationSummary,
  type EvidenceRecord,
  type Result,
  type StudentProfile,
  type AgentSuggestion
} from '@opportunity-kit/shared';
import type { EvidenceStore } from './repository';

// ============================================================================
// Bridge between the pages and the evidence store.
//
// Pages keep working with the familiar profile / checklist objects, but every
// save goes through the repository: the first write creates version 1, every
// later edit appends version n+1 of the same evidenceId. Nothing is ever
// overwritten, so the /evidence page can always show what changed and when.
//
// Reading is the other half: the live decision is recomputed from the stored
// evidence with the shared evaluator. A verdict is never read back from
// storage or kept as the source of truth.
// ============================================================================

export interface EvidenceWriteSummary {
  added: number;
  revised: number;
  unchanged: number;
}

const readyStores = new WeakMap<EvidenceStore, Promise<void>>();

/**
 * Opens the store and runs the one-time localStorage migration, at most once
 * per store instance. Every write goes through here first, so a page save can
 * never race the migration and duplicate a fact.
 */
export function ensureEvidenceStore(store: EvidenceStore): Promise<void> {
  let ready = readyStores.get(store);
  if (!ready) {
    ready = store
      .init()
      .then(() => undefined)
      .catch((err) => {
        console.warn('[Evidence] Could not open the local evidence store:', err);
      });
    readyStores.set(store, ready);
  }
  return ready;
}

/** Which facts are "nothing to record yet". Empty values are `false`-safe. */
function isBlank(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** The profile subject always uses the profile id, so ids stay stable. */
export function profileSubjectId(profile: Pick<StudentProfile, 'id'>): string {
  return profile.id || 'student';
}

/** The opportunity subject is keyed by the checklist title. */
export function opportunitySubjectId(checklist: Pick<Checklist, 'title'>): string {
  return checklist.title || 'opportunity';
}

/**
 * Writes the desired records, one append-only version per change.
 *
 * - no stored history yet  -> add version 1 (blank values are skipped)
 * - the content is the same -> nothing to do (a rejection also stays)
 * - the content changed     -> revise, which appends version n+1
 */
async function upsertRecords(
  store: EvidenceStore,
  desired: EvidenceRecord[]
): Promise<EvidenceWriteSummary> {
  const summary: EvidenceWriteSummary = { added: 0, revised: 0, unchanged: 0 };

  for (const record of desired) {
    const history = await store.getHistory(record.evidenceId);

    if (history.length === 0) {
      if (isBlank(record.value)) {
        summary.unchanged += 1;
        continue;
      }
      await store.add({
        evidenceId: record.evidenceId,
        subjectType: record.subjectType,
        subjectId: record.subjectId,
        kind: record.kind,
        key: record.key,
        value: record.value,
        origin: record.origin,
        trust: record.trust,
        source: record.source,
        observedAt: record.observedAt,
        validUntil: record.validUntil
      });
      summary.added += 1;
      continue;
    }

    const current = currentVersion(history);
    if (contentHash(current) === contentHash(record)) {
      summary.unchanged += 1;
      continue;
    }

    await store.revise(record.evidenceId, {
      origin: record.origin,
      trust: record.trust,
      kind: record.kind,
      key: record.key,
      value: record.value,
      source: record.source,
      observedAt: record.observedAt,
      validUntil: record.validUntil
    });
    summary.revised += 1;
  }

  return summary;
}

/** Profile form fields, project cards and links as student_confirmed evidence. */
export async function syncProfileEvidence(
  store: EvidenceStore,
  profile: StudentProfile,
  now: Date = new Date()
): Promise<EvidenceWriteSummary> {
  await ensureEvidenceStore(store);
  return upsertRecords(store, profileEvidenceFromProfile(profile, now));
}

/** The pasted, parsed checklist as user_provided requirement evidence. */
export async function syncChecklistEvidence(
  store: EvidenceStore,
  checklist: Checklist,
  now: Date = new Date()
): Promise<EvidenceWriteSummary> {
  await ensureEvidenceStore(store);
  const opportunityId = opportunitySubjectId(checklist);
  return upsertRecords(
    store,
    requirementEvidenceFromRequirements(checklist.requirements || [], opportunityId, now)
  );
}

/** Write any created records to the store. Both sides live in one call. */
export async function syncAllEvidence(
  store: EvidenceStore,
  checklist: Checklist,
  profile: StudentProfile,
  now: Date = new Date()
): Promise<EvidenceWriteSummary> {
  const requirements = await syncChecklistEvidence(store, checklist, now);
  const profileSummary = await syncProfileEvidence(store, profile, now);
  return {
    added: requirements.added + profileSummary.added,
    revised: requirements.revised + profileSummary.revised,
    unchanged: requirements.unchanged + profileSummary.unchanged
  };
}

export interface SubjectEvidence {
  decision: Decision;
  records: EvidenceRecord[];
}

/**
 * Recomputes the decision from the stored evidence for one checklist.
 * Pure read: it never writes, and never returns a cached verdict.
 */
export async function evaluateFromStore(
  store: EvidenceStore,
  checklist: Checklist,
  profile: StudentProfile,
  now: Date = new Date()
): Promise<SubjectEvidence> {
  await ensureEvidenceStore(store);

  const [requirementRecords, profileRecords] = await Promise.all([
    store.listBySubject(opportunitySubjectId(checklist)),
    store.listBySubject(profileSubjectId(profile))
  ]);

  return {
    decision: evaluate(requirementRecords, profileRecords, now),
    records: [...requirementRecords, ...profileRecords]
  };
}

/**
 * Shapes a fresh Decision like the older EvaluationResult + Result pair, so
 * every existing view (summary, exports, tracker draft) keeps working.
 */
export function toEvaluationResult(
  decision: Decision,
  checklist: Checklist,
  rawOpportunityText = '',
  agentEvidence: unknown[] = []
): EvaluationResult & Result {
  const overallVerdict =
    decision.counts.mismatches === 0 && decision.counts.missingInfo === 0 && decision.counts.matches > 0
      ? 'Ready to apply'
      : 'Not ready to apply yet';

  const headline =
    decision.readiness === 'Ready to apply'
      ? 'All requirements satisfied. You are ready to submit your application!'
      : `${decision.counts.matches} Match, ${decision.counts.mismatches} Mismatch, ${decision.counts.missingInfo} Missing info. Action required before applying.`;

  const summary: EvaluationSummary = {
    totalRequirements: decision.counts.total ?? decision.findings.length,
    matches: decision.counts.matches,
    mismatches: decision.counts.mismatches,
    missingInfo: decision.counts.missingInfo,
    overallVerdict,
    headline,
    actionPlan: decision.nextSteps
  };

  return {
    ...decision,
    opportunityTitle: checklist.title || 'Opportunity Eligibility Checklist',
    rawOpportunityText,
    timestamp: decision.evaluatedAt,
    summary,
    checklist: decision.findings,
    agentEvidence: agentEvidence as EvaluationResult['agentEvidence'],
    findings: decision.findings,
    counts: decision.counts,
    readiness: decision.readiness,
    nextSteps: decision.nextSteps
  };
}

/** Indexes records by `evidenceId@version` for the "Why?" drawer. */
export function indexRecords(records: EvidenceRecord[]): Map<string, EvidenceRecord> {
  const map = new Map<string, EvidenceRecord>();
  for (const record of records) map.set(versionRef(record), record);
  return map;
}

/** The badge words a stored version can carry. Every one shows a word, not a colour. */
export type EvidenceBadgeWord =
  | 'Confirmed by you'
  | 'AI-suggested'
  | 'Verified source'
  | 'Unverified'
  | 'Stale'
  | 'Conflict';

/**
 * How one stored evidence version stands right now. This is the single place
 * the rule lives, so the result drawer and the /evidence ledger never disagree.
 */
export function evidenceBadge(record: EvidenceRecord, now: Date = new Date()): EvidenceBadgeWord {
  if (record.status === 'conflicted') return 'Conflict';
  if (record.status === 'rejected' || record.status === 'superseded') return 'Unverified';
  if (isStale(record, now)) return 'Stale';
  if (record.origin === 'student_confirmed') return 'Confirmed by you';
  if (record.origin === 'ai_generated') return 'AI-suggested';
  if (record.trust === 'verified') return 'Verified source';
  return 'Unverified';
}

// ---------------------------------------------------------------------------
// Actions offered on a "Missing info" row, keyed by the evaluator's reason code
// ---------------------------------------------------------------------------

/** UNCONFIRMED_AI: the student adopts the AI suggestion as a confirmed fact. */
export async function confirmEvidenceRecord(
  store: EvidenceStore,
  evidenceId: string
): Promise<EvidenceRecord> {
  return store.confirm(evidenceId);
}

/** STALE: re-observe the same fact, which resets its freshness window. */
export async function refreshEvidenceRecord(
  store: EvidenceStore,
  evidenceId: string,
  now: Date = new Date()
): Promise<EvidenceRecord> {
  const history = await store.getHistory(evidenceId);
  const current = currentVersion(history);
  return store.revise(evidenceId, {
    origin: current.origin,
    trust: current.trust,
    value: current.value,
    source: current.source,
    observedAt: now.toISOString()
  });
}

/**
 * CONFLICT: pick the value that counts. A student-confirmed record is kept as
 * the student's own fact; anything else is adopted as student_confirmed. Both
 * paths append a new active version, which clears the conflict.
 */
export async function resolveConflictingEvidence(
  store: EvidenceStore,
  evidenceId: string
): Promise<EvidenceRecord> {
  const history = await store.getHistory(evidenceId);
  const current = currentVersion(history);

  if (current.origin === 'student_confirmed') {
    return store.revise(evidenceId, {
      origin: 'student_confirmed',
      trust: 'verified',
      value: current.value,
      source: current.source
    });
  }
  return store.confirm(evidenceId);
}

/**
 * The record a "Missing info" row can act on.
 *
 * Only the three reason codes with a real fix are offered: UNCONFIRMED_AI,
 * STALE and CONFLICT. The excluded evidence is matched against the same
 * classification the evaluator used, so the button can never point at a record
 * that is already a confirmed fact.
 */
export function actionableEvidenceId(
  finding: EligibilityFinding,
  records: Map<string, EvidenceRecord>,
  now: Date = new Date()
): string | undefined {
  if (finding.status !== 'Missing info') return undefined;

  const code = finding.reasonCode;
  if (code !== 'UNCONFIRMED_AI' && code !== 'STALE' && code !== 'CONFLICT') return undefined;

  for (const item of finding.excludedEvidence) {
    const record = records.get(versionRef(item));
    if (!record) continue;

    if (code === 'CONFLICT' && record.status === 'conflicted') return record.evidenceId;
    if (code === 'STALE' && isStale(record, now)) return record.evidenceId;
    if (
      code === 'UNCONFIRMED_AI' &&
      record.origin === 'ai_generated' &&
      record.status === 'active' &&
      !isStale(record, now)
    ) {
      return record.evidenceId;
    }
  }

  return undefined;
}

/**
 * Writes agent evidence drafts to the local store:
 * - If no history exists, writes version 1 as origin: 'ai_generated', status: 'active'.
 * - If history exists:
 *   - If the student has confirmed it, do NOT overwrite or revise.
 *   - If the record has been rejected (or previously rejected from the same source), suppress it.
 *   - If content changed, revise to version n+1.
 * - An agent must never write student_confirmed evidence.
 */
export async function syncAgentEvidence(
  store: EvidenceStore,
  drafts: EvidenceRecord[]
): Promise<EvidenceWriteSummary> {
  await ensureEvidenceStore(store);
  const summary: EvidenceWriteSummary = { added: 0, revised: 0, unchanged: 0 };

  for (const draft of drafts) {
    // Agents must never write student_confirmed evidence
    const safeDraft: EvidenceRecord = {
      ...draft,
      origin: draft.origin === 'student_confirmed' ? 'ai_generated' : draft.origin
    };

    const history = await store.getHistory(safeDraft.evidenceId);

    if (history.length === 0) {
      if (isBlank(safeDraft.value)) {
        summary.unchanged += 1;
        continue;
      }
      await store.add({
        evidenceId: safeDraft.evidenceId,
        subjectType: safeDraft.subjectType,
        subjectId: safeDraft.subjectId,
        kind: safeDraft.kind,
        key: safeDraft.key,
        value: safeDraft.value,
        origin: 'ai_generated',
        trust: safeDraft.trust || 'unverified',
        source: safeDraft.source,
        observedAt: safeDraft.observedAt,
        validUntil: safeDraft.validUntil
      });
      summary.added += 1;
      continue;
    }

    const current = currentVersion(history);

    // Suppress if student previously confirmed or rejected this fact
    if (current.origin === 'student_confirmed') {
      summary.unchanged += 1;
      continue;
    }

    if (current.status === 'rejected') {
      summary.unchanged += 1;
      continue;
    }

    // Suppress identical re-suggestions from the same source if any past version was rejected
    const previouslyRejectedSameSource = history.some(
      (h) =>
        h.status === 'rejected' &&
        h.source?.url === safeDraft.source?.url &&
        h.source?.agent === safeDraft.source?.agent
    );
    if (previouslyRejectedSameSource) {
      summary.unchanged += 1;
      continue;
    }

    if (contentHash(current) === contentHash(safeDraft)) {
      summary.unchanged += 1;
      continue;
    }

    await store.revise(safeDraft.evidenceId, {
      origin: 'ai_generated',
      trust: safeDraft.trust || 'unverified',
      kind: safeDraft.kind,
      key: safeDraft.key,
      value: safeDraft.value,
      source: safeDraft.source,
      observedAt: safeDraft.observedAt,
      validUntil: safeDraft.validUntil
    });
    summary.revised += 1;
  }

  return summary;
}

/**
 * Loads unconfirmed ai_generated evidence from the store and maps to AgentSuggestion[]
 * - View over active records where origin === 'ai_generated' and status === 'active'.
 * - Omits records that were confirmed (origin === 'student_confirmed') or rejected.
 * - Omits records whose history contains a rejection from the same source (suppression).
 */
export async function getUnconfirmedAiSuggestions(
  store: EvidenceStore
): Promise<AgentSuggestion[]> {
  await ensureEvidenceStore(store);
  const allRecords = await store.listAll();

  // Group by evidenceId
  const byEvidenceId = new Map<string, EvidenceRecord[]>();
  for (const rec of allRecords) {
    const list = byEvidenceId.get(rec.evidenceId) || [];
    list.push(rec);
    byEvidenceId.set(rec.evidenceId, list);
  }

  const suggestions: AgentSuggestion[] = [];

  for (const [evidenceId, history] of byEvidenceId.entries()) {
    const current = currentVersion(history);

    // Only unconfirmed ai_generated active records
    if (current.origin !== 'ai_generated' || current.status !== 'active') {
      continue;
    }

    // Suppress if any rejected version exists with same source
    const hasRejectedSameSource = history.some(
      (h) =>
        h.status === 'rejected' &&
        h.source?.url === current.source?.url &&
        h.source?.agent === current.source?.agent
    );
    if (hasRejectedSameSource) {
      continue;
    }

    const sugType: 'skill' | 'project' | 'link' | 'document' | 'info' =
      current.kind === 'skill' || current.kind === 'github_derived' || current.kind === 'profile_text_analysis'
        ? 'skill'
        : current.kind === 'project'
        ? 'project'
        : current.kind === 'link'
        ? 'link'
        : current.kind === 'document'
        ? 'document'
        : 'info';

    const sourceTrust =
      current.trust === 'verified'
        ? 'Verified'
        : current.trust === 'needs_review'
        ? 'Needs review'
        : 'Unverified';

    const sourceList = current.source
      ? [
          {
            title: current.source.agent || 'AI Agent',
            url: current.source.url || '',
            trust: sourceTrust as any
          }
        ]
      : [];

    const title =
      sugType === 'skill'
        ? `Add Skill: ${current.key || current.value}`
        : sugType === 'project'
        ? `Verified Project: ${current.key}`
        : sugType === 'link'
        ? `Add Link: ${current.key}`
        : `${current.kind}: ${current.key}`;

    const description =
      current.source?.sentence ||
      (current.source?.agent ? `Detected by ${current.source.agent}` : 'AI-extracted evidence candidate');

    suggestions.push({
      id: evidenceId,
      evidenceId,
      evidenceRecord: current,
      agent: current.source?.agent || 'Agent',
      type: sugType,
      title,
      description,
      value: current.value,
      confidence: current.trust === 'verified' ? 'high' : current.trust === 'needs_review' ? 'medium' : 'low',
      sources: sourceList,
      status: 'pending'
    });
  }

  return suggestions;
}

