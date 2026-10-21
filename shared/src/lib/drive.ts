import { z } from 'zod';
import { RequirementSchema, type Requirement } from './types/index.js';

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

export const DrivePartnerTypeSchema = z.enum(['company', 'placement-cell', 'other']);
export type DrivePartnerType = z.infer<typeof DrivePartnerTypeSchema>;

export const DriveChecklistSchema = z.object({
  id: z.string(),
  createdAt: z.string(),

  partnerName: z.string(),
  partnerType: DrivePartnerTypeSchema.default('company'),

  title: z.string(),
  location: z.string().default(''),
  /** ISO date (YYYY-MM-DD) or full ISO timestamp. Empty when not given. */
  deadline: z.string().default(''),
  applyUrl: z.string().default(''),
  notes: z.string().default(''),

  requirements: z.array(RequirementSchema).default([])
});
export type DriveChecklist = z.infer<typeof DriveChecklistSchema>;

let driveIdCounter = 0;

/** Short, URL-safe id for a published drive. */
export function newDriveId(now: Date = new Date()): string {
  driveIdCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `d-${now.getTime().toString(36)}${driveIdCounter.toString(36)}${random}`;
}

export interface DriveChecklistInput {
  partnerName: string;
  partnerType?: DrivePartnerType;
  title: string;
  location?: string;
  deadline?: string;
  applyUrl?: string;
  notes?: string;
  requirements: Requirement[];
  /** Overridable for deterministic tests. */
  id?: string;
  now?: Date;
}

/**
 * Checks a publisher's draft before it is published. Returns plain-language
 * messages (empty array = valid) so the /drive/new form can show them directly.
 */
export function validateDriveInput(input: {
  partnerName?: string;
  title?: string;
  requirements?: unknown[];
}): string[] {
  const errors: string[] = [];
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
export function createDriveChecklist(input: DriveChecklistInput): DriveChecklist {
  const now = input.now ?? new Date();

  return DriveChecklistSchema.parse({
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
