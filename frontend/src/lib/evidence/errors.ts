import { EvidenceError } from '@opportunity-kit/shared';

// ============================================================================
// Storage failures, already worded for the student.
//
// IndexedDB can fail in two ways that matter: the browser blocks local storage
// (private mode, blocked site data) or the device runs out of quota. Both are
// caught at the repository boundary and rethrown as an EvidenceStorageError so
// every caller shows the same clear sentence instead of a raw DOMException.
// ============================================================================

export type EvidenceStorageErrorCode = 'quota_exceeded' | 'unavailable' | 'unknown';

export const QUOTA_MESSAGE =
  'Storage on this device is full, so the change was not saved. Your earlier evidence is unchanged — free up some space and try again.';

export const UNAVAILABLE_MESSAGE =
  'This browser is blocking local storage (IndexedDB), so evidence cannot be saved on this device. Allow site data (or leave private browsing) and try again.';

export const UNKNOWN_MESSAGE =
  'Local storage could not be read or written just now, so the change was not saved. Please try again.';

export class EvidenceStorageError extends Error {
  readonly code: EvidenceStorageErrorCode;

  constructor(code: EvidenceStorageErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'EvidenceStorageError';
    this.code = code;
  }
}

/** True when the browser refused a write because the device is out of space. */
export function isQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: string; code?: number; message?: string };
  if (candidate.name === 'QuotaExceededError' || candidate.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
    return true;
  }
  if (candidate.code === 22) return true;
  return /quota|out of (disk )?space|storage is full/i.test(candidate.message ?? '');
}

/** True when IndexedDB itself is unavailable or blocked. */
export function isUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: string; message?: string };
  if (candidate.name === 'MissingAPIError' || candidate.name === 'InvalidStateError') return true;
  return /indexeddb|idb|database.*(unavailable|blocked|denied)/i.test(candidate.message ?? '');
}

/** Maps any thrown value onto a storage error with a student-readable message. */
export function toEvidenceStorageError(error: unknown): EvidenceStorageError {
  if (error instanceof EvidenceStorageError) return error;
  if (isQuotaExceededError(error)) return new EvidenceStorageError('quota_exceeded', QUOTA_MESSAGE, error);
  if (isUnavailableError(error)) return new EvidenceStorageError('unavailable', UNAVAILABLE_MESSAGE, error);
  return new EvidenceStorageError('unknown', UNKNOWN_MESSAGE, error);
}

/** One-line message for a toast or inline notice. */
export function describeStorageError(error: unknown): string {
  return toEvidenceStorageError(error).message;
}

/**
 * Runs a storage task, converting failures into EvidenceStorageError.
 * Domain rule errors (such as "AI may not overwrite a confirmed fact") are
 * business rules, not storage failures, so they pass through unchanged.
 */
export async function withStorageErrors<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof EvidenceError) throw error;
    throw toEvidenceStorageError(error);
  }
}
