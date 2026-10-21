import { describe, it, expect } from 'vitest';
import {
  confirmEvidence,
  contentHash,
  createAdvisoryEvidence,
  createEvidence,
  currentVersion,
  historyOf,
  isStale,
  rejectEvidence,
  reviseEvidence,
  versionRef,
  EvidenceConflictError,
  EVIDENCE_KIND,
  type EvidenceRecord
} from '../src/evidence/index.js';

const NOW = new Date('2026-10-22T09:30:00Z');
const DEVICE = 'device-test';

function aiRecord(overrides: Partial<Parameters<typeof createEvidence>[0]> = {}): EvidenceRecord {
  return createEvidence({
    subjectType: 'profile',
    subjectId: 'profile-1',
    kind: EVIDENCE_KIND.GITHUB_DERIVED,
    key: 'github_repo_count',
    value: 4,
    origin: 'ai_generated',
    source: { type: 'github', url: 'https://github.com/student', agent: 'githubAnalyzer' },
    deviceId: DEVICE,
    now: NOW,
    ...overrides
  });
}

describe('Evidence model: versioning', () => {
  it('creates version 1 with sensible defaults', () => {
    const record = aiRecord();

    expect(record.version).toBe(1);
    expect(record.previousVersion).toBeUndefined();
    expect(record.status).toBe('active');
    expect(record.syncState).toBe('local_only');
    expect(record.trust).toBe('unverified');
    expect(record.observedAt).toBe(NOW.toISOString());
    expect(record.evidenceId).toMatch(/^ev-/);
    expect(record.opId).toMatch(/^op-/);
  });

  it('appends version n+1 with the same evidenceId and a previousVersion link', () => {
    const first = aiRecord();
    const { record: second } = reviseEvidence([first], {
      origin: 'ai_generated',
      value: 6,
      observedAt: '2026-10-23T09:30:00Z',
      now: new Date('2026-10-23T09:30:00Z')
    });

    expect(second.evidenceId).toBe(first.evidenceId);
    expect(second.version).toBe(2);
    expect(second.previousVersion).toBe(1);
    expect(second.value).toBe(6);
    expect(second.status).toBe('active');
    expect(second.opId).not.toBe(first.opId);

    const { record: third } = reviseEvidence([first, second], {
      origin: 'user_provided',
      value: 7,
      now: new Date('2026-10-24T09:30:00Z')
    });
    expect(third.version).toBe(3);
    expect(third.previousVersion).toBe(2);
  });

  it('marks the student confirming an AI record and rejects re-confirming', () => {
    const ai = aiRecord();
    const { record: confirmed, history } = confirmEvidence([ai], { now: NOW });

    expect(confirmed.version).toBe(2);
    expect(confirmed.origin).toBe('student_confirmed');
    expect(confirmed.trust).toBe('verified');
    expect(confirmed.linkedRef).toBe(versionRef(ai));
    expect(currentVersion(history)).toEqual(confirmed);

    expect(() => confirmEvidence(history, { now: NOW })).toThrow(/already student confirmed/i);
  });

  it('appends a rejected version instead of editing the record', () => {
    const ai = aiRecord();
    const { record: rejected, history } = rejectEvidence([ai], { now: NOW });

    expect(rejected.version).toBe(2);
    expect(rejected.status).toBe('rejected');
    expect(rejected.origin).toBe('student_confirmed');
    expect(history).toHaveLength(2);
    expect(history[0].status).toBe('superseded');
  });
});

describe('Evidence model: history is kept', () => {
  it('keeps every earlier version and never changes its stored content', () => {
    const first = aiRecord();
    const { record: second, history } = reviseEvidence([first], {
      origin: 'ai_generated',
      value: 9,
      now: new Date('2026-10-25T09:30:00Z')
    });

    expect(history).toHaveLength(2);
    expect(history.map((r) => r.version)).toEqual([1, 2]);
    expect(history[0].value).toBe(4);
    expect(history[0].evidenceId).toBe(first.evidenceId);
    expect(contentHash(history[0])).toBe(contentHash(first));
    expect(currentVersion(history).version).toBe(2);
    expect(second.value).toBe(9);

    expect(historyOf(first.evidenceId, [...history, aiRecord()])).toHaveLength(2);
    expect(historyOf('missing-id', history)).toEqual([]);
  });

  it('fails clearly when there is no history to work with', () => {
    expect(() => currentVersion([])).toThrow(/history is empty/i);
    expect(() =>
      reviseEvidence([], { origin: 'ai_generated', value: 1, now: NOW })
    ).toThrow(/history is empty/i);
  });
});

describe('Evidence model: AI never overwrites a student confirmed record', () => {
  it('refuses an ai_generated revision of a student_confirmed record', () => {
    const ai = aiRecord();
    const { history } = confirmEvidence([ai], { now: NOW });

    expect(() =>
      reviseEvidence(history, { origin: 'ai_generated', value: 99, now: NOW })
    ).toThrow(EvidenceConflictError);

    // The confirmed history is untouched.
    expect(currentVersion(history).origin).toBe('student_confirmed');
    expect(currentVersion(history).value).toBe(4);
    expect(history).toHaveLength(2);
  });

  it('records the AI change as a separate advisory record linked to the confirmed one', () => {
    const ai = aiRecord();
    const confirmedHistory = confirmEvidence([ai], { now: NOW }).history;
    const confirmed = currentVersion(confirmedHistory);

    const advisory = createAdvisoryEvidence({
      subjectType: 'profile',
      subjectId: 'profile-1',
      kind: EVIDENCE_KIND.GITHUB_DERIVED,
      key: 'github_repo_count',
      value: 12,
      source: { type: 'github', agent: 'githubAnalyzer' },
      linkedRef: versionRef(confirmed),
      deviceId: DEVICE,
      now: NOW
    });

    expect(advisory.evidenceId).not.toBe(confirmed.evidenceId);
    expect(advisory.version).toBe(1);
    expect(advisory.origin).toBe('ai_generated');
    expect(advisory.trust).toBe('needs_review');
    expect(advisory.linkedRef).toBe(versionRef(confirmed));
    expect(currentVersion(confirmedHistory).version).toBe(confirmed.version);
  });

  it('still allows a student change to revise a student_confirmed record', () => {
    const confirmedRecord = createEvidence({
      subjectType: 'profile',
      subjectId: 'profile-1',
      kind: 'cgpa',
      key: 'cgpa',
      value: 8.2,
      origin: 'student_confirmed',
      source: { type: 'profile_form' },
      deviceId: DEVICE,
      now: NOW
    });

    const { record } = reviseEvidence([confirmedRecord], {
      origin: 'student_confirmed',
      value: 8.5,
      now: new Date('2026-11-01T09:30:00Z')
    });

    expect(record.version).toBe(2);
    expect(record.origin).toBe('student_confirmed');
    expect(record.trust).toBe('verified');
    expect(record.value).toBe(8.5);
  });
});

describe('Evidence model: content hashing', () => {
  it('ignores version, ids and sync bookkeeping but follows the value', () => {
    const first = aiRecord();
    const { record: second } = reviseEvidence([first], {
      origin: 'ai_generated',
      value: 4,
      now: new Date('2026-11-05T09:30:00Z')
    });

    expect(second.version).toBe(2);
    expect(contentHash(second)).toBe(contentHash(first));

    const changed = reviseEvidence([first], {
      origin: 'ai_generated',
      value: 5,
      now: new Date('2026-11-05T09:30:00Z')
    }).record;
    expect(contentHash(changed)).not.toBe(contentHash(first));
  });

  it('is stable across key order inside an object value', () => {
    const a = aiRecord({ value: { repos: 4, stars: 12 } });
    const b = aiRecord({ value: { stars: 12, repos: 4 } });

    expect(contentHash(a)).toBe(contentHash(b));
  });

  it('is stable across devices and observation times of the same fact', () => {
    const a = aiRecord({ deviceId: 'device-a', observedAt: '2026-10-22T09:30:00.000Z' });
    const b = aiRecord({
      deviceId: 'device-b',
      now: new Date('2026-09-01T00:00:00Z'),
      observedAt: '2026-09-01T00:00:00.000Z'
    });

    expect(contentHash(a)).toBe(contentHash(b));

    const otherOrigin = aiRecord({ origin: 'student_confirmed', trust: 'verified' });
    expect(contentHash(otherOrigin)).not.toBe(contentHash(a));
  });
});

describe('Evidence model: staleness', () => {
  const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

  it('expires researched facts after 7 days', () => {
    const record = aiRecord({ kind: EVIDENCE_KIND.RESEARCHED_FACT });

    expect(isStale(record, days(6))).toBe(false);
    expect(isStale(record, days(7))).toBe(false);
    expect(isStale(record, days(8))).toBe(true);
  });

  it('expires GitHub derived facts after 30 days', () => {
    const record = aiRecord({ kind: EVIDENCE_KIND.GITHUB_DERIVED });

    expect(isStale(record, days(29))).toBe(false);
    expect(isStale(record, days(31))).toBe(true);
  });

  it('expires pasted profile text analysis after 90 days', () => {
    const record = aiRecord({ kind: EVIDENCE_KIND.PROFILE_TEXT_ANALYSIS });

    expect(isStale(record, days(89))).toBe(false);
    expect(isStale(record, days(91))).toBe(true);
  });

  it('never expires a student confirmed record', () => {
    const record = createEvidence({
      subjectType: 'profile',
      subjectId: 'profile-1',
      kind: EVIDENCE_KIND.RESEARCHED_FACT,
      key: 'availability',
      value: '8 weeks',
      origin: 'student_confirmed',
      source: { type: 'profile_form' },
      deviceId: DEVICE,
      now: NOW
    });

    expect(isStale(record, days(3650))).toBe(false);
  });

  it('honours validUntil and ignores history versions', () => {
    const expiring = aiRecord({ validUntil: '2026-11-01T00:00:00.000Z' });
    expect(isStale(expiring, days(1))).toBe(false);
    expect(isStale(expiring, days(20))).toBe(true);

    const rejectedHistory = rejectEvidence([aiRecord()], { now: NOW }).history;
    expect(isStale(rejectedHistory[0], days(400))).toBe(false); // superseded
    expect(isStale(rejectedHistory[1], days(400))).toBe(false); // rejected
  });

  it('treats a kind without an age rule as never stale', () => {
    const record = aiRecord({ kind: 'custom_kind' });
    expect(isStale(record, days(5000))).toBe(false);
  });
});
