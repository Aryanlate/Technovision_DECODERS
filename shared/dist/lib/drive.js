"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriveChecklistSchema = exports.DrivePartnerTypeSchema = void 0;
exports.newDriveId = newDriveId;
exports.validateDriveInput = validateDriveInput;
exports.createDriveChecklist = createDriveChecklist;
const zod_1 = require("zod");
const index_js_1 = require("./types/index.js");
// ============================================================================
// Partner-published drive checklists
//
// A company or a college placement cell publishes a structured checklist once
// and shares one link (/drive/[id]). Students open the link and compare it with
// their own profile in a single click, using the same deterministic rule engine
// as everywhere else — so the statuses are never guessed by an AI.
//
// The checklist stores plain `Requirement` objects, which means a published
// drive can be fed straight into `evaluateProfileAgainstOpportunity()` and into
// the college batch audit without any conversion step.
// ============================================================================
exports.DrivePartnerTypeSchema = zod_1.z.enum(['company', 'placement-cell', 'other']);
exports.DriveChecklistSchema = zod_1.z.object({
    id: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    partnerName: zod_1.z.string(),
    partnerType: exports.DrivePartnerTypeSchema.default('company'),
    title: zod_1.z.string(),
    location: zod_1.z.string().default(''),
    /** ISO date (YYYY-MM-DD) or full ISO timestamp. Empty when not given. */
    deadline: zod_1.z.string().default(''),
    applyUrl: zod_1.z.string().default(''),
    notes: zod_1.z.string().default(''),
    requirements: zod_1.z.array(index_js_1.RequirementSchema).default([])
});
let driveIdCounter = 0;
/** Short, URL-safe id for a published drive. */
function newDriveId(now = new Date()) {
    driveIdCounter += 1;
    const random = Math.random().toString(36).slice(2, 8);
    return `d-${now.getTime().toString(36)}${driveIdCounter.toString(36)}${random}`;
}
/**
 * Checks a publisher's draft before it is published. Returns plain-language
 * messages (empty array = valid) so the /drive/new form can show them directly.
 */
function validateDriveInput(input) {
    const errors = [];
    if (!String(input.partnerName ?? '').trim()) {
        errors.push('Add who is publishing this drive (the company or the placement cell).');
    }
    if (!String(input.title ?? '').trim()) {
        errors.push('Add a drive title so students know what this is for.');
    }
    if (!input.requirements || input.requirements.length === 0) {
        errors.push('Add at least one requirement, otherwise the comparison has nothing to check.');
    }
    return errors;
}
/** Builds and validates a published checklist from a partner's draft. */
function createDriveChecklist(input) {
    const now = input.now ?? new Date();
    return exports.DriveChecklistSchema.parse({
        id: input.id ?? newDriveId(now),
        createdAt: now.toISOString(),
        partnerName: String(input.partnerName ?? '').trim() || 'Unnamed partner',
        partnerType: input.partnerType ?? 'company',
        title: String(input.title ?? '').trim() || 'Untitled drive',
        location: input.location ?? '',
        deadline: input.deadline ?? '',
        applyUrl: input.applyUrl ?? '',
        notes: input.notes ?? '',
        requirements: input.requirements ?? []
    });
}
//# sourceMappingURL=drive.js.map