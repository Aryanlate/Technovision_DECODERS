import { EvidenceRecordSchema, type EvidenceRecord } from '../evidence/types.js';

/** Stable stringify so object key order does not change equality. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

export function valuesEqual(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

export function cloneRecord(record: EvidenceRecord): EvidenceRecord {
  return EvidenceRecordSchema.parse(JSON.parse(JSON.stringify(record)));
}

/**
 * Order by the server-assigned sequence only. Device clocks (createdAt /
 * observedAt) are ignored so two devices cannot "win" by setting their time.
 */
export function sortByServerSeq(records: EvidenceRecord[]): EvidenceRecord[] {
  return [...records].sort((a, b) => {
    const seqA = a.serverSeq ?? Number.MAX_SAFE_INTEGER;
    const seqB = b.serverSeq ?? Number.MAX_SAFE_INTEGER;
    if (seqA !== seqB) return seqA - seqB;
    const id = a.evidenceId.localeCompare(b.evidenceId);
    if (id !== 0) return id;
    return a.version - b.version;
  });
}

export function versionKey(record: Pick<EvidenceRecord, 'evidenceId' | 'version'>): string {
  return `${record.evidenceId}@${record.version}`;
}
