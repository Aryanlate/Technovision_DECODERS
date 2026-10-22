import { describe, expect, it } from 'vitest';
import {
  classifyEvidence,
  createEvidence,
  currentVersion,
  historyOf,
  mergeSync,
  type EvidenceRecord,
  type SyncInput,
  type SyncOutboxOp,
  type SyncResult
} from '../src/index.js';

const NOW = new Date('2026-10-22T09:30:00Z');
const DAY = 86_400_000;

function record(overrides: Partial<EvidenceRecord> & { origin?: EvidenceRecord['origin']; value?: unknown }): EvidenceRecord {
  const origin = overrides.origin ?? 'student_confirmed';
  const base = createEvidence({
    evidenceId: overrides.evidenceId ?? 'ev-cgpa',
    subjectType: 'profile',
    subjectId: 'profile-1',
    kind: 'cgpa',
    key: 'cgpa',
    value: overrides.value ?? 8.2,
    origin,
    source: overrides.source ?? { type: origin === 'ai_generated' ? 'github' : 'profile_form' },
    deviceId: overrides.deviceId ?? 'device-a',
    opId: overrides.opId ?? 'op-1',
    now: NOW
  });
  return { ...base, ...overrides, origin };
}

function op(
  rec: EvidenceRecord,
  extra: Partial<SyncOutboxOp> & { operation?: SyncOutboxOp['operation'] } = {}
): SyncOutboxOp {
  return {
    opId: rec.opId,
    operation: extra.operation ?? (rec.version === 1 ? 'add' : 'revise'),
    evidenceId: rec.evidenceId,
    record: rec,
    baseVersion: extra.baseVersion ?? rec.previousVersion ?? 0,
    createdAt: extra.createdAt ?? rec.createdAt
  };
}

function allVersions(local: EvidenceRecord[], result: SyncResult, evidenceId: string): EvidenceRecord[] {
  const pushed = result.toPushToServer.map((item) => item.record);
  return historyOf(evidenceId, [...local, ...result.toApplyLocally, ...pushed]);
}

interface SyncCase {
  name: string;
  input: SyncInput;
  check: (result: SyncResult) => void;
}

const v1 = record({
  evidenceId: 'ev-cgpa',
  version: 1,
  opId: 'op-v1',
  origin: 'user_provided',
  value: 8.0,
  serverSeq: 1,
  status: 'superseded'
});

const cases: SyncCase[] = [
  {
    name: 'rule 1: apply server changes in serverSeq order, never by device clocks',
    input: {
      now: NOW,
      outbox: [],
      localRecords: [v1],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 3,
          previousVersion: 2,
          opId: 'op-late-clock',
          origin: 'ai_generated',
          value: 9.0,
          serverSeq: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
          observedAt: '2026-01-01T00:00:00.000Z',
          deviceId: 'device-b'
        }),
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-early-clock',
          origin: 'ai_generated',
          value: 8.5,
          serverSeq: 2,
          createdAt: '2026-12-01T00:00:00.000Z',
          observedAt: '2026-12-01T00:00:00.000Z',
          deviceId: 'device-c'
        })
      ]
    },
    check: (result) => {
      expect(result.toApplyLocally.map((row) => row.serverSeq)).toEqual([2, 3]);
      expect(result.toApplyLocally.map((row) => row.opId)).toEqual(['op-early-clock', 'op-late-clock']);
      expect(result.toApplyLocally[0].createdAt > result.toApplyLocally[1].createdAt).toBe(true);
      const current = currentVersion(allVersions([v1], result, 'ev-cgpa'));
      expect(current.version).toBe(3);
      expect(current.value).toBe(9.0);
    }
  },
  {
    name: 'rule 2: concurrent edits are detected from baseVersion, not clocks',
    input: {
      now: NOW,
      localRecords: [v1],
      outbox: [
        op(
          record({
            evidenceId: 'ev-cgpa',
            version: 2,
            previousVersion: 1,
            opId: 'op-local-v2',
            origin: 'student_confirmed',
            value: 8.2,
            createdAt: '2026-10-20T00:00:00.000Z',
            deviceId: 'device-a'
          }),
          { baseVersion: 1, operation: 'confirm' }
        )
      ],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-remote-v2',
          origin: 'student_confirmed',
          value: 8.9,
          serverSeq: 2,
          createdAt: '2026-10-01T00:00:00.000Z',
          deviceId: 'device-b'
        })
      ]
    },
    check: (result) => {
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].evidenceId).toBe('ev-cgpa');
      expect(result.conflicts[0].remote.value).toBe(8.9);
      expect(result.conflicts[0].local.value).toBe(8.2);
      expect(result.conflicts[0].local.status).toBe('conflicted');
    }
  },
  {
    name: 'rule 3: ai_generated never overwrites student_confirmed; AI is kept as advisory with a notice',
    input: {
      now: NOW,
      localRecords: [
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-confirmed',
          origin: 'student_confirmed',
          value: 8.2,
          status: 'active',
          serverSeq: 2
        })
      ],
      outbox: [],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 3,
          previousVersion: 2,
          opId: 'op-ai-overwrite',
          origin: 'ai_generated',
          value: 9.9,
          serverSeq: 3,
          deviceId: 'device-agent'
        })
      ]
    },
    check: (result) => {
      expect(result.toApplyLocally).toHaveLength(1);
      const advisory = result.toApplyLocally[0];
      expect(advisory.origin).toBe('ai_generated');
      expect(advisory.evidenceId).not.toBe('ev-cgpa');
      expect(advisory.linkedRef).toBe('ev-cgpa@2');
      expect(advisory.trust).toBe('needs_review');
      expect(result.notices.some((note) => note.code === 'AI_DID_NOT_OVERWRITE')).toBe(true);
      const current = currentVersion(
        historyOf('ev-cgpa', [
          record({
            evidenceId: 'ev-cgpa',
            version: 2,
            previousVersion: 1,
            opId: 'op-confirmed',
            origin: 'student_confirmed',
            value: 8.2,
            serverSeq: 2
          }),
          ...result.toApplyLocally
        ])
      );
      expect(current.origin).toBe('student_confirmed');
      expect(current.value).toBe(8.2);
    }
  },
  {
    name: 'rule 4: student_confirmed vs student_confirmed with different values is a conflict; both versions kept',
    input: {
      now: NOW,
      localRecords: [v1],
      outbox: [
        op(
          record({
            evidenceId: 'ev-cgpa',
            version: 2,
            previousVersion: 1,
            opId: 'op-local-8-2',
            origin: 'student_confirmed',
            value: 8.2,
            deviceId: 'device-a'
          }),
          { baseVersion: 1, operation: 'confirm' }
        )
      ],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-remote-8-5',
          origin: 'student_confirmed',
          value: 8.5,
          serverSeq: 2,
          deviceId: 'device-b'
        })
      ]
    },
    check: (result) => {
      expect(result.conflicts).toHaveLength(1);
      const localStore = [
        v1,
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-local-8-2',
          origin: 'student_confirmed',
          value: 8.2
        })
      ];
      const history = allVersions(localStore, result, 'ev-cgpa');
      const values = history.map((row) => row.value);
      expect(values).toContain(8.5);
      expect(values).toContain(8.2);
      const current = currentVersion(history);
      expect(current.status).toBe('conflicted');
      const verdict = classifyEvidence(current, NOW);
      expect(verdict.reasonCode).toBe('CONFLICT');
      expect(verdict.confirmed).toBe(false);
      expect(result.toPushToServer[0].record.status).toBe('conflicted');
    }
  },
  {
    name: 'rule 5: ai_generated vs ai_generated — newer server version is current, older stays in history',
    input: {
      now: NOW,
      localRecords: [v1],
      outbox: [],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-ai-old',
          origin: 'ai_generated',
          value: 7.1,
          serverSeq: 2
        }),
        record({
          evidenceId: 'ev-cgpa',
          version: 3,
          previousVersion: 2,
          opId: 'op-ai-new',
          origin: 'ai_generated',
          value: 7.4,
          serverSeq: 3
        })
      ]
    },
    check: (result) => {
      expect(result.toApplyLocally).toHaveLength(2);
      const history = allVersions([v1], result, 'ev-cgpa');
      expect(history.map((row) => row.version)).toEqual([1, 2, 3]);
      expect(history[1].value).toBe(7.1);
      expect(currentVersion(history).value).toBe(7.4);
      expect(currentVersion(history).opId).toBe('op-ai-new');
    }
  },
  {
    name: 'rule 6: student rejection beats an AI re-suggestion of the same value',
    input: {
      now: NOW,
      localRecords: [
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-rejected',
          origin: 'student_confirmed',
          status: 'rejected',
          value: 4,
          serverSeq: 2
        })
      ],
      outbox: [],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 3,
          previousVersion: 2,
          opId: 'op-ai-again',
          origin: 'ai_generated',
          value: 4,
          serverSeq: 3
        })
      ]
    },
    check: (result) => {
      expect(result.notices.some((note) => note.code === 'REJECTED_BEATS_AI')).toBe(true);
      expect(result.toApplyLocally.every((row) => row.evidenceId !== 'ev-cgpa')).toBe(true);
      const advisory = result.toApplyLocally[0];
      expect(advisory.origin).toBe('ai_generated');
      expect(advisory.linkedRef).toBe('ev-cgpa@2');
      const current = currentVersion(
        historyOf('ev-cgpa', [
          record({
            evidenceId: 'ev-cgpa',
            version: 2,
            previousVersion: 1,
            opId: 'op-rejected',
            origin: 'student_confirmed',
            status: 'rejected',
            value: 4,
            serverSeq: 2
          }),
          ...result.toApplyLocally
        ])
      );
      expect(current.status).toBe('rejected');
      expect(current.value).toBe(4);
    }
  },
  {
    name: 'rule 6b: student deletion in the outbox beats a concurrent AI re-suggestion of the same value',
    input: {
      now: NOW,
      localRecords: [v1],
      outbox: [
        op(
          record({
            evidenceId: 'ev-cgpa',
            version: 2,
            previousVersion: 1,
            opId: 'op-delete',
            origin: 'student_confirmed',
            status: 'rejected',
            value: 8.0
          }),
          { baseVersion: 1, operation: 'delete' }
        )
      ],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-ai-same-value',
          origin: 'ai_generated',
          value: 8.0,
          serverSeq: 2
        })
      ]
    },
    check: (result) => {
      expect(result.notices.some((note) => note.code === 'REJECTED_BEATS_AI')).toBe(true);
      expect(result.toPushToServer.some((item) => item.operation === 'delete')).toBe(true);
      expect(result.toApplyLocally.some((row) => row.opId === 'op-ai-same-value')).toBe(false);
    }
  },
  {
    name: 'rule 7: duplicate opIds are ignored',
    input: {
      now: NOW,
      localRecords: [v1],
      outbox: [
        op(
          record({
            evidenceId: 'ev-year',
            key: 'year',
            kind: 'year',
            version: 1,
            opId: 'op-dup-local',
            origin: 'student_confirmed',
            value: 2
          }),
          { baseVersion: 0 }
        ),
        op(
          record({
            evidenceId: 'ev-year',
            key: 'year',
            kind: 'year',
            version: 1,
            opId: 'op-dup-local',
            origin: 'student_confirmed',
            value: 3
          }),
          { baseVersion: 0 }
        )
      ],
      serverChanges: [
        record({
          evidenceId: 'ev-skills',
          key: 'skills',
          kind: 'skills',
          version: 1,
          opId: 'op-dup-server',
          origin: 'ai_generated',
          value: ['HTML'],
          serverSeq: 4
        }),
        record({
          evidenceId: 'ev-skills',
          key: 'skills',
          kind: 'skills',
          version: 1,
          opId: 'op-dup-server',
          origin: 'ai_generated',
          value: ['CSS'],
          serverSeq: 5
        })
      ]
    },
    check: (result) => {
      expect(result.notices.filter((note) => note.code === 'DUPLICATE_OP').length).toBeGreaterThanOrEqual(2);
      expect(result.toApplyLocally.filter((row) => row.opId === 'op-dup-server')).toHaveLength(1);
      expect(result.toApplyLocally[0].value).toEqual(['HTML']);
      expect(result.toPushToServer.filter((item) => item.opId === 'op-dup-local')).toHaveLength(1);
      expect(result.toPushToServer[0].record.value).toBe(2);
    }
  },
  {
    name: 'rule 8: every merge keeps all versions',
    input: {
      now: NOW,
      localRecords: [v1],
      outbox: [
        op(
          record({
            evidenceId: 'ev-cgpa',
            version: 2,
            previousVersion: 1,
            opId: 'op-keep-local',
            origin: 'student_confirmed',
            value: 8.2
          }),
          { baseVersion: 1, operation: 'confirm' }
        )
      ],
      serverChanges: [
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-keep-remote',
          origin: 'student_confirmed',
          value: 8.8,
          serverSeq: 2
        })
      ]
    },
    check: (result) => {
      const localStore = [
        v1,
        record({
          evidenceId: 'ev-cgpa',
          version: 2,
          previousVersion: 1,
          opId: 'op-keep-local',
          origin: 'student_confirmed',
          value: 8.2
        })
      ];
      const history = allVersions(localStore, result, 'ev-cgpa');
      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history.map((row) => row.opId)).toEqual(expect.arrayContaining(['op-v1', 'op-keep-remote', 'op-keep-local']));
    }
  },
  {
    name: 'repeated sync is idempotent',
    input: {
      now: NOW,
      localRecords: [v1],
      outbox: [
        op(
          record({
            evidenceId: 'ev-branch',
            key: 'branch',
            kind: 'branch',
            version: 1,
            opId: 'op-offline-branch',
            origin: 'student_confirmed',
            value: 'CSE'
          }),
          { baseVersion: 0, operation: 'add' }
        )
      ],
      serverChanges: [
        record({
          evidenceId: 'ev-skills',
          key: 'skills',
          kind: 'skills',
          version: 1,
          opId: 'op-server-skills',
          origin: 'ai_generated',
          value: ['HTML'],
          serverSeq: 8
        })
      ]
    },
    check: (result) => {
      const localAfter = [v1, ...result.toApplyLocally, ...result.toPushToServer.map((item) => item.record)];
      const serverAfter = [
        ...result.toApplyLocally.filter((row) => row.serverSeq !== undefined),
        ...result.toPushToServer.map((item, index) => ({
          ...item.record,
          serverSeq: 100 + index
        }))
      ];
      const again = mergeSync({
        now: NOW,
        localRecords: localAfter,
        outbox: result.toPushToServer,
        serverChanges: serverAfter
      });
      expect(again.toApplyLocally).toEqual([]);
      expect(again.toPushToServer).toEqual([]);
      expect(again.conflicts).toEqual([]);
    }
  },
  {
    name: 'offline edits for several days are pushed in version order, not clock order',
    input: {
      now: NOW,
      localRecords: [],
      outbox: [
        op(
          record({
            evidenceId: 'ev-cgpa',
            version: 3,
            previousVersion: 2,
            opId: 'op-day-8',
            origin: 'student_confirmed',
            value: 8.6,
            createdAt: new Date(NOW.getTime() + 8 * DAY).toISOString(),
            deviceId: 'device-a'
          }),
          { baseVersion: 2, createdAt: new Date(NOW.getTime() + 8 * DAY).toISOString() }
        ),
        op(
          record({
            evidenceId: 'ev-cgpa',
            version: 1,
            opId: 'op-day-0',
            origin: 'student_confirmed',
            value: 8.2,
            createdAt: NOW.toISOString(),
            deviceId: 'device-a'
          }),
          { baseVersion: 0, createdAt: NOW.toISOString(), operation: 'add' }
        ),
        op(
          record({
            evidenceId: 'ev-cgpa',
            version: 2,
            previousVersion: 1,
            opId: 'op-day-3',
            origin: 'student_confirmed',
            value: 8.4,
            createdAt: new Date(NOW.getTime() + 3 * DAY).toISOString(),
            deviceId: 'device-a'
          }),
          { baseVersion: 1, createdAt: new Date(NOW.getTime() + 3 * DAY).toISOString() }
        )
      ],
      serverChanges: []
    },
    check: (result) => {
      expect(result.toApplyLocally).toEqual([]);
      expect(result.toPushToServer.map((item) => item.opId)).toEqual(['op-day-0', 'op-day-3', 'op-day-8']);
      expect(result.toPushToServer.map((item) => item.record.version)).toEqual([1, 2, 3]);
    }
  },
  {
    name: 'two devices confirming different values keep both and report CONFLICT',
    input: {
      now: NOW,
      localRecords: [
        record({
          evidenceId: 'ev-availability',
          key: 'availability',
          kind: 'availability',
          version: 1,
          opId: 'op-avail-1',
          origin: 'user_provided',
          value: null,
          serverSeq: 1,
          status: 'superseded'
        })
      ],
      outbox: [
        op(
          record({
            evidenceId: 'ev-availability',
            key: 'availability',
            kind: 'availability',
            version: 2,
            previousVersion: 1,
            opId: 'op-device-a-confirm',
            origin: 'student_confirmed',
            value: '8 weeks',
            deviceId: 'device-a'
          }),
          { baseVersion: 1, operation: 'confirm' }
        )
      ],
      serverChanges: [
        record({
          evidenceId: 'ev-availability',
          key: 'availability',
          kind: 'availability',
          version: 2,
          previousVersion: 1,
          opId: 'op-device-b-confirm',
          origin: 'student_confirmed',
          value: '6 weeks',
          serverSeq: 2,
          deviceId: 'device-b'
        })
      ]
    },
    check: (result) => {
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].local.value).toBe('8 weeks');
      expect(result.conflicts[0].remote.value).toBe('6 weeks');
      const localStore = [
        record({
          evidenceId: 'ev-availability',
          key: 'availability',
          kind: 'availability',
          version: 1,
          opId: 'op-avail-1',
          origin: 'user_provided',
          value: null,
          serverSeq: 1,
          status: 'superseded'
        }),
        record({
          evidenceId: 'ev-availability',
          key: 'availability',
          kind: 'availability',
          version: 2,
          previousVersion: 1,
          opId: 'op-device-a-confirm',
          origin: 'student_confirmed',
          value: '8 weeks',
          deviceId: 'device-a'
        })
      ];
      const current = currentVersion(allVersions(localStore, result, 'ev-availability'));
      expect(current.status).toBe('conflicted');
      expect(classifyEvidence(current, NOW).reasonCode).toBe('CONFLICT');
      const kept = allVersions(localStore, result, 'ev-availability').map((row) => row.value);
      expect(kept).toEqual(expect.arrayContaining(['6 weeks', '8 weeks']));
    }
  }
];

describe('sync engine (pure merge)', () => {
  it.each(cases.map((entry) => [entry.name, entry] as const))('%s', (_name, entry) => {
    const result = mergeSync(entry.input);
    entry.check(result);
  });
});
