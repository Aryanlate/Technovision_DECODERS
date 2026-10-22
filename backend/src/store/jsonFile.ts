import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { EvidenceRecord } from '@opportunity-kit/shared';
import { EvidenceStoreError } from './errors.js';
import { MemoryEvidenceStore, type MemorySnapshot } from './memory.js';
import type { ServerEvidenceStore, SyncPage } from './types.js';

export const DEFAULT_JSON_STORE_PATH = path.join(process.cwd(), 'data', 'evidence.json');

/**
 * Local-dev store that writes a JSON file.
 *
 * This is not durable on Render's free disk: files vanish when the instance
 * sleeps or is rebuilt. Production should use the Supabase implementation.
 */
export class JsonFileEvidenceStore implements ServerEvidenceStore {
  readonly persistent = false;
  private readonly memory = new MemoryEvidenceStore();
  private queue: Promise<void> = Promise.resolve();
  private ready: Promise<void>;

  constructor(filePath?: string) {
    this.filePath = filePath ?? process.env.EVIDENCE_STORE_PATH?.trim() ?? DEFAULT_JSON_STORE_PATH;
    this.ready = this.load();
  }

  private readonly filePath: string;

  async appendVersion(userId: string, record: EvidenceRecord): Promise<EvidenceRecord> {
    return this.mutate(() => this.memory.appendVersion(userId, record));
  }

  async getCurrent(userId: string, evidenceId?: string): Promise<EvidenceRecord[]> {
    await this.ready;
    return this.memory.getCurrent(userId, evidenceId);
  }

  async getSince(userId: string, cursor: string | null): Promise<SyncPage> {
    await this.ready;
    return this.memory.getSince(userId, cursor);
  }

  async hasOp(userId: string, opId: string): Promise<boolean> {
    await this.ready;
    return this.memory.hasOp(userId, opId);
  }

  private mutate<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      await this.ready;
      const result = await fn();
      await this.save();
      return result;
    });
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as MemorySnapshot;
      if (parsed && Array.isArray(parsed.versions) && Array.isArray(parsed.ops)) {
        this.memory.loadSnapshot({
          versions: parsed.versions,
          ops: parsed.ops,
          nextSeq: Number(parsed.nextSeq) || 1
        });
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        throw new EvidenceStoreError(`Could not read the local evidence file: ${(error as Error).message}`);
      }
    }
  }

  private async save(): Promise<void> {
    try {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(this.filePath, JSON.stringify(this.memory.snapshot(), null, 2), 'utf8');
    } catch (error) {
      throw new EvidenceStoreError(`Could not write the local evidence file: ${(error as Error).message}`);
    }
  }
}
