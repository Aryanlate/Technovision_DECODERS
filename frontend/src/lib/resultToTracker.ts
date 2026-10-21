import { Checklist, Requirement, ResultCounts, NewTrackerItemInput } from '@opportunity-kit/shared';

// ============================================================================
// Maps one evaluation result into a tracker draft (pure, no storage access).
// Kept separate from the store so the "Save to tracker" button can preview
// exactly what will be saved.
// ============================================================================

/** A deadline requirement stores its date in `value` as YYYY-MM-DD. */
export function findOpportunityDeadline(requirements: Requirement[]): string | null {
  const deadlineReq = requirements.find((req) => req.kind === 'deadline');
  if (!deadlineReq) return null;
  const value = String(deadlineReq.value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/** First real link inside the pasted listing, used as the opportunity's page. */
export function firstUrlInText(text: string): string {
  const match = /(https?:\/\/[^\s)"'<>]+)/i.exec(String(text ?? ''));
  return match ? match[1] : '';
}

export interface TrackerDraftInput {
  result: any;
  checklist: Checklist | null;
  /** The saved (non what-if) readiness score, 0-100. */
  score: number;
  /** The saved readiness label, e.g. "Almost ready". */
  label: string;
  counts?: ResultCounts;
  /** Plain-text next steps, already ordered by the engine. */
  nextSteps?: string[];
}

export function buildTrackerDraft(input: TrackerDraftInput): NewTrackerItemInput {
  const { result, checklist } = input;
  const requirements: Requirement[] = checklist?.requirements ?? [];
  const sourceList: string[] = (checklist as any)?.sources ?? [];

  return {
    title: result?.opportunityTitle || checklist?.title || 'Untitled opportunity',
    source: sourceList[0] || 'Pasted listing',
    sourceUrl: firstUrlInText(result?.rawOpportunityText || ''),
    deadline: findOpportunityDeadline(requirements),
    readinessScore: input.score,
    readinessLabel: input.label,
    status: 'Interested',
    notes: '',
    counts: input.counts,
    nextSteps: input.nextSteps ?? []
  };
}
