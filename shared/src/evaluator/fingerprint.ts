import { contentHash, fnv1aHash } from '../evidence/index.js';
import type { EvidenceRecord } from '../evidence/types.js';

// ============================================================================
// Evidence fingerprint.
//
// A decision is never stored as the source of truth: it is recomputed from the
// evidence. If a caller caches a decision it MUST key the cache by this
// fingerprint, so that any change to the evidence invalidates the cached
// verdict.
// ============================================================================

/**
 * Stable hash of the evidence that produced a decision: the id and version of
 * every record used, plus its content. Revisions bump the version and content
 * changes bump the content hash, so either invalidates the fingerprint.
 */
export function evidenceFingerprint(records: EvidenceRecord[]): string {
  const parts = records
    .map((record) => `${record.evidenceId}@${record.version}#${contentHash(record)}`)
    .sort();

  return fnv1aHash(parts.join('|'));
}
