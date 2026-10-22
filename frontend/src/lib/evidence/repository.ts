import {
  confirmEvidence,
  createEvidence,
  currentVersion,
  historyOf,
  rejectEvidence,
  reviseEvidence,
  type ConfirmEvidenceInput,
  type CreateEvidenceInput,
  type EvidenceRecord,
  type RejectEvidenceInput,
  type ReviseEvidenceInput
} from '@opportunity-kit/shared';
import { EvidenceDatabase, evidenceKey, type EvidenceKey, type OutboxEntry, type OutboxOperation } from './db';
import { withStorageErrors } from './errors';
import { migrateLocalStorageData, type MigrationOptions, type MigrationResult } from './migration';

// ============================================================================
// Local evidence repository.
//
// Every change goes through the shared, append-only evidence helpers and is
// written as a new version plus one outbox entry in a single IndexedDB
// transaction: either both rows land or neither does. Records written here are
// 'pending' until markSynced() moves them to 'synced'.
//
// Nothing in here decides eligibility; the rule engine recomputes it from the
// current records whenever subscribe() reports a change.
// ============================================================================

export const META_DEVICE_ID = 'deviceId';
export const META_LAST_SYNC_CURSOR = 'lastSyncCursor';
export const META_LAST_SYNCED_AT = 'lastSyncedAt';

export type EvidenceChangeType = OutboxOperation | 'sync';

export interface EvidenceChangeEvent {
  type: EvidenceChangeType;
  evidenceId?: string;
  record?: EvidenceRecord;
  /** How many records changed, for batch writes such as the migration. */
  count?: number;
}

export type EvidenceListener = (event: EvidenceChangeEvent) => void;

export interface SyncInfo {
  serverSeq?: number;
  cursor?: string;
  at?: Date;
}

export interface MetaFlag {
  key: string;
  value: unknown;
}

/** Creates the device id once, from the platform uuid when available. */
export function newDeviceId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `dev-${cryptoApi.randomUUID()}`;
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable ordering: by evidence id, then by version ascending. */
function sortHistory(rows: EvidenceRecord[]): EvidenceRecord[] {
  return rows.sort(
    (a, b) => a.evidenceId.localeCompare(b.evidenceId) || a.version - b.version
  );
}

export class EvidenceStore {
  readonly db: EvidenceDatabase;
  private listeners = new Set<EvidenceListener>();
  private deviceIdPromise: Promise<string> | null = null;

  constructor(dbName?: string) {
    this.db = new EvidenceDatabase(dbName);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Opens the database, ensures the device id, then migrates localStorage once. */
  async init(options: MigrationOptions = {}): Promise<{ deviceId: string; migration: MigrationResult }> {
    const deviceId = await this.getDeviceId();
    const migration = await this.migrate(options);
    return { deviceId, migration };
  }

  /** The device id is generated on first use and then reused forever. */
  async getDeviceId(): Promise<string> {
    if (!this.deviceIdPromise) {
      this.deviceIdPromise = withStorageErrors(async () => {
        const existing = await this.db.meta.get(META_DEVICE_ID);
        if (typeof existing?.value === 'string' && existing.value) return existing.value;

        const deviceId = newDeviceId();
        await this.db.transaction('rw', this.db.meta, async () => {
          const again = await this.db.meta.get(META_DEVICE_ID);
          if (typeof again?.value === 'string' && again.value) return;
          await this.writeMeta(META_DEVICE_ID, deviceId);
        });
        const stored = await this.db.meta.get(META_DEVICE_ID);
        return typeof stored?.value === 'string' && stored.value ? stored.value : deviceId;
      });
    }
    return this.deviceIdPromise;
  }

  /** Converts the old localStorage profile, checklist and tracker into evidence. */
  async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
    return migrateLocalStorageData(this, options);
  }

  close(): void {
    this.db.close();
    this.deviceIdPromise = null;
  }

  /** Wipes the local database. Used by "delete my data" and by the tests. */
  async destroy(): Promise<void> {
    await withStorageErrors(() => this.db.delete());
    this.deviceIdPromise = null;
    this.listeners.clear();
  }

  // -------------------------------------------------------------------------
  // Writes: one new version + one outbox entry, in one transaction
  // -------------------------------------------------------------------------

  /** Adds a brand new fact as version 1. */
  async add(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    const deviceId = input.deviceId ?? (await this.getDeviceId());
    const record = this.toPending(createEvidence({ ...input, deviceId }));

    await withStorageErrors(() =>
      this.db.transaction('rw', this.db.evidence, this.db.outbox, async () => {
        await this.db.evidence.put(record);
        await this.db.outbox.put(this.outboxEntry('add', record, 0));
      })
    );

    this.emit({ type: 'add', evidenceId: record.evidenceId, record });
    return record;
  }

  /**
   * Writes several version-1 records at once (used by the migration) and can
   * mark the batch as done with a meta flag in the same transaction, so a
   * half-finished migration is never recorded as finished.
   */
  async addBatch(inputs: CreateEvidenceInput[], flag?: MetaFlag): Promise<EvidenceRecord[]> {
    if (inputs.length === 0 && !flag) return [];
    const deviceId = await this.getDeviceId();
    const records = inputs.map((input) =>
      this.toPending(createEvidence({ ...input, deviceId: input.deviceId ?? deviceId }))
    );
    const at = new Date().toISOString();

    await withStorageErrors(() =>
      this.db.transaction('rw', this.db.evidence, this.db.outbox, this.db.meta, async () => {
        if (records.length > 0) {
          await this.db.evidence.bulkPut(records);
          await this.db.outbox.bulkPut(records.map((record) => this.outboxEntry('add', record, 0)));
        }
        if (flag) await this.writeMeta(flag.key, flag.value, at);
      })
    );

    if (records.length > 0) this.emit({ type: 'add', count: records.length });
    return records;
  }

  /**
   * Appends version n+1 for an existing fact. Earlier versions stay stored and
   * are only marked 'superseded'. AI evidence cannot revise a student
   * confirmed record: the shared helper throws EvidenceConflictError, the
   * transaction aborts and nothing is written.
   */
  async revise(evidenceId: string, input: ReviseEvidenceInput): Promise<EvidenceRecord> {
    const deviceId = input.deviceId ?? (await this.getDeviceId());

    const saved = await withStorageErrors(() =>
      this.db.transaction('rw', this.db.evidence, this.db.outbox, async () => {
        const history = await this.readHistory(evidenceId);
        const baseVersion = currentVersion(history).version;
        const { record, history: next } = reviseEvidence(history, { ...input, deviceId });

        const nextRecord = this.toPending(record);
        await this.db.evidence.bulkPut(
          next.map((version) => (version.version === nextRecord.version ? nextRecord : version))
        );
        await this.db.outbox.put(this.outboxEntry('revise', nextRecord, baseVersion));
        return nextRecord;
      })
    );

    this.emit({ type: 'revise', evidenceId, record: saved });
    return saved;
  }

  /** The student confirms an AI record: a new student_confirmed version, linked back. */
  async confirm(evidenceId: string, input: ConfirmEvidenceInput = {}): Promise<EvidenceRecord> {
    const deviceId = input.deviceId ?? (await this.getDeviceId());

    const saved = await withStorageErrors(() =>
      this.db.transaction('rw', this.db.evidence, this.db.outbox, async () => {
        const history = await this.readHistory(evidenceId);
        const baseVersion = currentVersion(history).version;
        const { record, history: next } = confirmEvidence(history, { ...input, deviceId });

        const nextRecord = this.toPending(record);
        await this.db.evidence.bulkPut(
          next.map((version) => (version.version === nextRecord.version ? nextRecord : version))
        );
        await this.db.outbox.put(this.outboxEntry('confirm', nextRecord, baseVersion));
        return nextRecord;
      })
    );

    this.emit({ type: 'confirm', evidenceId, record: saved });
    return saved;
  }

  /** The student rejects a record: a new version with status 'rejected'. */
  async reject(evidenceId: string, input: RejectEvidenceInput = {}): Promise<EvidenceRecord> {
    const deviceId = input.deviceId ?? (await this.getDeviceId());

    const saved = await withStorageErrors(() =>
      this.db.transaction('rw', this.db.evidence, this.db.outbox, async () => {
        const history = await this.readHistory(evidenceId);
        const baseVersion = currentVersion(history).version;
        const { record, history: next } = rejectEvidence(history, { ...input, deviceId });

        const nextRecord = this.toPending(record);
        await this.db.evidence.bulkPut(
          next.map((version) => (version.version === nextRecord.version ? nextRecord : version))
        );
        await this.db.outbox.put(this.outboxEntry('reject', nextRecord, baseVersion));
        return nextRecord;
      })
    );

    this.emit({ type: 'reject', evidenceId, record: saved });
    return saved;
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /**
   * The live evidence for one subject: the newest version of every evidence id,
   * with rejected and superseded facts left out of the current set.
   */
  async getCurrent(subjectId: string): Promise<EvidenceRecord[]> {
    const rows = await withStorageErrors(() =>
      this.db.evidence.where('subjectId').equals(subjectId).toArray()
    );

    const byEvidenceId = new Map<string, EvidenceRecord[]>();
    for (const row of rows) {
      const versions = byEvidenceId.get(row.evidenceId);
      if (versions) versions.push(row);
      else byEvidenceId.set(row.evidenceId, [row]);
    }

    const current: EvidenceRecord[] = [];
    for (const versions of byEvidenceId.values()) {
      const latest = currentVersion(versions);
      if (latest.status === 'active' || latest.status === 'conflicted') current.push(latest);
    }
    return current.sort((a, b) => a.key.localeCompare(b.key) || a.evidenceId.localeCompare(b.evidenceId));
  }

  /** Every version of one evidence id, oldest first. Nothing is ever dropped. */
  async getHistory(evidenceId: string): Promise<EvidenceRecord[]> {
    return withStorageErrors(async () => this.readHistory(evidenceId));
  }

  /**
   * Every stored version about one subject, oldest version first. The
   * evaluator needs the whole history, not just the current version, so it can
   * also report which older evidence was excluded and why.
   */
  async listBySubject(subjectId: string): Promise<EvidenceRecord[]> {
    const rows = await withStorageErrors(() =>
      this.db.evidence.where('subjectId').equals(subjectId).toArray()
    );
    return sortHistory(rows);
  }

  /** Every stored version of every fact, for the evidence audit page. */
  async listAll(): Promise<EvidenceRecord[]> {
    const rows = await withStorageErrors(() => this.db.evidence.toArray());
    return sortHistory(rows);
  }

  /** Queued operations, oldest first, ready to be pushed to the server. */
  async listPending(): Promise<OutboxEntry[]> {
    return withStorageErrors(() => this.db.outbox.orderBy('createdAt').toArray());
  }

  async getMetaValue(key: string): Promise<unknown> {
    const row = await withStorageErrors(() => this.db.meta.get(key));
    return row?.value;
  }

  // -------------------------------------------------------------------------
  // Sync bookkeeping
  // -------------------------------------------------------------------------

  /**
   * Marks queued operations as accepted by the server: their versions become
   * 'synced', the outbox entries are dropped and the sync cursor is stored.
   * Returns how many operations were cleared.
   */
  async markSynced(opIds: string[], info: SyncInfo = {}): Promise<number> {
    if (opIds.length === 0) return 0;
    const at = (info.at ?? new Date()).toISOString();
    let count = 0;

    await withStorageErrors(() =>
      this.db.transaction('rw', this.db.evidence, this.db.outbox, this.db.meta, async () => {
        for (const opId of opIds) {
          const entry = await this.db.outbox.get(opId);
          if (!entry) continue;

          const changes: Partial<EvidenceRecord> = { syncState: 'synced' };
          if (info.serverSeq !== undefined) changes.serverSeq = info.serverSeq;
          await this.db.evidence.update(evidenceKey(entry.record), changes);
          await this.db.outbox.delete(opId);
          count += 1;
        }
        await this.writeMeta(META_LAST_SYNCED_AT, at, at);
        if (info.cursor !== undefined) await this.writeMeta(META_LAST_SYNC_CURSOR, info.cursor, at);
      })
    );

    if (count > 0) this.emit({ type: 'sync', count });
    return count;
  }

  // -------------------------------------------------------------------------
  // Change notifications
  // -------------------------------------------------------------------------

  /** Calls back after every successful change. Returns an unsubscribe function. */
  subscribe(listener: EvidenceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: EvidenceChangeEvent): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch (error) {
        console.warn('[Evidence] A store listener failed:', error);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async readHistory(evidenceId: string): Promise<EvidenceRecord[]> {
    const rows = await this.db.evidence.where('evidenceId').equals(evidenceId).toArray();
    return historyOf(evidenceId, rows);
  }

  /** Records written locally are queued, so they are 'pending' until synced. */
  private toPending(record: EvidenceRecord): EvidenceRecord {
    return { ...record, syncState: 'pending' };
  }

  private outboxEntry(operation: OutboxOperation, record: EvidenceRecord, baseVersion: number): OutboxEntry {
    return {
      opId: record.opId,
      operation,
      evidenceId: record.evidenceId,
      record,
      baseVersion,
      createdAt: record.createdAt
    };
  }

  private async writeMeta(key: string, value: unknown, at = new Date().toISOString()): Promise<void> {
    await this.db.meta.put({ key, value, updatedAt: at });
  }
}

let singleton: EvidenceStore | null = null;

/** One store per browser tab; created lazily so server rendering stays safe. */
export function getEvidenceStore(): EvidenceStore {
  if (!singleton) singleton = new EvidenceStore();
  return singleton;
}

export type { EvidenceKey };
