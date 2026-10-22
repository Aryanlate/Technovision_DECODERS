import { describe, it, expect, afterEach } from 'vitest';
import { EvidenceConflictError } from '@opportunity-kit/shared';
import { EvidenceStorageError, describeStorageError, toEvidenceStorageError, withStorageErrors } from '../src/lib/evidence/errors';
import { MIGRATION_FLAG, type KeyValueStore } from '../src/lib/evidence/migration';
import { EvidenceStore } from '../src/lib/evidence/repository';
import { CHECKLIST_KEY, PROFILE_KEY } from '../src/lib/storage';
import { TRACKER_KEY } from '../src/lib/trackerStore';

const PROFILE_JSON = JSON.stringify({
  id: 'p1',
  name: 'Aryan',
  year: 2,
  branch: 'B.Tech CSE',
  cgpa: 8.2,
  skills: ['HTML', 'CSS'],
  links: { github: '', portfolio: '' },
  projects: [{ id: 'pr1', title: 'Campus App', tech: ['Next.js'] }]
});
const CHECKLIST_JSON = JSON.stringify({
  opportunityType: 'internship',
  title: 'Summer Intern',
  requirements: [{ id: 'r1', label: 'Year', kind: 'year' }],
  sources: []
});
const TRACKER_JSON = JSON.stringify([{ id: 't1', title: 'Summer Intern', status: 'Interested' }]);

let store: EvidenceStore | null = null;
let dbCounter = 0;

function createStore(): EvidenceStore {
  dbCounter += 1;
  store = new EvidenceStore(`opportunitykit_evidence_test_${dbCounter}`);
  return store;
}

afterEach(async () => {
  if (store) {
    await store.destroy();
    store = null;
  }
});

interface FakeStorage extends KeyValueStore {
  snapshot(): Record<string, string>;
}

function fakeStorage(seed: Record<string, string> = {}): FakeStorage {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
    snapshot: () => Object.fromEntries(map)
  };
}

function profileInput(overrides: Record<string, unknown> = {}) {
  return {
    subjectType: 'profile' as const,
    subjectId: 'profile:p1',
    kind: 'profile_field',
    key: 'cgpa',
    value: 8.2,
    origin: 'student_confirmed' as const,
    source: { type: 'profile_form' },
    ...overrides
  };
}

describe('local evidence store: writes and transactions', () => {
  it('writes a new version and exactly one outbox entry for a new fact', async () => {
    const local = createStore();
    const record = await local.add(profileInput());

    expect(record.version).toBe(1);
    expect(record.status).toBe('active');
    expect(record.origin).toBe('student_confirmed');
    expect(record.trust).toBe('verified');
    expect(record.syncState).toBe('pending');
    expect(record.deviceId).toBe(await local.getDeviceId());
    expect(await local.db.evidence.count()).toBe(1);

    const pending = await local.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      opId: record.opId,
      operation: 'add',
      evidenceId: record.evidenceId,
      baseVersion: 0
    });
    expect(pending[0].record.opId).toBe(record.opId);
  });

  it('keeps the device id once, across calls', async () => {
    const local = createStore();
    const first = await local.getDeviceId();
    const second = await local.getDeviceId();

    expect(first).toMatch(/^dev-/);
    expect(second).toBe(first);
    expect(await local.db.meta.where('key').equals('deviceId').count()).toBe(1);
  });

  it('appends a revision with the same evidenceId and queues one operation per change', async () => {
    const local = createStore();
    const first = await local.add(profileInput());
    const second = await local.revise(first.evidenceId, { origin: 'student_confirmed', value: 8.5 });

    expect(second.evidenceId).toBe(first.evidenceId);
    expect(second.version).toBe(2);
    expect(second.previousVersion).toBe(1);
    expect(second.syncState).toBe('pending');
    expect(await local.db.evidence.count()).toBe(2);

    const pending = await local.listPending();
    expect(pending.map((entry) => entry.operation)).toEqual(['add', 'revise']);
    expect(pending[1].baseVersion).toBe(1);
  });

  it('confirms an AI record and never lets AI overwrite the confirmation', async () => {
    const local = createStore();
    const ai = await local.add(profileInput({ origin: 'ai_generated', trust: 'unverified' }));
    const confirmed = await local.confirm(ai.evidenceId);

    expect(confirmed.version).toBe(2);
    expect(confirmed.origin).toBe('student_confirmed');
    expect(confirmed.linkedRef).toBe(`${ai.evidenceId}@1`);

    // The failing change aborts its transaction: no new version, no new op.
    await expect(local.revise(ai.evidenceId, { origin: 'ai_generated', value: 99 })).rejects.toBeInstanceOf(
      EvidenceConflictError
    );

    const history = await local.getHistory(ai.evidenceId);
    expect(history).toHaveLength(2);
    expect(history[1].status).toBe('active');
    expect(history[1].value).toBe(8.2);
    expect(await local.db.outbox.count()).toBe(2);
    expect(await local.db.evidence.count()).toBe(2);
  });

  it('rejects a record by appending a rejected version', async () => {
    const local = createStore();
    const record = await local.add(profileInput());
    const rejected = await local.reject(record.evidenceId);

    expect(rejected.version).toBe(2);
    expect(rejected.status).toBe('rejected');
    expect(await local.getCurrent('profile:p1')).toHaveLength(0); // no live fact left
    expect(await local.getHistory(record.evidenceId)).toHaveLength(2);
  });

  it('marks queued operations as synced and remembers the sync cursor', async () => {
    const local = createStore();
    const first = await local.add(profileInput());
    await local.revise(first.evidenceId, { origin: 'student_confirmed', value: 8.5 });

    const pending = await local.listPending();
    const cleared = await local.markSynced(
      pending.map((entry) => entry.opId),
      { cursor: 'cursor-7', serverSeq: 12, at: new Date('2026-10-22T10:00:00Z') }
    );

    expect(cleared).toBe(2);
    expect(await local.listPending()).toHaveLength(0);
    const history = await local.getHistory(first.evidenceId);
    expect(history.every((version) => version.syncState === 'synced')).toBe(true);
    expect(history[1].serverSeq).toBe(12);
    expect(await local.getMetaValue('lastSyncCursor')).toBe('cursor-7');
    expect(await local.getMetaValue('lastSyncedAt')).toBe('2026-10-22T10:00:00.000Z');
  });

  it('notifies subscribers on every change until they unsubscribe', async () => {
    const local = createStore();
    const seen: string[] = [];
    const unsubscribe = local.subscribe((event) => seen.push(event.type));

    const record = await local.add(profileInput());
    await local.revise(record.evidenceId, { origin: 'student_confirmed', value: 8.5 });
    expect(seen).toEqual(['add', 'revise']);

    const [pending] = await local.listPending();
    await local.markSynced([pending.opId]);
    expect(seen).toEqual(['add', 'revise', 'sync']);

    unsubscribe();
    await local.add(profileInput({ key: 'branch', value: 'CSE' }));
    expect(seen).toEqual(['add', 'revise', 'sync']);
  });
});

describe('local evidence store: history', () => {
  it('keeps every version in order and only the newest one is current', async () => {
    const local = createStore();
    const first = await local.add(profileInput({ origin: 'ai_generated', value: 8.2 }));
    await local.confirm(first.evidenceId);
    await local.revise(first.evidenceId, { origin: 'student_confirmed', value: 8.4 });

    const history = await local.getHistory(first.evidenceId);
    expect(history.map((version) => version.version)).toEqual([1, 2, 3]);
    expect(history[0].status).toBe('superseded');
    expect(history[1].status).toBe('superseded');
    expect(history[0].value).toBe(8.2); // earlier versions are never rewritten
    expect(history[2].status).toBe('active');

    const current = await local.getCurrent('profile:p1');
    expect(current).toHaveLength(1);
    expect(current[0].version).toBe(3);
    expect(current[0].value).toBe(8.4);

    expect(await local.getHistory('missing-id')).toEqual([]);
  });
});

describe('local evidence store: migration', () => {
  it('converts the profile, links, projects, checklist and tracker exactly once', async () => {
    const local = createStore();
    const storage = fakeStorage({
      [PROFILE_KEY]: PROFILE_JSON,
      [CHECKLIST_KEY]: CHECKLIST_JSON,
      [TRACKER_KEY]: TRACKER_JSON
    });

    const first = await local.migrate({ storage });
    expect(first.migrated).toBe(true);
    expect(first.reason).toBe('migrated');
    expect(first.sources).toEqual([PROFILE_KEY, CHECKLIST_KEY, TRACKER_KEY]);

    const written = await local.db.evidence.count();
    expect(written).toBe(first.records);
    expect(written).toBeGreaterThan(0);
    expect(await local.db.outbox.count()).toBe(written); // everything is queued

    const second = await local.migrate({ storage });
    expect(second).toEqual({ migrated: false, reason: 'already_migrated', records: 0, sources: [] });
    expect(await local.db.evidence.count()).toBe(written);
    expect(await local.getMetaValue(MIGRATION_FLAG)).toBeTruthy();
  });

  it('leaves the old localStorage data untouched as a backup', async () => {
    const local = createStore();
    const storage = fakeStorage({
      [PROFILE_KEY]: PROFILE_JSON,
      [CHECKLIST_KEY]: CHECKLIST_JSON,
      [TRACKER_KEY]: TRACKER_JSON
    });
    const before = storage.snapshot();

    await local.migrate({ storage });
    await local.migrate({ storage });

    expect(storage.snapshot()).toEqual(before);
  });

  it('makes profile facts student_confirmed and pasted opportunities user_provided', async () => {
    const local = createStore();
    const storage = fakeStorage({
      [PROFILE_KEY]: PROFILE_JSON,
      [CHECKLIST_KEY]: CHECKLIST_JSON,
      [TRACKER_KEY]: TRACKER_JSON
    });
    await local.migrate({ storage });

    // The profile lands under the same evidence ids the pages use later.
    const profile = await local.getCurrent('p1');
    expect(profile).toHaveLength(13);
    expect(profile.every((record) => record.origin === 'student_confirmed')).toBe(true);
    expect(profile.every((record) => record.trust === 'verified')).toBe(true);
    expect(profile.every((record) => record.subjectType === 'profile')).toBe(true);
    expect(profile.map((record) => record.key).sort()).toEqual(
      [
        'availabilityWeeks',
        'branch',
        'cgpa',
        'documents',
        'githubUrl',
        'hasResume',
        'links',
        'name',
        'portfolioUrl',
        'projects',
        'resumeUrl',
        'skills',
        'year'
      ].sort()
    );

    const requirements = await local.getCurrent('Summer Intern');
    expect(requirements).toHaveLength(1);
    expect(requirements[0].origin).toBe('user_provided');
    expect(requirements[0].subjectType).toBe('opportunity');
    expect(requirements[0].kind).toBe('year');
    expect(requirements[0].key).toBe('r1');
    expect(requirements[0].value).toEqual({ id: 'r1', label: 'Year', kind: 'year' });

    const tracked = await local.db.evidence.where('kind').equals('tracker_item').toArray();
    expect(tracked).toHaveLength(1);
    expect(tracked[0].origin).toBe('user_provided');
  });

  it('reports why there was nothing to migrate and still migrates later', async () => {
    const local = createStore();
    const empty = await local.migrate({ storage: fakeStorage() });

    expect(empty).toEqual({ migrated: false, reason: 'nothing_to_migrate', records: 0, sources: [] });
    expect(await local.getMetaValue(MIGRATION_FLAG)).toBeUndefined();

    const later = await local.migrate({ storage: fakeStorage({ [PROFILE_KEY]: PROFILE_JSON }) });
    expect(later.migrated).toBe(true);
    expect(later.sources).toEqual([PROFILE_KEY]);
  });

  it('reports blocked local storage instead of throwing', async () => {
    const local = createStore();
    const result = await local.migrate({ storage: null });

    expect(result).toEqual({ migrated: false, reason: 'unavailable', records: 0, sources: [] });
  });

  it('opens the database, creates the device id and migrates once', async () => {
    const local = createStore();
    const storage = fakeStorage({ [PROFILE_KEY]: PROFILE_JSON });

    const first = await local.init({ storage });
    expect(first.deviceId).toMatch(/^dev-/);
    expect(first.migration.reason).toBe('migrated');

    const second = await local.init({ storage });
    expect(second.deviceId).toBe(first.deviceId);
    expect(second.migration.reason).toBe('already_migrated');
  });
});

describe('local evidence store: storage errors', () => {
  it('explains a full device in plain words', () => {
    const quota = Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' });

    expect(toEvidenceStorageError(quota).code).toBe('quota_exceeded');
    expect(describeStorageError(quota)).toMatch(/full/i);
  });

  it('explains blocked local storage in plain words', () => {
    const blocked = Object.assign(new Error('indexedDB is not available'), { name: 'InvalidStateError' });

    expect(toEvidenceStorageError(blocked).code).toBe('unavailable');
    expect(describeStorageError(blocked)).toMatch(/local storage/i);
  });

  it('falls back to a plain retry message', () => {
    const unknown = toEvidenceStorageError(new Error('boom'));

    expect(unknown.code).toBe('unknown');
    expect(unknown.message).toMatch(/try again/i);
  });

  it('never turns a domain rule error into a storage error', async () => {
    await expect(
      withStorageErrors(async () => {
        throw new EvidenceConflictError('AI evidence cannot revise a student confirmed record.');
      })
    ).rejects.toBeInstanceOf(EvidenceConflictError);
  });

  it('surfaces quota failures from the database as a quota error', async () => {
    const local = createStore();
    const quota = Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' });
    (local.db as unknown as { transaction: () => Promise<never> }).transaction = () => Promise.reject(quota);

    await expect(local.add(profileInput())).rejects.toBeInstanceOf(EvidenceStorageError);
    await expect(local.add(profileInput())).rejects.toMatchObject({ code: 'quota_exceeded' });
    expect(await local.db.evidence.count()).toBe(0);
  });
});
