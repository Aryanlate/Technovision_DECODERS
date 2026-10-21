"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicShareSnapshotSchema = exports.ShareSnapshotSchema = exports.ShareRowSchema = exports.SHARE_TTL_DAYS = void 0;
exports.redactContactAndLinks = redactContactAndLinks;
exports.containsContactOrLink = containsContactOrLink;
exports.shareExpiresAt = shareExpiresAt;
exports.isShareExpired = isShareExpired;
exports.shareDaysRemaining = shareDaysRemaining;
exports.isShareActive = isShareActive;
exports.newShareId = newShareId;
exports.createShareSnapshot = createShareSnapshot;
exports.toPublicShareSnapshot = toPublicShareSnapshot;
const zod_1 = require("zod");
const index_js_1 = require("./types/index.js");
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
exports.SHARE_TTL_DAYS = 7;
/** One requirement row inside a snapshot: status only, never the student's value. */
exports.ShareRowSchema = zod_1.z.object({
    requirementId: zod_1.z.string(),
    title: zod_1.z.string(),
    status: index_js_1.RequirementStatusSchema,
    reason: zod_1.z.string().default('')
});
exports.ShareSnapshotSchema = zod_1.z.object({
    id: zod_1.z.string(),
    ownerId: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    expiresAt: zod_1.z.string(),
    revoked: zod_1.z.boolean().default(false),
    opportunityTitle: zod_1.z.string(),
    opportunityType: zod_1.z.string().default(''),
    /** The opportunity's own official page (never a personal profile link). */
    sourceUrl: zod_1.z.string().default(''),
    sourceLabel: zod_1.z.string().default(''),
    readinessScore: zod_1.z.number(),
    readinessLabel: zod_1.z.string().default(''),
    counts: index_js_1.ResultCountsSchema.optional(),
    rows: zod_1.z.array(exports.ShareRowSchema).default([]),
    nextSteps: zod_1.z.array(zod_1.z.string()).default([])
});
/** What the public /share/[id] page is allowed to read (no owner id). */
exports.PublicShareSnapshotSchema = exports.ShareSnapshotSchema.omit({ ownerId: true });
// ---------------------------------------------------------------------------
// Redaction — the guarantee behind "no email, phone or links"
// ---------------------------------------------------------------------------
const URL_RE = /(?:https?:\/\/|www\.)[^\s]+/gi;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Indian mobile numbers (with optional +91) plus any 10+ digit run.
const PHONE_RE = /(?:\+?91[\s-]?)?\b[6-9]\d{9}\b/g;
const LONG_DIGITS_RE = /\b\d{10,}\b/g;
/** Removes links, emails and phone numbers from a free-text field. */
function redactContactAndLinks(text) {
    return String(text ?? '')
        .replace(URL_RE, '[link removed]')
        .replace(EMAIL_RE, '[email removed]')
        .replace(PHONE_RE, '[number removed]')
        .replace(LONG_DIGITS_RE, '[number removed]');
}
/** True when a string still contains an email, phone number or link. */
function containsContactOrLink(text) {
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
function shareExpiresAt(createdAt, ttlDays = exports.SHARE_TTL_DAYS) {
    return new Date(createdAt.getTime() + ttlDays * 86_400_000).toISOString();
}
function isShareExpired(snapshot, now = new Date()) {
    const expiry = Date.parse(snapshot.expiresAt);
    if (Number.isNaN(expiry))
        return true;
    return now.getTime() >= expiry;
}
/** Whole days until expiry (0 once expired). */
function shareDaysRemaining(snapshot, now = new Date()) {
    const expiry = Date.parse(snapshot.expiresAt);
    if (Number.isNaN(expiry))
        return 0;
    const diff = expiry - now.getTime();
    return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
}
/** A snapshot is usable when it is neither revoked nor expired. */
function isShareActive(snapshot, now = new Date()) {
    return !snapshot.revoked && !isShareExpired(snapshot, now);
}
let shareIdCounter = 0;
function newShareId(now = new Date()) {
    shareIdCounter += 1;
    const random = Math.random().toString(36).slice(2, 8);
    return `s-${now.getTime().toString(36)}${shareIdCounter.toString(36)}${random}`;
}
/**
 * Builds a sanitised, read-only snapshot. Only statuses are kept from the
 * findings — the student's own values are dropped — and every text field is
 * run through the redactor.
 */
function createShareSnapshot(input) {
    const now = input.now ?? new Date();
    const ttlDays = input.ttlDays ?? exports.SHARE_TTL_DAYS;
    const rows = (input.findings ?? []).map((finding) => ({
        requirementId: finding.requirementId,
        title: redactContactAndLinks(finding.title || finding.requirementId),
        status: finding.status,
        reason: redactContactAndLinks(finding.reason || '')
    }));
    return exports.ShareSnapshotSchema.parse({
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
function toPublicShareSnapshot(snapshot) {
    const { ownerId, ...rest } = snapshot;
    return exports.PublicShareSnapshotSchema.parse(rest);
}
//# sourceMappingURL=share.js.map