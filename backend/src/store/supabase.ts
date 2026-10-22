import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EvidenceRecordSchema, type EvidenceRecord } from '@opportunity-kit/shared';
import { EvidenceStoreError } from './errors.js';
import {
  fromVersionRow,
  parseCursor,
  toVersionRow,
  type EvidenceVersionRow
} from './mapping.js';
import type { ServerEvidenceStore, SyncPage } from './types.js';

const UNIQUE_CODES = new Set(['23505', 'PGRST116']);

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code && UNIQUE_CODES.has(error.code)) return true;
  return /duplicate key|unique constraint/i.test(error.message ?? '');
}

/**
 * Postgres-backed store using the Supabase service role key (server-side only).
 * Inserts only: no updates or deletes of evidence_versions.
 */
export class SupabaseEvidenceStore implements ServerEvidenceStore {
  readonly persistent = true;
  private readonly client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client ?? createServiceClient();
  }

  async appendVersion(userId: string, record: EvidenceRecord): Promise<EvidenceRecord> {
    const parsed = EvidenceRecordSchema.parse(record);

    if (await this.hasOp(userId, parsed.opId)) {
      return this.requireByOpId(userId, parsed.opId);
    }

    const row = toVersionRow(userId, parsed);
    const insertPayload: Record<string, unknown> = { ...row };
    delete insertPayload.server_seq;
    delete insertPayload.received_at;

    const { data, error } = await this.client
      .from('evidence_versions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        const stored = await this.findExisting(userId, parsed);
        if (stored) {
          await this.rememberOp(userId, parsed.opId);
          return stored;
        }
      }
      throw new EvidenceStoreError(`Could not append evidence version: ${error.message}`);
    }

    await this.rememberOp(userId, parsed.opId);
    return fromVersionRow(data as EvidenceVersionRow);
  }

  async getCurrent(userId: string, evidenceId?: string): Promise<EvidenceRecord[]> {
    let query = this.client.from('evidence_current').select('*').eq('user_id', userId);
    if (evidenceId) query = query.eq('evidence_id', evidenceId);
    const { data, error } = await query.order('evidence_id', { ascending: true });
    if (error) throw new EvidenceStoreError(`Could not read current evidence: ${error.message}`);
    return (data as EvidenceVersionRow[] | null)?.map(fromVersionRow) ?? [];
  }

  async getSince(userId: string, cursor: string | null, options?: { limit?: number }): Promise<SyncPage> {
    const after = parseCursor(cursor);
    const limit = options?.limit && options.limit > 0 ? options.limit : undefined;
    let query = this.client
      .from('evidence_versions')
      .select('*')
      .eq('user_id', userId)
      .gt('server_seq', after)
      .order('server_seq', { ascending: true });
    if (limit) query = query.limit(limit + 1);

    const { data, error } = await query;
    if (error) throw new EvidenceStoreError(`Could not page evidence: ${error.message}`);
    const rows = (data as EvidenceVersionRow[] | null) ?? [];
    const hasMore = Boolean(limit && rows.length > limit);
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    return {
      records: page.map(fromVersionRow),
      nextCursor: last ? String(last.server_seq) : String(after),
      hasMore
    };
  }

  async hasOp(userId: string, opId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('sync_ops')
      .select('op_id')
      .eq('user_id', userId)
      .eq('op_id', opId)
      .maybeSingle();

    if (error) throw new EvidenceStoreError(`Could not check sync op: ${error.message}`);
    return Boolean(data);
  }

  private async rememberOp(userId: string, opId: string): Promise<void> {
    const { error } = await this.client.from('sync_ops').insert({
      op_id: opId,
      user_id: userId
    });
    if (error && !isUniqueViolation(error)) {
      throw new EvidenceStoreError(`Could not record sync op: ${error.message}`);
    }
  }

  private async requireByOpId(userId: string, opId: string): Promise<EvidenceRecord> {
    const { data, error } = await this.client
      .from('evidence_versions')
      .select('*')
      .eq('user_id', userId)
      .eq('op_id', opId)
      .maybeSingle();

    if (error) throw new EvidenceStoreError(`Could not load replayed evidence: ${error.message}`);
    if (!data) {
      throw new EvidenceStoreError(`opId ${opId} is recorded but its version row is missing.`);
    }
    return fromVersionRow(data as EvidenceVersionRow);
  }

  private async findExisting(userId: string, record: EvidenceRecord): Promise<EvidenceRecord | null> {
    const byOp = await this.client
      .from('evidence_versions')
      .select('*')
      .eq('user_id', userId)
      .eq('op_id', record.opId)
      .maybeSingle();
    if (byOp.data) return fromVersionRow(byOp.data as EvidenceVersionRow);

    const byPk = await this.client
      .from('evidence_versions')
      .select('*')
      .eq('user_id', userId)
      .eq('evidence_id', record.evidenceId)
      .eq('version', record.version)
      .maybeSingle();

    if (byPk.data) {
      const stored = fromVersionRow(byPk.data as EvidenceVersionRow);
      if (stored.opId !== record.opId) {
        throw new EvidenceStoreError(
          `Version ${record.evidenceId}@${record.version} is already stored and cannot be replaced.`
        );
      }
      return stored;
    }
    return null;
  }
}

export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new EvidenceStoreError(
      'Supabase evidence store needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.'
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function isSupabaseStoreConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
