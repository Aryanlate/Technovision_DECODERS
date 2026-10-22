import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createEvidence, reviseEvidence, type EvidenceRecord } from '@opportunity-kit/shared';
import {
  EvidenceStoreError,
  JsonFileEvidenceStore,
  MemoryEvidenceStore,
  SupabaseEvidenceStore,
  type ServerEvidenceStore
} from '../src/store/index.js';

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-10-22T09:30:00Z');

function makeRecord(overrides: Partial<Parameters<typeof createEvidence>[0]> = {}): EvidenceRecord {
  return createEvidence({
    subjectType: 'profile',
    subjectId: 'profile-1',
    kind: 'cgpa',
    key: 'cgpa',
    value: 8.2,
    origin: 'student_confirmed',
    source: { type: 'profile_form' },
    deviceId: 'device-test',
    now: NOW,
    ...overrides
  });
}

function describeStoreContract(
  name: string,
  createStore: () => Promise<{ store: ServerEvidenceStore; dispose?: () => Promise<void> }>
): void {
  describe(name, () => {
    let dispose: (() => Promise<void>) | undefined;

    afterEach(async () => {
      if (dispose) await dispose();
      dispose = undefined;
    });

    async function setup(): Promise<ServerEvidenceStore> {
      const created = await createStore();
      dispose = created.dispose;
      return created.store;
    }

    it('is append-only: earlier versions stay stored with their original content', async () => {
      const store = await setup();
      const first = makeRecord({ value: 8.2 });
      const storedFirst = await store.appendVersion(USER_A, first);
      expect(storedFirst.serverSeq).toBeGreaterThan(0);

      const second = reviseEvidence([first], {
        origin: 'student_confirmed',
        value: 8.5,
        now: new Date('2026-11-01T09:30:00Z')
      }).record;

      const storedSecond = await store.appendVersion(USER_A, second);
      expect(storedSecond.version).toBe(2);
      expect(storedSecond.value).toBe(8.5);
      expect(storedSecond.serverSeq).toBeGreaterThan(storedFirst.serverSeq as number);

      const current = await store.getCurrent(USER_A);
      expect(current).toHaveLength(1);
      expect(current[0].version).toBe(2);
      expect(current[0].value).toBe(8.5);

      const page = await store.getSince(USER_A, '0');
      expect(page.records).toHaveLength(2);
      const v1 = page.records.find((row) => row.version === 1);
      expect(v1?.value).toBe(8.2);
      expect(v1?.opId).toBe(first.opId);
      expect(v1?.createdAt).toBe(first.createdAt);

      // Mutating a returned record must not rewrite the store.
      current[0].value = 99;
      const again = await store.getCurrent(USER_A, first.evidenceId);
      expect(again[0].value).toBe(8.5);
    });

    it('is idempotent: replaying the same opId does not insert another row', async () => {
      const store = await setup();
      const record = makeRecord();
      const first = await store.appendVersion(USER_A, record);
      expect(await store.hasOp(USER_A, record.opId)).toBe(true);

      const replay = await store.appendVersion(USER_A, { ...record, value: 'should-be-ignored' });
      expect(replay.opId).toBe(first.opId);
      expect(replay.serverSeq).toBe(first.serverSeq);
      expect(replay.value).toBe(8.2);

      const page = await store.getSince(USER_A, null);
      expect(page.records).toHaveLength(1);
    });

    it('pages with a server_seq cursor and isolates users', async () => {
      const store = await setup();
      const a1 = await store.appendVersion(USER_A, makeRecord({ key: 'year', value: 2 }));
      const other = await store.appendVersion(USER_B, makeRecord({ key: 'year', value: 3 }));
      const a2 = await store.appendVersion(USER_A, makeRecord({ key: 'branch', value: 'CSE' }));
      const a3 = await store.appendVersion(
        USER_A,
        makeRecord({ key: 'skills', value: ['HTML', 'CSS'] })
      );

      expect(other.serverSeq).toBeDefined();

      const allA = await store.getSince(USER_A, '0');
      expect(allA.records.map((row) => row.key)).toEqual(['year', 'branch', 'skills']);
      expect(allA.nextCursor).toBe(String(a3.serverSeq));

      const afterFirst = await store.getSince(USER_A, String(a1.serverSeq));
      expect(afterFirst.records.map((row) => row.key)).toEqual(['branch', 'skills']);
      expect(afterFirst.records.every((row) => (row.serverSeq ?? 0) > (a1.serverSeq ?? 0))).toBe(true);

      const empty = await store.getSince(USER_A, String(a3.serverSeq));
      expect(empty.records).toEqual([]);
      expect(empty.nextCursor).toBe(String(a3.serverSeq));

      const userB = await store.getSince(USER_B, '0');
      expect(userB.records).toHaveLength(1);
      expect(userB.records[0].key).toBe('year');
      expect(await store.hasOp(USER_A, other.opId)).toBe(false);

      const currentA = await store.getCurrent(USER_A);
      expect(currentA.map((row) => row.key).sort()).toEqual(['branch', 'skills', 'year']);
    });

    it('refuses a different opId for an already stored evidenceId+version', async () => {
      const store = await setup();
      const record = makeRecord();
      await store.appendVersion(USER_A, record);

      await expect(
        store.appendVersion(USER_A, { ...record, opId: 'op-different' })
      ).rejects.toThrow(EvidenceStoreError);
    });
  });
}

describeStoreContract('MemoryEvidenceStore', async () => ({ store: new MemoryEvidenceStore() }));

describeStoreContract('JsonFileEvidenceStore', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ok-evidence-'));
  const filePath = path.join(dir, 'evidence.json');
  return {
    store: new JsonFileEvidenceStore(filePath),
    dispose: async () => {
      await rm(dir, { recursive: true, force: true });
    }
  };
});

describe('JsonFileEvidenceStore persistence on disk', () => {
  it('reloads versions after a new store is opened on the same file', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'ok-evidence-'));
    const filePath = path.join(dir, 'evidence.json');
    try {
      const firstStore = new JsonFileEvidenceStore(filePath);
      const record = makeRecord();
      const saved = await firstStore.appendVersion(USER_A, record);

      const raw = await readFile(filePath, 'utf8');
      expect(raw).toContain(record.evidenceId);

      const reopened = new JsonFileEvidenceStore(filePath);
      expect(await reopened.hasOp(USER_A, record.opId)).toBe(true);
      const current = await reopened.getCurrent(USER_A);
      expect(current[0].serverSeq).toBe(saved.serverSeq);
      expect(current[0].value).toBe(8.2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Fake Supabase: only insert + select. update/delete would fail the tests.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

class FakeQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private sortKey: string | null = null;
  private pendingInsert: Row | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';

  constructor(
    private readonly tables: Map<string, Row[]>,
    private readonly tableName: string,
    private readonly seq: { value: number }
  ) {}

  insert(payload: Row): this {
    this.pendingInsert = { ...payload };
    return this;
  }

  select(_columns?: string): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push((row) => Number(row[column]) > Number(value));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.sortKey = column;
    this.filters.push(() => true);
    this._ascending = options?.ascending !== false;
    return this;
  }

  private _ascending = true;

  async maybeSingle(): Promise<{ data: Row | null; error: null }> {
    this.mode = 'maybe';
    const { data } = await this.execute();
    return { data: Array.isArray(data) ? (data[0] ?? null) : data, error: null };
  }

  async single(): Promise<{ data: Row | null; error: { code?: string; message: string } | null }> {
    this.mode = 'single';
    return this.execute();
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[] | Row | null; error: { code?: string; message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute(): Promise<{ data: Row[] | Row | null; error: { code?: string; message: string } | null }> {
    const table = this.tables.get(this.tableName) ?? [];

    if (this.pendingInsert) {
      const row = { ...this.pendingInsert };
      if (this.tableName === 'evidence_versions') {
        const dupPk = table.some(
          (existing) =>
            existing.evidence_id === row.evidence_id &&
            existing.version === row.version &&
            existing.user_id === row.user_id
        );
        const dupOp = table.some((existing) => existing.op_id === row.op_id);
        if (dupPk || dupOp) {
          return Promise.resolve({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' }
          });
        }
        this.seq.value += 1;
        row.server_seq = this.seq.value;
        row.received_at = new Date().toISOString();
      }
      if (this.tableName === 'sync_ops') {
        if (table.some((existing) => existing.op_id === row.op_id)) {
          return Promise.resolve({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' }
          });
        }
        row.applied_at = row.applied_at ?? new Date().toISOString();
      }
      table.push(row);
      this.tables.set(this.tableName, table);
      if (this.mode === 'single' || this.mode === 'maybe') {
        return Promise.resolve({ data: row, error: null });
      }
      return Promise.resolve({ data: [row], error: null });
    }

    let rows = table.filter((row) => this.filters.every((fn) => fn(row)));
    if (this.tableName === 'evidence_current') {
      const latest = new Map<string, Row>();
      for (const row of this.tables.get('evidence_versions') ?? []) {
        if (!this.filters.every((fn) => fn(row))) continue;
        const key = String(row.evidence_id);
        const current = latest.get(key);
        if (!current || Number(row.version) > Number(current.version)) latest.set(key, row);
      }
      rows = [...latest.values()];
    }
    if (this.sortKey) {
      const key = this.sortKey;
      rows = [...rows].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === 'number' && typeof bv === 'number') return this._ascending ? av - bv : bv - av;
        return this._ascending
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    if (this.mode === 'single') {
      return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { message: 'not found' } });
    }
    if (this.mode === 'maybe') {
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    }
    return Promise.resolve({ data: rows, error: null });
  }
}

function fakeSupabase() {
  const tables = new Map<string, Row[]>([
    ['evidence_versions', []],
    ['sync_ops', []],
    ['evidence_current', []]
  ]);
  const seq = { value: 0 };
  const writes = { insert: 0, update: 0, delete: 0 };

  const client = {
    from(tableName: string) {
      const query = new FakeQuery(tables, tableName, seq);
      const originalInsert = query.insert.bind(query);
      query.insert = (payload: Row) => {
        writes.insert += 1;
        return originalInsert(payload);
      };
      (query as unknown as { update: () => never }).update = () => {
        writes.update += 1;
        throw new Error('update is not allowed on the append-only store');
      };
      (query as unknown as { delete: () => never }).delete = () => {
        writes.delete += 1;
        throw new Error('delete is not allowed on the append-only store');
      };
      return query;
    }
  };

  return { client, writes, tables };
}

describeStoreContract('SupabaseEvidenceStore (fake client)', async () => {
  const { client } = fakeSupabase();
  return { store: new SupabaseEvidenceStore(client as never) };
});

describe('SupabaseEvidenceStore uses insert only', () => {
  it('never calls update or delete when appending two versions', async () => {
    const { client, writes, tables } = fakeSupabase();
    const store = new SupabaseEvidenceStore(client as never);
    const first = makeRecord({ value: 8.2 });
    await store.appendVersion(USER_A, first);
    const second = reviseEvidence([first], {
      origin: 'student_confirmed',
      value: 9.0,
      now: new Date('2026-11-01T00:00:00Z')
    }).record;
    await store.appendVersion(USER_A, second);

    expect(writes.update).toBe(0);
    expect(writes.delete).toBe(0);
    expect(writes.insert).toBeGreaterThanOrEqual(4);
    expect(tables.get('evidence_versions')).toHaveLength(2);
  });
});
