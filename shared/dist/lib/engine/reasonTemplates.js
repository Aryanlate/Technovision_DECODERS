"use strict";
/**
 * Translatable templates for the deterministic rule reasons.
 *
 * Every reason the rule engine produces comes from a template key plus its
 * values — never from an LLM. The English text lives here and is rendered by
 * `renderReason`, so the backend, the tests and the PDF keep working in
 * English. The frontend looks the same key up in the Hindi and Marathi
 * dictionaries and falls back to this English text when a key is missing.
 *
 * A translation is a plain string with `{placeholders}`, e.g.
 * `"numberRule.min.match": "{metric} {value} meets the minimum requirement of {threshold}."`
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REASON_TEMPLATES = void 0;
exports.renderTemplate = renderTemplate;
exports.renderReason = renderReason;
/** Reason template keys for every rule branch (English is the source of truth). */
exports.REASON_TEMPLATES = {
    // ---- numberRule ----
    'numberRule.missingInfo': '{metric} is not specified in profile.',
    'numberRule.min.match': '{metric} {value} meets the minimum requirement of {threshold}.',
    'numberRule.min.mismatch': '{metric} {value} is below the required cutoff of {threshold}.',
    'numberRule.max.match': '{metric} {value} is within the permitted limit of {threshold}.',
    'numberRule.max.mismatch': '{metric} {value} exceeds the permitted maximum limit of {threshold}.',
    'numberRule.exact.match': '{metric} {value} matches exact requirement of {threshold}.',
    'numberRule.exact.mismatch': '{metric} {value} does not match required value of {threshold}.',
    // ---- rangeRule ----
    'rangeRule.missingInfo': '{label} is not specified in profile.',
    'rangeRule.match': '{student} student matches the requirement ({expected}).',
    'rangeRule.mismatch': 'Current {label} ({student}) does not match the required year ({expected}).',
    // ---- listRule ----
    'listRule.empty': 'No technical skills are listed in your profile.',
    'listRule.mismatch': 'Missing required skill{plural}: {missing}.',
    'listRule.match': 'All required skills ({expected}) are present in your profile.',
    // ---- documentRule ----
    'documentRule.resume.notReady': 'Resume is not ready or marked missing.',
    'documentRule.resume.ready': 'Resume is available and ready.',
    'documentRule.resume.unknown': 'Resume status is not marked in profile.',
    'documentRule.missingInfo': '{document} is not attached to your profile.',
    'documentRule.match': '{document} is attached and verified in profile.',
    // ---- linkRule ----
    'linkRule.either.missing': 'Neither Portfolio nor GitHub link is provided in profile.',
    'linkRule.either.match': '{parts} link provided in profile.',
    'linkRule.missing': '{label} link is not provided in profile.',
    'linkRule.invalid': '{label} link "{url}" is not a valid URL format.',
    'linkRule.match': '{label} link is provided and valid.',
    // ---- countRule ----
    'countRule.none': 'No projects are listed in profile.',
    'countRule.match': 'Found {found} matching {label}{plural} (meets requirement of {required}).',
    'countRule.noMatch': 'No projects matching {label} found in profile.',
    'countRule.mismatch': 'Found {found} {label}{plural}, but minimum {required} are required.',
    // ---- tagRule ----
    'tagRule.none': 'No projects listed in profile to verify tag "{tag}".',
    'tagRule.match': 'Project "{title}" matches tag "{tag}".',
    'tagRule.noMatch': 'No project with tag/technology "{tag}" found in profile.',
    // ---- proofRule ----
    'proofRule.noProject': 'No project specified to verify {label}.',
    'proofRule.missing': 'Project "{title}" is missing a required {label}.',
    'proofRule.invalid': 'Proof link "{url}" for project "{title}" is not a valid URL.',
    'proofRule.match': 'Verified {label} provided for project "{title}".',
    // ---- availabilityRule ----
    'availabilityRule.missingInfo': 'Availability is not specified in profile.',
    'availabilityRule.mismatch': 'Available for {value} weeks, but {required} weeks are required.',
    'availabilityRule.match': 'Available for {value} weeks (meets requirement of {required} weeks).',
    // ---- deadlineRule ----
    'deadlineRule.missing': 'Deadline is not specified.',
    'deadlineRule.unparsable': 'Unable to parse deadline date: "{deadline}".',
    'deadlineRule.expired': 'Submission deadline has passed ({date}).',
    'deadlineRule.active': 'Opportunity is active (deadline: {date}).',
    // ---- custom fallbacks in compare.ts ----
    'customRule.teamSize': 'Team size confirmation needed for submission.',
    'customRule.generic': 'No matching profile evidence found for: "{label}".'
};
/** Fills `{placeholders}` in a template. Unknown placeholders are left as-is. */
function renderTemplate(template, params = {}) {
    return template.replace(/\{(\w+)\}/g, (match, name) => {
        const value = params[name];
        return value === undefined || value === null ? match : String(value);
    });
}
/**
 * Renders the English text for a reason template key and, in parallel, returns
 * the key with its values so the frontend can translate it.
 */
function renderReason(key, params = {}) {
    const template = exports.REASON_TEMPLATES[key];
    if (template === undefined) {
        // Stay loud in development, but never crash the rule engine.
        return { key, params, text: key };
    }
    return { key, params, text: renderTemplate(template, params) };
}
//# sourceMappingURL=reasonTemplates.js.map