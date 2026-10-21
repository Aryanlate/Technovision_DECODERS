'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/LanguageProvider';

export interface UpgradeNudgeProps {
  /** 'gap' after a student closes a gap, 'limit' when the free limit is reached. */
  variant: 'gap' | 'limit';
  /** Free-plan limit, used in the 'limit' wording. */
  limit?: number;
  onDismiss: () => void;
}

/**
 * Friendly, non-blocking Premium hint.
 *
 * It never hides or replaces a result: it sits alongside whatever is already on
 * screen, names the specific feature the student would gain, and can be
 * dismissed. Results already shown stay shown.
 */
export const UpgradeNudge: React.FC<UpgradeNudgeProps> = ({ variant, limit = 5, onDismiss }) => {
  const { t } = useTranslation();

  const title = variant === 'gap' ? t('nudge.gapTitle') : t('nudge.limitTitle', { limit });
  const body =
    variant === 'gap'
      ? t('nudge.gapBody', { feature: t('nudge.gapFeature') })
      : t('nudge.limitBody', { feature: t('nudge.limitFeature') });

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('nudge.regionLabel')}
      className="p-3.5 border border-[#2F7D5B] bg-[#2F7D5B]/5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-[10px] font-mono font-bold bg-[#2F7D5B] text-white px-2 py-0.5 shrink-0 mt-0.5">
          {t('nudge.premiumTag')}
        </span>
        <div className="space-y-0.5">
          <span className="font-body font-bold text-sm text-[#111111] block">{title}</span>
          <p className="font-body text-sm text-[#111111]/85">{body}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-start">
        <Link href="/pricing" className="text-xs font-mono font-bold underline hover:text-[#2F7D5B]">
          {t('nudge.seePlans')}
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-mono text-[#111111]/70 underline hover:text-[#111111]"
        >
          {t('nudge.dismiss')}
        </button>
      </div>
    </div>
  );
};
