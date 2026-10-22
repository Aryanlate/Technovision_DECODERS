"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stableStringify = stableStringify;
exports.valuesEqual = valuesEqual;
exports.cloneRecord = cloneRecord;
exports.sortByServerSeq = sortByServerSeq;
exports.versionKey = versionKey;
const types_js_1 = require("../evidence/types.js");
/** Stable stringify so object key order does not change equality. */
function stableStringify(value) {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value))
        return `[${value.map(stableStringify).join(',')}]`;
    const entries = Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}
function valuesEqual(left, right) {
    return stableStringify(left) === stableStringify(right);
}
function cloneRecord(record) {
    return types_js_1.EvidenceRecordSchema.parse(JSON.parse(JSON.stringify(record)));
}
/**
 * Order by the server-assigned sequence only. Device clocks (createdAt /
 * observedAt) are ignored so two devices cannot "win" by setting their time.
 */
function sortByServerSeq(records) {
    return [...records].sort((a, b) => {
        const seqA = a.serverSeq ?? Number.MAX_SAFE_INTEGER;
        const seqB = b.serverSeq ?? Number.MAX_SAFE_INTEGER;
        if (seqA !== seqB)
            return seqA - seqB;
        const id = a.evidenceId.localeCompare(b.evidenceId);
        if (id !== 0)
            return id;
        return a.version - b.version;
    });
}
function versionKey(record) {
    return `${record.evidenceId}@${record.version}`;
}
//# sourceMappingURL=compare.js.map