import { JsonFileEvidenceStore, DEFAULT_JSON_STORE_PATH } from './jsonFile.js';
import { isSupabaseStoreConfigured, SupabaseEvidenceStore } from './supabase.js';
import type { ServerEvidenceStore } from './types.js';

export type { ServerEvidenceStore, SyncPage } from './types.js';
export { EvidenceStoreError } from './errors.js';
export { MemoryEvidenceStore } from './memory.js';
export { JsonFileEvidenceStore, DEFAULT_JSON_STORE_PATH } from './jsonFile.js';
export { SupabaseEvidenceStore, isSupabaseStoreConfigured } from './supabase.js';

export interface CreateStoreOptions {
  jsonPath?: string;
  /** Force the JSON-file backend even when Supabase env vars are set. */
  forceJson?: boolean;
}

/**
 * Picks Supabase when the service key is present; otherwise the local JSON file.
 * The service role key stays on the server — never send it to the browser.
 */
export function createServerEvidenceStore(options: CreateStoreOptions = {}): ServerEvidenceStore {
  const forceJson = options.forceJson || process.env.EVIDENCE_STORE?.trim() === 'json';
  if (!forceJson && isSupabaseStoreConfigured()) {
    return new SupabaseEvidenceStore();
  }
  return new JsonFileEvidenceStore(options.jsonPath ?? DEFAULT_JSON_STORE_PATH);
}
