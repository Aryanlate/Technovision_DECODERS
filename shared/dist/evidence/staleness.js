"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STUDENT_CONFIRMED_NEVER_STALE = exports.DEFAULT_STALE_AFTER_DAYS = exports.STALE_AFTER_DAYS = void 0;
exports.staleAfterDays = staleAfterDays;
exports.isStale = isStale;
const types_js_1 = require("./types.js");
// ============================================================================
// Freshness of evidence (deterministic, no network).
//
// How long a fact stays usable depends on how it was gathered. Student
// confirmed facts never expire. Stale evidence stays stored but is advisory
// only: the rule engine must not treat it as a confirmed fact.
// ============================================================================
const DAY_MS = 86_400_000;
/** Age limit per kind, in days. `null` means "never stale". */
exports.STALE_AFTER_DAYS = {
    [types_js_1.EVIDENCE_KIND.RESEARCHED_FACT]: 7,
    [types_js_1.EVIDENCE_KIND.GITHUB_DERIVED]: 30,
    [types_js_1.EVIDENCE_KIND.PROFILE_TEXT_ANALYSIS]: 90
};
/** Fallback for kinds without a rule. */
exports.DEFAULT_STALE_AFTER_DAYS = null;
/** Student confirmed evidence is never stale. */
exports.STUDENT_CONFIRMED_NEVER_STALE = true;
function toTime(value) {
    if (!value)
        return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
}
/** Age limit in days for a kind, or null when the kind never expires. */
function staleAfterDays(kind) {
    return exports.STALE_AFTER_DAYS[kind] ?? exports.DEFAULT_STALE_AFTER_DAYS;
}
/**
 * True when a record must no longer be treated as a confirmed fact.
 * Rejected and superseded versions are history, not live facts, so they are
 * never reported as stale.
 */
function isStale(record, now = new Date()) {
    if (record.status === 'rejected' || record.status === 'superseded')
        return false;
    if (record.origin === 'student_confirmed')
        return false;
    const nowMs = now.getTime();
    const validUntil = toTime(record.validUntil);
    if (validUntil !== null && validUntil <= nowMs)
        return true;
    const limit = staleAfterDays(record.kind);
    if (limit === null)
        return false;
    const observedAt = toTime(record.observedAt) ?? toTime(record.createdAt);
    if (observedAt === null)
        return false;
    return nowMs - observedAt > limit * DAY_MS;
}
//# sourceMappingURL=staleness.js.map