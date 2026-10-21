'use client';

import React from 'react';
import { daysUntilDeadline, isDeadlineSoon } from '@opportunity-kit/shared';
import { useTranslation } from '../lib/i18n/LanguageProvider';

export interface DeadlineChipProps {
  deadline: string | null;
  /** Injectable for consistent rendering/tests. */
  now?: Date;
}

/**
 * Deadline label. Deadlines within 7 days are highlighted in amber,
 * overdue ones in red, everything else stays neutral ink.
 */
export const DeadlineChip: React.FC<DeadlineChipProps> = ({ deadline, now }) => {
  const { t } = useTranslation();
  const remaining = daysUntilDeadline(deadline, now);
  const soon = isDeadlineSoon(deadline, now);
  const overdue = remaining !== null && remaining < 0;

  const label =
    remaining === null
      ? t('tracker.deadline.none')
      : remaining === 0
      ? t('tracker.deadline.today')
      : remaining === 1
      ? t('tracker.deadline.tomorrow')
      : remaining > 1
      ? t('tracker.deadline.inDays', { days: remaining })
      : remaining === -1
      ? t('tracker.deadline.overdueOne')
      : t('tracker.deadline.overdueMany', { days: Math.abs(remaining) });

  const styles = overdue
    ? 'border-[#C0453A] bg-[#C0453A]/10 text-[#C0453A]'
    : soon
    ? 'border-[#D98A1F] bg-[#D98A1F]/15 text-[#111111]'
    : 'border-[#111111] bg-white text-[#111111]';

  const prefix = overdue ? '⚠' : soon ? '⏱' : '•';

  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-mono font-bold uppercase whitespace-nowrap ${styles}`}
      title={soon ? t('tracker.deadlineSoon') : overdue ? t('tracker.deadline.titleOverdue') : undefined}
    >
      <span aria-hidden="true">{prefix}</span>
      <span>{label}</span>
    </span>
  );
};
