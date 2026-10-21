'use client';

import React, { useMemo } from 'react';
import { checkScam, type ScamCheckResult, type ScamHighlight, type ScamRiskLevel } from '@opportunity-kit/shared';
import { Badge, type BadgeStatus } from './Badge';
import { useTranslation } from '../lib/i18n/LanguageProvider';

/** Maps a scam risk level to its badge status. */
export function scamRiskBadgeStatus(level: ScamRiskLevel): BadgeStatus {
  if (level === 'High') return 'High risk';
  if (level === 'Medium') return 'Medium risk';
  return 'Low risk';
}

/** Compact badge used on listing cards. */
export function ScamRiskBadge({ level, score }: { level: ScamRiskLevel; score: number }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge status={scamRiskBadgeStatus(level)} size="sm" />
      <span className="text-[11px] font-mono text-[#111111]/60">
        {t('components.scamPanel.pointsShort', { score })}
      </span>
    </span>
  );
}

/**
 * Renders the original listing with every warning sign highlighted in place.
 * Overlapping matches are merged so no text is drawn twice.
 */
export function ScamHighlightedText({
  text,
  highlights
}: {
  text: string;
  highlights: ScamHighlight[];
}) {
  const { t } = useTranslation();
  const nodes = useMemo(() => {
    const ranges = [...highlights].sort((a, b) => a.start - b.start || a.end - b.end);
    const merged: { start: number; end: number; severity: 'warning' | 'danger' }[] = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
        if (r.severity === 'danger') last.severity = 'danger';
        continue;
      }
      merged.push({ start: r.start, end: r.end, severity: r.severity });
    }

    const out: React.ReactNode[] = [];
    let cursor = 0;
    merged.forEach((r, idx) => {
      if (cursor < r.start) out.push(text.slice(cursor, r.start));
      out.push(
        <mark
          key={`mark-${idx}`}
          title={t('components.scamPanel.warningSign')}
          className={`px-0.5 font-bold ${
            r.severity === 'danger'
              ? 'bg-[#C0453A] text-white'
              : 'bg-[#D98A1F] text-[#111111]'
          }`}
        >
          {text.slice(r.start, r.end)}
        </mark>
      );
      cursor = r.end;
    });
    if (cursor < text.length) out.push(text.slice(cursor));
    return out;
  }, [text, highlights, t]);

  return (
    <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap border border-[#111111] bg-white p-3 max-h-56 overflow-auto">
      {nodes}
    </div>
  );
}

interface ScamWarningPanelProps {
  text: string;
  /** A known source URL for the listing (e.g. a discovery result's source). */
  sourceUrl?: string;
  /** Hide the highlighted preview when the caller already shows the text. */
  showHighlightedText?: boolean;
  className?: string;
}

/**
 * Full scam warning: risk badge, visible rules with their points, plain-word
 * explanations, the highlighted listing, and safe next steps.
 */
export function ScamWarningPanel({
  text,
  sourceUrl,
  showHighlightedText = true,
  className = ''
}: ScamWarningPanelProps) {
  const { t } = useTranslation();
  const result: ScamCheckResult = useMemo(
    () => checkScam(text || '', { sourceUrl }),
    [text, sourceUrl]
  );

  return (
    <div
      id="scam-warning-panel"
      className={`border border-[#111111] bg-[#F1EEE6] p-4 sm:p-5 space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111] pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-headline uppercase text-sm tracking-tight text-[#111111]">
            {t('components.scamPanel.safetyCheck')}
          </h3>
          <Badge status={scamRiskBadgeStatus(result.level)} size="sm" />
          <span className="text-[11px] font-mono text-[#111111]/60">
            {t('components.scamPanel.points', { score: result.score })}
          </span>
        </div>
        <span className="text-xs font-mono text-[#111111]/70">{result.summary}</span>
      </div>

      {showHighlightedText && text.trim().length > 0 && (
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#111111]/60 mb-1.5">
            {t('components.scamPanel.warningSignsHeading')}
          </p>
          {result.highlights.length > 0 ? (
            <ScamHighlightedText text={text} highlights={result.highlights} />
          ) : (
            <p className="text-sm text-[#111111]/70 border border-[#111111] bg-white p-3">
              {t('components.scamPanel.noWarning')}
            </p>
          )}
        </div>
      )}

      {result.findings.length > 0 && (
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#111111]/60 mb-1.5">
            {t('components.scamPanel.findingsHeading')}
          </p>
          <ul className="space-y-2">
            {result.findings.map((finding) => (
              <li key={finding.ruleId} className="border border-[#111111] bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-[#111111]">{finding.label}</span>
                  <span
                    className={`shrink-0 text-[11px] font-mono font-bold px-1.5 py-0.5 border border-[#111111] ${
                      finding.severity === 'danger' ? 'bg-[#C0453A] text-white' : 'bg-[#D98A1F] text-[#111111]'
                    }`}
                  >
                    {t('components.scamPanel.pointsPlus', { points: finding.points })}
                  </span>
                </div>
                <p className="text-sm text-[#111111]/80 mt-1">{finding.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border border-[#111111] bg-white p-3">
        <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5">
          {t('components.scamPanel.staySafe')}
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-[#111111]/90">
          {result.safeNextSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
