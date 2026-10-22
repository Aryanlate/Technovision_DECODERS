"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyEvidence = classifyEvidence;
const staleness_js_1 = require("../evidence/staleness.js");
const CONFIRMED = { confirmed: true, reasonCode: 'SUPPORTED', why: '' };
/** Classifies one evidence version against the rule above. */
function classifyEvidence(record, now) {
    if (record.status === 'rejected') {
        return {
            confirmed: false,
            reasonCode: 'UNVERIFIED',
            why: 'This record was rejected, so it no longer counts as a fact.'
        };
    }
    if (record.status === 'conflicted') {
        return {
            confirmed: false,
            reasonCode: 'CONFLICT',
            why: 'Two versions of this record disagree, so it cannot be used until it is resolved.'
        };
    }
    if (record.status !== 'active') {
        return {
            confirmed: false,
            reasonCode: 'UNVERIFIED',
            why: `This is an older (${record.status}) version, not the current one.`
        };
    }
    if ((0, staleness_js_1.isStale)(record, now)) {
        return {
            confirmed: false,
            reasonCode: 'STALE',
            why: 'This evidence is past its freshness window, so it is advisory only.'
        };
    }
    if (record.origin === 'student_confirmed')
        return CONFIRMED;
    const opportunitySide = record.subjectType === 'opportunity';
    if (opportunitySide && record.origin === 'user_provided')
        return CONFIRMED;
    if (opportunitySide && record.origin === 'ai_generated' && record.trust === 'verified') {
        return CONFIRMED;
    }
    if (record.origin === 'ai_generated') {
        return {
            confirmed: false,
            reasonCode: 'UNCONFIRMED_AI',
            why: 'This is an AI suggestion that the student has not confirmed yet.'
        };
    }
    return {
        confirmed: false,
        reasonCode: 'UNVERIFIED',
        why: 'Only facts the student confirms themselves count for their own profile.'
    };
}
//# sourceMappingURL=classification.js.map