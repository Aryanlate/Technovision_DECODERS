"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerItemSchema = exports.DEADLINE_SOON_DAYS = exports.TRACKER_STATUSES = exports.TrackerStatusSchema = void 0;
exports.deadlineDayIndex = deadlineDayIndex;
exports.daysUntilDeadline = daysUntilDeadline;
exports.isDeadlineSoon = isDeadlineSoon;
exports.describeDeadline = describeDeadline;
exports.newTrackerId = newTrackerId;
exports.createTrackerItem = createTrackerItem;
exports.sortTrackerItems = sortTrackerItems;
exports.filterTrackerItems = filterTrackerItems;
exports.groupTrackerItemsByStatus = groupTrackerItemsByStatus;
exports.trackerStatusCounts = trackerStatusCounts;
const zod_1 = require("zod");
const index_js_1 = require("./types/index.js");
// ============================================================================
// Application tracker (pure types + helpers, no AI, no network)
//
// A saved item keeps the opportunity title, its source, the deadline, the
// readiness score at the moment of saving, a status and a free-text note.
// All sorting, filtering and "deadline is close" logic below is deterministic
// so it can run in the browser and be unit-tested without a backend.
// ============================================================================
exports.TrackerStatusSchema = zod_1.z.enum([
    'Interested',
    'Preparing',
    'Applied',
    'Interview',
    'Result'
]);
/** Board columns, left to right — the order a student moves through. */
exports.TRACKER_STATUSES = [
    'Interested',
    'Preparing',
    'Applied',
    'Interview',
    'Result'
];
/** A deadline this many days away (or sooner, but not past) is "coming up". */
exports.DEADLINE_SOON_DAYS = 7;
exports.TrackerItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    /** Human-readable source, e.g. "Pasted listing" or an organisation name. */
    source: zod_1.z.string().default(''),
    sourceUrl: zod_1.z.string().default(''),
    /** ISO date (YYYY-MM-DD) or full ISO timestamp. Null when the listing has none. */
    deadline: zod_1.z.string().nullable().default(null),
    /** Readiness score (0-100) captured when the item was saved. */
    readinessScore: zod_1.z.number(),
    readinessLabel: zod_1.z.string().default(''),
    status: exports.TrackerStatusSchema.default('Interested'),
    notes: zod_1.z.string().default(''),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    counts: index_js_1.ResultCountsSchema.optional(),
    nextSteps: zod_1.z.array(zod_1.z.string()).default([])
});
// ---------------------------------------------------------------------------
// Deadline math (calendar-day based, so a "1 day" gap never depends on clock time)
// ---------------------------------------------------------------------------
/** Converts a date string to a whole-day index. Returns null for invalid input. */
function deadlineDayIndex(deadline) {
    if (!deadline)
        return null;
    const text = String(deadline).trim();
    if (!text)
        return null;
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (iso) {
        const ms = Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
        return Number.isNaN(ms) ? null : Math.floor(ms / 86_400_000);
    }
    const parsed = Date.parse(text);
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 86_400_000);
}
/** Whole days from `now` until the deadline. Negative means it has passed. */
function daysUntilDeadline(deadline, now = new Date()) {
    const target = deadlineDayIndex(deadline);
    if (target === null)
        return null;
    return target - Math.floor(now.getTime() / 86_400_000);
}
/** True when the deadline is today or within the next `days` days (but not past). */
function isDeadlineSoon(deadline, now = new Date(), days = exports.DEADLINE_SOON_DAYS) {
    const remaining = daysUntilDeadline(deadline, now);
    return remaining !== null && remaining >= 0 && remaining <= days;
}
/** Short human label for a deadline, e.g. "in 3 days", "today", "2 days ago". */
function describeDeadline(deadline, now = new Date()) {
    const remaining = daysUntilDeadline(deadline, now);
    if (remaining === null)
        return 'No deadline given';
    if (remaining === 0)
        return 'Due today';
    if (remaining === 1)
        return 'Due tomorrow';
    if (remaining > 1)
        return `Due in ${remaining} days`;
    if (remaining === -1)
        return 'Overdue by 1 day';
    return `Overdue by ${Math.abs(remaining)} days`;
}
// ---------------------------------------------------------------------------
// Factory, sort, filter, group
// ---------------------------------------------------------------------------
let trackerIdCounter = 0;
/** Stable id generator that works in the browser and in tests. */
function newTrackerId(now = new Date()) {
    trackerIdCounter += 1;
    return `trk-${now.getTime().toString(36)}-${trackerIdCounter.toString(36)}`;
}
/** Builds a validated tracker item, filling ids and timestamps. */
function createTrackerItem(input) {
    const now = input.now ?? new Date();
    const timestamp = now.toISOString();
    return exports.TrackerItemSchema.parse({
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
function sortTrackerItems(items, key = 'deadline') {
    const copy = [...items];
    switch (key) {
        case 'deadline':
            return copy.sort((a, b) => {
                const da = deadlineDayIndex(a.deadline);
                const db = deadlineDayIndex(b.deadline);
                if (da === null && db === null)
                    return a.title.localeCompare(b.title);
                if (da === null)
                    return 1;
                if (db === null)
                    return -1;
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
function filterTrackerItems(items, filter = {}) {
    const query = (filter.query ?? '').trim().toLowerCase();
    return items.filter((item) => {
        if (filter.status && filter.status !== 'All' && item.status !== filter.status)
            return false;
        if (filter.soonOnly && !isDeadlineSoon(item.deadline))
            return false;
        if (query) {
            const haystack = `${item.title} ${item.source} ${item.notes}`.toLowerCase();
            if (!haystack.includes(query))
                return false;
        }
        return true;
    });
}
/** Groups items into the five board columns, each sorted by deadline. */
function groupTrackerItemsByStatus(items) {
    const columns = {};
    for (const status of exports.TRACKER_STATUSES) {
        columns[status] = sortTrackerItems(items.filter((item) => item.status === status), 'deadline');
    }
    return columns;
}
/** Counts items per status, always including zero-count columns. */
function trackerStatusCounts(items) {
    const counts = {};
    for (const status of exports.TRACKER_STATUSES) {
        counts[status] = items.filter((item) => item.status === status).length;
    }
    return counts;
}
//# sourceMappingURL=tracker.js.map