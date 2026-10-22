/** Store-level failure (duplicate version, missing env, persistence error). */
export class EvidenceStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvidenceStoreError';
  }
}
