'use client';

import React from 'react';
import { EvaluationSummary } from '@opportunity-kit/shared';
import { Badge } from './Badge';
import { useTranslation } from '../lib/i18n/LanguageProvider';
import { statusLabel } from '../lib/i18n/rules';

export interface SummaryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  summary: EvaluationSummary;
  opportunityTitle?: string;
}

/**
 * Editorial SummaryBar Component
 * Displays match, mismatch, and missing info breakdown with a segmented proportional
 * progress bar and the final transparent verdict.
 * Follows the Master Context: "Unknown" is never treated as "fails"; missing answers are Missing info.
 */
export const SummaryBar: React.FC<SummaryBarProps> = ({
  summary,
  opportunityTitle,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();
  const { matches = 0, mismatches = 0, missingInfo = 0, overallVerdict, headline } = summary;
  const total = matches + mismatches + missingInfo || 1;

  const matchPct = (matches / total) * 100;
  const mismatchPct = (mismatches / total) * 100;
  const missingPct = (missingInfo / total) * 100;

  return (
    <div
      role="region"
      aria-label={t('components.summaryBar.regionLabel')}
      className={`border border-[#111111] bg-[#F1EEE6] p-5 sm:p-6 ${className}`}
      {...props}
    >
      {/* Top Header: Title and Overall Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#111111]">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
            {t('components.summaryBar.verdictSummary')}
          </span>
          {opportunityTitle && (
            <h3 className="font-headline text-lg sm:text-xl uppercase tracking-tight text-[#111111] mt-0.5">
              {opportunityTitle}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/75">
            {t('components.summaryBar.statusLabel')}
          </span>
          <span
            className={`font-headline text-sm sm:text-base px-3 py-1 uppercase border border-[#111111] select-none ${
              overallVerdict === 'Ready to apply'
                ? 'bg-[#2F7D5B] text-white'
                : 'bg-[#111111] text-[#F1EEE6]'
            }`}
          >
            {statusLabel(t, overallVerdict)}
          </span>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 my-5">
        {/* Match Card */}
        <div className="border border-[#111111] bg-white p-3 sm:p-4 text-center">
          <span className="font-headline text-2xl sm:text-4xl text-[#2F7D5B] block leading-none">
            {matches}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2F7D5B] block mt-1.5">
            {statusLabel(t, 'Match')}
          </span>
        </div>

        {/* Mismatch Card */}
        <div className="border border-[#111111] bg-white p-3 sm:p-4 text-center">
          <span className="font-headline text-2xl sm:text-4xl text-[#C0453A] block leading-none">
            {mismatches}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C0453A] block mt-1.5">
            {statusLabel(t, 'Mismatch')}
          </span>
        </div>

        {/* Missing Info Card */}
        <div className="border border-[#111111] bg-white p-3 sm:p-4 text-center">
          <span className="font-headline text-2xl sm:text-4xl text-[#D98A1F] block leading-none">
            {missingInfo}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#D98A1F] block mt-1.5">
            {statusLabel(t, 'Missing info')}
          </span>
        </div>
      </div>

      {/* Segmented Editorial Proportional Progress Bar */}
      <div className="space-y-1.5">
        <div
          className="w-full h-4 sm:h-5 border border-[#111111] bg-[#111111]/10 flex overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={matches}
          aria-label={t('components.summaryBar.progressLabel', {
            match: matches,
            matchLabel: statusLabel(t, 'Match'),
            mismatch: mismatches,
            mismatchLabel: statusLabel(t, 'Mismatch'),
            missing: missingInfo,
            missingLabel: statusLabel(t, 'Missing info')
          })}
        >
          {matches > 0 && (
            <div
              style={{ width: `${matchPct}%` }}
              className="h-full bg-[#2F7D5B] border-r border-[#111111] last:border-r-0 transition-all duration-300"
              title={t('components.summaryBar.segmentTitle', {
                count: matches,
                label: statusLabel(t, 'Match'),
                percent: Math.round(matchPct)
              })}
            />
          )}
          {mismatches > 0 && (
            <div
              style={{ width: `${mismatchPct}%` }}
              className="h-full bg-[#C0453A] border-r border-[#111111] last:border-r-0 transition-all duration-300"
              title={t('components.summaryBar.segmentTitle', {
                count: mismatches,
                label: statusLabel(t, 'Mismatch'),
                percent: Math.round(mismatchPct)
              })}
            />
          )}
          {missingInfo > 0 && (
            <div
              style={{ width: `${missingPct}%` }}
              className="h-full bg-[#D98A1F] transition-all duration-300"
              title={t('components.summaryBar.segmentTitle', {
                count: missingInfo,
                label: statusLabel(t, 'Missing info'),
                percent: Math.round(missingPct)
              })}
            />
          )}
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono uppercase text-[#111111]/70">
          <span>0%</span>
          <span>{t('components.summaryBar.totalCriteria', { total })}</span>
          <span>100%</span>
        </div>
      </div>

      {headline && (
        <p className="mt-4 pt-3 border-t border-[#111111]/20 text-xs sm:text-sm text-[#111111]/85 italic">
          &ldquo;{headline}&rdquo;
        </p>
      )}
    </div>
  );
};
