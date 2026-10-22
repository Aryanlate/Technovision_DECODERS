import {
  fnv1aHash,
  profileEvidenceFromProfile,
  requirementEvidenceFromRequirements,
  type CreateEvidenceInput,
  type EvidenceRecord,
  type Requirement,
  type StudentProfile
} from '@opportunity-kit/shared';
import { CHECKLIST_KEY, PROFILE_KEY } from '../storage';
import { TRACKER_KEY } from '../trackerStore';

// ============================================================================
// One-time migration of the pre-evidence localStorage data.
//
// The profile, its links and projects become student_confirmed (profile)
// evidence; the parsed checklist and the tracker become user_provided
// (pasted opportunity) evidence. The old localStorage keys are never written
// or removed, so they stay as a backup.
//
// Idempotency has two locks: the meta flag is written in the SAME transaction
// as the records, and every migrated record gets a deterministic evidenceId
// derived from its source key, so a re-run can never duplicate a fact.
// ============================================================================

export const MIGRATION_FLAG = 'migration:localStorage:v1';
export const MIGRATION_EVIDENCE_PREFIX = 'ev-mig-';

/** The part of localStorage this module needs (injectable for tests). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  key(index: number): string | null;
  readonly length: number;
}

export interface MigrationOptions {
  /** Defaults to the real localStorage; pass null to skip the migration. */
  storage?: KeyValueStore | null;
}

export type MigrationReason = 'migrated' | 'already_migrated' | 'nothing_to_migrate' | 'unavailable';

export interface MigrationResult {
  migrated: boolean;
  reason: MigrationReason;
  /** How many evidence records were created. */
  records: number;
  /** localStorage keys that were read. They are left untouched. */
  sources: string[];
}

/** What the migration needs from the evidence store. */
export interface EvidenceMigrationTarget {
  getMetaValue(key: string): Promise<unknown>;
  addBatch(inputs: CreateEvidenceInput[], flag?: { key: string; value: unknown }): Promise<EvidenceRecord[]>;
}

const MIGRATED_SENTENCE = 'Imported from the data already saved on this device before evidence records existed.';

/** Returns localStorage, or null when the browser blocks it. */
export function detectLocalStorage(): KeyValueStore | null {
  try {
    const candidate = (globalThis as { localStorage?: KeyValueStore }).localStorage;
    return candidate && typeof candidate.getItem === 'function' ? candidate : null;
  } catch {
    // Reading localStorage itself can throw when site data is blocked.
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
}

function readJson(storage: KeyValueStore, key: string): unknown {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Deterministic id: re-running the migration can only ever produce the same ids. */
function migrationEvidenceId(sourceKey: string, subjectId: string, kind: string, key: string): string {
  return `${MIGRATION_EVIDENCE_PREFIX}${fnv1aHash([sourceKey, subjectId, kind, key].join('|'))}`;
}

function migratedRecord(
  sourceKey: string,
  record: Omit<CreateEvidenceInput, 'evidenceId' | 'source'>
): CreateEvidenceInput {
  return {
    ...record,
    evidenceId: migrationEvidenceId(sourceKey, record.subjectId, record.kind, record.key),
    source: { type: 'migration', sentence: MIGRATED_SENTENCE }
  };
}

/** A version-1 input for a record the shared adapters already built. */
function toCreateInput(record: EvidenceRecord): CreateEvidenceInput {
  return {
    evidenceId: record.evidenceId,
    subjectType: record.subjectType,
    subjectId: record.subjectId,
    kind: record.kind,
    key: record.key,
    value: record.value,
    origin: record.origin,
    trust: record.trust,
    source: record.source,
    observedAt: record.observedAt,
    validUntil: record.validUntil
  };
}

/**
 * The saved profile as student_confirmed evidence.
 *
 * The shared adapter is reused, so a migrated fact gets exactly the same
 * evidenceId and key as every later save. That makes it visible to the
 * evaluator straight away, and the first save of an unchanged profile appends
 * nothing because the content hash already matches.
 */
function profileEvidence(profile: Record<string, unknown>): CreateEvidenceInput[] {
  return profileEvidenceFromProfile(profile as unknown as StudentProfile).map(toCreateInput);
}

/** The parsed checklist as user_provided evidence about one opportunity. */
function checklistEvidence(checklist: Record<string, unknown>): CreateEvidenceInput[] {
  const requirements = Array.isArray(checklist.requirements) ? checklist.requirements : [];
  if (requirements.length === 0) return [];

  const title = isPresent(checklist.title) ? String(checklist.title) : 'opportunity';
  return requirementEvidenceFromRequirements(requirements as Requirement[], title).map(toCreateInput);
}

/** Each tracked opportunity as user_provided evidence. */
function trackerEvidence(items: unknown[]): CreateEvidenceInput[] {
  const inputs: CreateEvidenceInput[] = [];
  items.forEach((item, index) => {
    if (!isRecord(item)) return;
    const title = isPresent(item.title) ? String(item.title) : `tracked-${index + 1}`;
    inputs.push(
      migratedRecord(TRACKER_KEY, {
        subjectType: 'opportunity',
        subjectId: `opportunity:${fnv1aHash(title)}`,
        kind: 'tracker_item',
        key: isPresent(item.id) ? String(item.id) : `tracker.${index + 1}`,
        value: item,
        origin: 'user_provided'
      })
    );
  });
  return inputs;
}

function collectEvidence(storage: KeyValueStore): { inputs: CreateEvidenceInput[]; sources: string[] } {
  const inputs: CreateEvidenceInput[] = [];
  const sources: string[] = [];

  const profile = readJson(storage, PROFILE_KEY);
  if (isRecord(profile)) {
    sources.push(PROFILE_KEY);
    inputs.push(...profileEvidence(profile));
  }

  const checklist = readJson(storage, CHECKLIST_KEY);
  if (isRecord(checklist)) {
    sources.push(CHECKLIST_KEY);
    inputs.push(...checklistEvidence(checklist));
  }

  const tracker = readJson(storage, TRACKER_KEY);
  if (Array.isArray(tracker)) {
    sources.push(TRACKER_KEY);
    inputs.push(...trackerEvidence(tracker));
  }

  return { inputs, sources };
}

/**
 * Converts the existing localStorage data into evidence records, once.
 * Never throws for a missing or blocked localStorage: it reports why instead.
 */
export async function migrateLocalStorageData(
  target: EvidenceMigrationTarget,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const storage = options.storage === undefined ? detectLocalStorage() : options.storage;
  if (!storage) {
    return { migrated: false, reason: 'unavailable', records: 0, sources: [] };
  }

  if (await target.getMetaValue(MIGRATION_FLAG)) {
    return { migrated: false, reason: 'already_migrated', records: 0, sources: [] };
  }

  const { inputs, sources } = collectEvidence(storage);
  if (inputs.length === 0) {
    // Nothing was saved on this device yet. Leave the flag unset so the first
    // real save can still be migrated on a later load.
    return { migrated: false, reason: 'nothing_to_migrate', records: 0, sources };
  }

  await target.addBatch(inputs, {
    key: MIGRATION_FLAG,
    value: { at: new Date().toISOString(), records: inputs.length }
  });

  return { migrated: true, reason: 'migrated', records: inputs.length, sources };
}
