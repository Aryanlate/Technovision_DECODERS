import { z } from 'zod';
import { ResultCountsSchema, type ResultCounts } from './types/index.js';

// ============================================================================
// Application tracker (pure types + helpers, no AI, no network)
//
// A saved item keeps the opportunity title, its source, the deadline, the
// readiness score at the moment of saving, a status and a free-text note.
// All sorting, filtering and "deadline is close" logic below is deterministic
// so it can run in the browser and be unit-tested without a backend.
// ============================================================================

export const TrackerStatusSchema = z.enum([
  'Interested',
  'Preparing',
  'Applied',
  'Interview',
  'Result'
]);
export type TrackerStatus = z.infer<typeof TrackerStatusSchema>;

/** Board columns, left to right — the order a student moves through. */
export const TRACKER_STATUSES: TrackerStatus[] = [
  'Interested',
  'Preparing',
  'Applied',
  'Interview',
  'Result'
];

/** A deadline this many days away (or sooner, but not past) is "coming up". */
export const DEADLINE_SOON_DAYS = 7;

export const TrackerItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Human-readable source, e.g. "Pasted listing" or an organisation name. */
  source: z.string().default(''),
  sourceUrl: z.string().default(''),
  /** ISO date (YYYY-MM-DD) or full ISO timestamp. Null when the listing has none. */
  deadline: z.string().nullable().default(null),
  /** Readiness score (0-100) captured when the item was saved. */
  readinessScore: z.number(),
  readinessLabel: z.string().default(''),
  status: TrackerStatusSchema.default('Interested'),
  notes: z.string().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
  counts: ResultCountsSchema.optional(),
  nextSteps: z.array(z.string()).default([])
});
export type TrackerItem = z.infer<typeof TrackerItemSchema>;

export type TrackerSortKey = 'deadline' | 'readiness' | 'title' | 'created';

export interface TrackerFilter {
  status?: TrackerStatus | 'All';
  /** Only items whose deadline is within DEADLINE_SOON_DAYS days. */
  soonOnly?: boolean;
  /** Case-insensitive search over title, source and notes. */
  query?: string;
}

export interface NewTrackerItemInput {
  title: string;
  source?: string;
  sourceUrl?: string;
  deadline?: string | null;
  readinessScore: number;
  readinessLabel?: string;
  status?: TrackerStatus;
  notes?: string;
  counts?: ResultCounts;
  nextSteps?: string[];
  /** Overridable for deterministic tests. */
  id?: string;
  now?: Date;
}

// ---------------------------------------------------------------------------
// Deadline math (calendar-day based, so a "1 day" gap never depends on clock time)
// ---------------------------------------------------------------------------

/** Converts a date string to a whole-day index. Returns null for invalid input. */
export function deadlineDayIndex(deadline?: string | null): number | null {
  if (!deadline) return null;
  const text = String(deadline).trim();
  if (!text) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) {
    const ms = Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(ms) ? null : Math.floor(ms / 86_400_000);
  }

  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 86_400_000);
}

/** Whole days from `now` until the deadline. Negative means it has passed. */
export function daysUntilDeadline(deadline?: string | null, now: Date = new Date()): number | null {
  const target = deadlineDayIndex(deadline);
  if (target === null) return null;
  return target - Math.floor(now.getTime() / 86_400_000);
}

/** True when the deadline is today or within the next `days` days (but not past). */
export function isDeadlineSoon(
  deadline?: string | null,
  now: Date = new Date(),
  days: number = DEADLINE_SOON_DAYS
): boolean {
  const remaining = daysUntilDeadline(deadline, now);
  return remaining !== null && remaining >= 0 && remaining <= days;
}

/** Short human label for a deadline, e.g. "in 3 days", "today", "2 days ago". */
export function describeDeadline(deadline?: string | null, now: Date = new Date()): string {
  const remaining = daysUntilDeadline(deadline, now);
  if (remaining === null) return 'No deadline given';
  if (remaining === 0) return 'Due today';
  if (remaining === 1) return 'Due tomorrow';
  if (remaining > 1) return `Due in ${remaining} days`;
  if (remaining === -1) return 'Overdue by 1 day';
  return `Overdue by ${Math.abs(remaining)} days`;
}

// ---------------------------------------------------------------------------
// Factory, sort, filter, group
// ---------------------------------------------------------------------------

let trackerIdCounter = 0;

/** Stable id generator that works in the browser and in tests. */
export function newTrackerId(now: Date = new Date()): string {
  trackerIdCounter += 1;
  return `trk-${now.getTime().toString(36)}-${trackerIdCounter.toString(36)}`;
}

/** Builds a validated tracker item, filling ids and timestamps. */
export function createTrackerItem(input: NewTrackerItemInput): TrackerItem {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  return TrackerItemSchema.parse({
    id: input.id ?? newTrackerId(now),
    title: input.title.trim() || 'Untitled opportunity',
    source: input.source?.trim() ?? '',
    sourceUrl: input.sourceUrl?.trim() ?? '',
    deadline: input.deadline?.trim() ? input.deadline.trim() : null,
    readinessScore: Math.max(0, Math.min(100, Math.round(input.readinessScore))),
    readinessLabel: input.readinessLabel ?? '',
    status: input.status ?? 'Interested',
    notes: input.notes ?? '',
    createdAt: timestamp,
    updatedAt: timestamp,
    counts: input.counts,
    nextSteps: input.nextSteps ?? []
  });
}

/**
 * Sorts a copy of the items. Missing deadlines always sort last, so a listing
 * without a date never jumps ahead of one that is genuinely closing soon.
 */
export function sortTrackerItems(items: TrackerItem[], key: TrackerSortKey = 'deadline'): TrackerItem[] {
  const copy = [...items];
  switch (key) {
    case 'deadline':
      return copy.sort((a, b) => {
        const da = deadlineDayIndex(a.deadline);
        const db = deadlineDayIndex(b.deadline);
        if (da === null && db === null) return a.title.localeCompare(b.title);
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db || a.title.localeCompare(b.title);
      });
    case 'readiness':
      return copy.sort((a, b) => b.readinessScore - a.readinessScore || a.title.localeCompare(b.title));
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'created':
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/** Applies status, "coming up soon" and text filters. */
export function filterTrackerItems(items: TrackerItem[], filter: TrackerFilter = {}): TrackerItem[] {
  const query = (filter.query ?? '').trim().toLowerCase();
  return items.filter((item) => {
    if (filter.status && filter.status !== 'All' && item.status !== filter.status) return false;
    if (filter.soonOnly && !isDeadlineSoon(item.deadline)) return false;
    if (query) {
      const haystack = `${item.title} ${item.source} ${item.notes}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/** Groups items into the five board columns, each sorted by deadline. */
export function groupTrackerItemsByStatus(items: TrackerItem[]): Record<TrackerStatus, TrackerItem[]> {
  const columns = {} as Record<TrackerStatus, TrackerItem[]>;
  for (const status of TRACKER_STATUSES) {
    columns[status] = sortTrackerItems(
      items.filter((item) => item.status === status),
      'deadline'
    );
  }
  return columns;
}

/** Counts items per status, always including zero-count columns. */
export function trackerStatusCounts(items: TrackerItem[]): Record<TrackerStatus, number> {
  const counts = {} as Record<TrackerStatus, number>;
  for (const status of TRACKER_STATUSES) {
    counts[status] = items.filter((item) => item.status === status).length;
  }
  return counts;
}
