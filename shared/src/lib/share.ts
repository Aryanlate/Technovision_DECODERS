import { z } from 'zod';
import {
  FindingSchema,
  RequirementStatusSchema,
  ResultCountsSchema,
  type Finding,
  type ResultCounts
} from './types/index.js';

// ============================================================================
// Shareable result snapshot (read-only)
//
// A snapshot is a deliberately small, sanitised projection of one evaluation:
// the opportunity, the per-requirement statuses, the readiness score and the
// next steps. It NEVER contains profile contact details or links — every text
// field is passed through a redactor that removes emails, phone numbers and
// links, so even a reason string that embeds one cannot leak it.
// ============================================================================

/** Share links stay valid for 7 days, then expire automatically. */
export const SHARE_TTL_DAYS = 7;

/** One requirement row inside a snapshot: status only, never the student's value. */
export const ShareRowSchema = z.object({
  requirementId: z.string(),
  title: z.string(),
  status: RequirementStatusSchema,
  reason: z.string().default('')
});
export type ShareRow = z.infer<typeof ShareRowSchema>;

export const ShareSnapshotSchema = z.object({
  id: z.string(),
  ownerId: z.string().optional(),
  createdAt: z.string(),
  expiresAt: z.string(),
  revoked: z.boolean().default(false),

  opportunityTitle: z.string(),
  opportunityType: z.string().default(''),
  /** The opportunity's own official page (never a personal profile link). */
  sourceUrl: z.string().default(''),
  sourceLabel: z.string().default(''),

  readinessScore: z.number(),
  readinessLabel: z.string().default(''),
  counts: ResultCountsSchema.optional(),
  rows: z.array(ShareRowSchema).default([]),
  nextSteps: z.array(z.string()).default([])
});
export type ShareSnapshot = z.infer<typeof ShareSnapshotSchema>;

/** What the public /share/[id] page is allowed to read (no owner id). */
export const PublicShareSnapshotSchema = ShareSnapshotSchema.omit({ ownerId: true });
export type PublicShareSnapshot = z.infer<typeof PublicShareSnapshotSchema>;

// ---------------------------------------------------------------------------
// Redaction — the guarantee behind "no email, phone or links"
// ---------------------------------------------------------------------------

const URL_RE = /(?:https?:\/\/|www\.)[^\s]+/gi;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Indian mobile numbers (with optional +91) plus any 10+ digit run.
const PHONE_RE = /(?:\+?91[\s-]?)?\b[6-9]\d{9}\b/g;
const LONG_DIGITS_RE = /\b\d{10,}\b/g;

/** Removes links, emails and phone numbers from a free-text field. */
export function redactContactAndLinks(text: string): string {
  return String(text ?? '')
    .replace(URL_RE, '[link removed]')
    .replace(EMAIL_RE, '[email removed]')
    .replace(PHONE_RE, '[number removed]')
    .replace(LONG_DIGITS_RE, '[number removed]');
}

/** True when a string still contains an email, phone number or link. */
export function containsContactOrLink(text: string): boolean {
  const value = String(text ?? '');
  // Reset lastIndex: these patterns are global, and `.test` is stateful.
  return [URL_RE, EMAIL_RE, PHONE_RE, LONG_DIGITS_RE].some((re) => {
    re.lastIndex = 0;
    return re.test(value);
  });
}

// ---------------------------------------------------------------------------
// Expiry helpers
// ---------------------------------------------------------------------------

export function shareExpiresAt(createdAt: Date, ttlDays: number = SHARE_TTL_DAYS): string {
  return new Date(createdAt.getTime() + ttlDays * 86_400_000).toISOString();
}

export function isShareExpired(snapshot: { expiresAt: string }, now: Date = new Date()): boolean {
  const expiry = Date.parse(snapshot.expiresAt);
  if (Number.isNaN(expiry)) return true;
  return now.getTime() >= expiry;
}

/** Whole days until expiry (0 once expired). */
export function shareDaysRemaining(snapshot: { expiresAt: string }, now: Date = new Date()): number {
  const expiry = Date.parse(snapshot.expiresAt);
  if (Number.isNaN(expiry)) return 0;
  const diff = expiry - now.getTime();
  return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
}

/** A snapshot is usable when it is neither revoked nor expired. */
export function isShareActive(
  snapshot: { revoked?: boolean; expiresAt: string },
  now: Date = new Date()
): boolean {
  return !snapshot.revoked && !isShareExpired(snapshot, now);
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export interface ShareSnapshotInput {
  opportunityTitle: string;
  opportunityType?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  readinessScore: number;
  readinessLabel?: string;
  counts?: ResultCounts;
  findings?: Pick<Finding, 'requirementId' | 'title' | 'status' | 'reason'>[];
  nextSteps?: string[];
  ownerId?: string;
  ttlDays?: number;
  /** Overridable for deterministic tests. */
  id?: string;
  now?: Date;
}

let shareIdCounter = 0;

export function newShareId(now: Date = new Date()): string {
  shareIdCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `s-${now.getTime().toString(36)}${shareIdCounter.toString(36)}${random}`;
}

/**
 * Builds a sanitised, read-only snapshot. Only statuses are kept from the
 * findings — the student's own values are dropped — and every text field is
 * run through the redactor.
 */
export function createShareSnapshot(input: ShareSnapshotInput): ShareSnapshot {
  const now = input.now ?? new Date();
  const ttlDays = input.ttlDays ?? SHARE_TTL_DAYS;

  const rows: ShareRow[] = (input.findings ?? []).map((finding) => ({
    requirementId: finding.requirementId,
    title: redactContactAndLinks(finding.title || finding.requirementId),
    status: finding.status,
    reason: redactContactAndLinks(finding.reason || '')
  }));

  return ShareSnapshotSchema.parse({
    id: input.id ?? newShareId(now),
    ownerId: input.ownerId,
    createdAt: now.toISOString(),
    expiresAt: shareExpiresAt(now, ttlDays),
    revoked: false,
    opportunityTitle: redactContactAndLinks(input.opportunityTitle),
    opportunityType: input.opportunityType ?? '',
    // The opportunity's own page is intentionally kept; it is not a profile link.
    sourceUrl: input.sourceUrl ?? '',
    sourceLabel: redactContactAndLinks(input.sourceLabel ?? ''),
    readinessScore: Math.max(0, Math.min(100, Math.round(input.readinessScore))),
    readinessLabel: input.readinessLabel ?? '',
    counts: input.counts,
    rows,
    nextSteps: (input.nextSteps ?? []).map((step) => redactContactAndLinks(step))
  });
}

/** Strips the owner id before the snapshot is shown publicly. */
export function toPublicShareSnapshot(snapshot: ShareSnapshot): PublicShareSnapshot {
  const { ownerId, ...rest } = snapshot;
  return PublicShareSnapshotSchema.parse(rest);
}
