"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evidenceFingerprint = evidenceFingerprint;
const index_js_1 = require("../evidence/index.js");
// ============================================================================
// Evidence fingerprint.
//
// A decision is never stored as the source of truth: it is recomputed from the
// evidence. If a caller caches a decision it MUST key the cache by this
// fingerprint, so that any change to the evidence invalidates the cached
// verdict.
// ============================================================================
/**
 * Stable hash of the evidence that produced a decision: the id and version of
 * every record used, plus its content. Revisions bump the version and content
 * changes bump the content hash, so either invalidates the fingerprint.
 */
function evidenceFingerprint(records) {
    const parts = records
        .map((record) => `${record.evidenceId}@${record.version}#${(0, index_js_1.contentHash)(record)}`)
        .sort();
    return (0, index_js_1.fnv1aHash)(parts.join('|'));
}
//# sourceMappingURL=fingerprint.js.map