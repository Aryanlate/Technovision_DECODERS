import { isStale } from '../evidence/staleness.js';
import type { EvidenceRecord } from '../evidence/types.js';
import type { ReasonCode } from './types.js';

// ============================================================================
// Deciding whether one evidence version counts as a confirmed fact.
//
// A record counts only when it is the current active version, is not stale, is
// not in conflict, and either
//   (a) its origin is student_confirmed, or a user_provided fact about the
//       opportunity, or
//   (b) it is an opportunity-side fact written by AI with trust 'verified'.
//
// Profile-side facts (skills, CGPA, links, projects) always need the student's
// own confirmation: an AI suggestion about the student is advisory only.
// ============================================================================

export interface EvidenceVerdict {
  confirmed: boolean;
  reasonCode: ReasonCode;
  /** Plain-language explanation for the UI when the record does not count. */
  why: string;
}

const CONFIRMED: EvidenceVerdict = { confirmed: true, reasonCode: 'SUPPORTED', why: '' };

/** Classifies one evidence version against the rule above. */
export function classifyEvidence(record: EvidenceRecord, now: Date): EvidenceVerdict {
  if (record.status === 'rejected') {
    return {
      confirmed: false,
      reasonCode: 'UNVERIFIED',
      why: 'This record was rejected, so it no longer counts as a fact.'
    };
  }
  if (record.status === 'conflicted') {
    return {
      confirmed: false,
      reasonCode: 'CONFLICT',
      why: 'Two versions of this record disagree, so it cannot be used until it is resolved.'
    };
  }
  if (record.status !== 'active') {
    return {
      confirmed: false,
      reasonCode: 'UNVERIFIED',
      why: `This is an older (${record.status}) version, not the current one.`
    };
  }
  if (isStale(record, now)) {
    return {
      confirmed: false,
      reasonCode: 'STALE',
      why: 'This evidence is past its freshness window, so it is advisory only.'
    };
  }

  if (record.origin === 'student_confirmed') return CONFIRMED;

  const opportunitySide = record.subjectType === 'opportunity';
  if (opportunitySide && record.origin === 'user_provided') return CONFIRMED;
  if (opportunitySide && record.origin === 'ai_generated' && record.trust === 'verified') {
    return CONFIRMED;
  }

  if (record.origin === 'ai_generated') {
    return {
      confirmed: false,
      reasonCode: 'UNCONFIRMED_AI',
      why: 'This is an AI suggestion that the student has not confirmed yet.'
    };
  }

  return {
    confirmed: false,
    reasonCode: 'UNVERIFIED',
    why: 'Only facts the student confirms themselves count for their own profile.'
  };
}
