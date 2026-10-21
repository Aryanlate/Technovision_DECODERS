"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EFFORT_ESTIMATE_TABLE = void 0;
exports.resolveEntryKey = resolveEntryKey;
exports.extractMissingSkills = extractMissingSkills;
exports.buildPrioritisedNextSteps = buildPrioritisedNextSteps;
const compare_js_1 = require("./compare.js");
exports.EFFORT_ESTIMATE_TABLE = {
    year: { label: 'Set your year of study', minutes: 1, estimate: '1 minute' },
    cgpa: { label: 'Add your CGPA', minutes: 2, estimate: '2 minutes' },
    'link:github': { label: 'Add GitHub link', minutes: 5, estimate: '5 minutes' },
    'link:either': { label: 'Add GitHub or portfolio link', minutes: 5, estimate: '5 minutes' },
    'link:linkedin': { label: 'Add LinkedIn link', minutes: 5, estimate: '5 minutes' },
    'link:portfolio': { label: 'Add portfolio link', minutes: 10, estimate: '10 minutes' },
    'link:instagram': { label: 'Add Instagram link', minutes: 5, estimate: '5 minutes' },
    'document:other': { label: 'Upload the document', minutes: 15, estimate: '15 minutes' },
    'document:resume': { label: 'Prepare your resume', minutes: 30, estimate: '30 minutes' },
    availability: { label: 'Confirm your availability', minutes: 5, estimate: '5 minutes' },
    projectCount: { label: 'Add a project', minutes: 10080, estimate: 'about 1 week' },
    projectTag: { label: 'Add a matching project', minutes: 10080, estimate: 'about 1 week' },
    skills: { label: 'Learn the missing skill basics', minutes: 20160, estimate: 'about 2 weeks' },
    deadline: { label: 'Submit before the deadline', minutes: 1, estimate: '1 minute' },
    'custom:income': { label: 'Add family income details', minutes: 5, estimate: '5 minutes' },
    'custom:generic': { label: 'Provide the missing evidence', minutes: 10, estimate: '10 minutes' }
};
/** Maps a requirement to its curated effort-table key. */
function resolveEntryKey(req) {
    switch (req.kind) {
        case 'link': {
            const target = String(req.value ?? 'portfolioOrGithub').toLowerCase();
            if (target.includes('linkedin'))
                return 'link:linkedin';
            if (target.includes('instagram'))
                return 'link:instagram';
            const hasGithub = target.includes('github');
            const hasPortfolio = target.includes('portfolio');
            if (hasGithub && hasPortfolio)
                return 'link:either';
            if (hasGithub)
                return 'link:github';
            if (hasPortfolio)
                return 'link:portfolio';
            return 'link:either';
        }
        case 'document':
            return String(req.value ?? 'resume').toLowerCase().includes('resume')
                ? 'document:resume'
                : 'document:other';
        case 'custom': {
            const label = (req.label || req.title || '').toLowerCase();
            return label.includes('income') ? 'custom:income' : 'custom:generic';
        }
        case 'year':
        case 'cgpa':
        case 'skills':
        case 'availability':
        case 'projectCount':
        case 'projectTag':
        case 'deadline':
            return req.kind;
        default:
            return 'custom:generic';
    }
}
/** Pulls the missing skill names out of a listRule reason, e.g. "Missing required skill: JavaScript." */
function extractMissingSkills(reason) {
    const match = reason.match(/Missing required skills?:\s*(.+?)\.?\s*$/i);
    if (!match)
        return [];
    return match[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}
/**
 * Builds the action list ordered by quickest fix first (ascending estimate),
 * with equal-effort steps keeping the engine's Mismatch-before-Missing-info order.
 * Every step is labelled as an estimate.
 */
function buildPrioritisedNextSteps(checklistInput, findings) {
    const requirements = (0, compare_js_1.toRequirements)(checklistInput);
    const reqById = new Map(requirements.map((r) => [r.id, r]));
    const steps = findings
        .filter((f) => f.status === 'Mismatch' || f.status === 'Missing info')
        .map((f, index) => {
        const req = reqById.get(f.requirementId) ||
            { id: f.requirementId, kind: 'custom', label: f.title || f.requirementId, required: true };
        const entry = exports.EFFORT_ESTIMATE_TABLE[resolveEntryKey(req)] || exports.EFFORT_ESTIMATE_TABLE['custom:generic'];
        let actionLabel = entry.label;
        if (req.kind === 'skills') {
            const missing = extractMissingSkills(f.reason);
            if (missing.length > 0) {
                actionLabel = `Learn ${missing.join(', ')} basics`;
            }
        }
        return {
            order: 0,
            requirementId: f.requirementId,
            title: f.title || req.label || f.requirementId,
            status: f.status,
            action: actionLabel,
            detail: f.nextStep || '',
            minutes: entry.minutes,
            estimate: entry.estimate,
            _index: index
        };
    });
    steps.sort((a, b) => a.minutes - b.minutes || a._index - b._index);
    return steps.map(({ _index, ...rest }, index) => ({ ...rest, order: index + 1 }));
}
//# sourceMappingURL=nextSteps.js.map