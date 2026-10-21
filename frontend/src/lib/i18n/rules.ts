/**
 * Localised rule reasons.
 *
 * The rule engine is the only thing that decides a status, so its explanation
 * must not come from a language model. The engine reports a stable `ruleUsed`
 * id plus the `expected` / `studentValue` facts, and this module renders the
 * sentence from a translatable template. If a template is missing it falls back
 * to the engine's own English sentence.
 */
import type { RequirementStatus } from '@opportunity-kit/shared';
import type { TFunction } from './types';

/** Maps the three statuses onto the `rules.<rule>_<Status>` template suffix. */
const STATUS_SUFFIX: Record<RequirementStatus, string> = {
  Match: 'Match',
  Mismatch: 'Mismatch',
  'Missing info': 'Missing'
};

export interface LocalizableFinding {
  ruleUsed?: string;
  status: RequirementStatus;
  reason?: string;
  nextStep?: string;
  expected?: string;
  studentValue?: string;
}

export interface LocalizedRuleText {
  reason: string;
  nextStep: string;
}

/**
 * Returns the translated reason and next step for one requirement finding.
 */
export function localizeRuleReason(t: TFunction, finding: LocalizableFinding): LocalizedRuleText {
  const rule = finding.ruleUsed || '';
  const suffix = STATUS_SUFFIX[finding.status] || 'Missing';
  const vars = {
    expected: finding.expected ?? '',
    value: finding.studentValue ?? ''
  };

  const reasonKey = `rules.${rule}_${suffix}`;
  const nextKey = `rules.${rule}_next_${suffix}`;

  const reason = t(reasonKey, vars);
  const nextStep = t(nextKey, vars);

  return {
    // `t()` echoes the key when a string is missing, so compare to detect that.
    reason: reason === reasonKey ? finding.reason ?? '' : reason,
    nextStep: nextStep === nextKey ? finding.nextStep ?? '' : nextStep
  };
}

/** Reads a status word (Match, Mismatch, Missing info) in the chosen language. */
export function statusLabel(t: TFunction, status: RequirementStatus | string): string {
  switch (status) {
    case 'Match':
      return t('status.match');
    case 'Mismatch':
      return t('status.mismatch');
    case 'Missing info':
      return t('status.missingInfo');
    case 'Ready to apply':
      return t('status.readyToApply');
    case 'Almost ready':
      return t('status.almostReady');
    case 'Not ready yet':
      return t('status.notReadyYet');
    default:
      return String(status);
  }
}
