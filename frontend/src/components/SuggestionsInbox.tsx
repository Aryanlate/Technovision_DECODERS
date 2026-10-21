'use client';

import React from 'react';
import { AgentSuggestion } from '@opportunity-kit/shared';
import { Badge } from './Badge';
import { useTranslation } from '../lib/i18n/LanguageProvider';

interface SuggestionsInboxProps {
  suggestions: AgentSuggestion[];
  onAccept: (suggestion: AgentSuggestion) => void;
  onReject: (suggestionId: string) => void;
  className?: string;
}

export function SuggestionsInbox({
  suggestions,
  onAccept,
  onReject,
  className = ''
}: SuggestionsInboxProps) {
  const { t } = useTranslation();
  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter((s) => s.status === 'accepted');

  return (
    <div className={`border-2 border-[#111111] bg-[#F1EEE6] p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#111111] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-black text-xl tracking-tight uppercase text-[#111111]">
              {t('components.suggestionsInbox.title')}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold font-mono border border-[#111111] bg-white text-[#111111]">
              {t('components.suggestionsInbox.pendingCount', { count: pendingSuggestions.length })}
            </span>
          </div>
          <p className="text-xs text-[#555555] font-sans mt-0.5">
            {t('components.suggestionsInbox.subtitle')}
          </p>
        </div>

        {acceptedSuggestions.length > 0 && (
          <span className="text-xs font-mono text-[#2F7D5B] font-bold">
            {t('components.suggestionsInbox.acceptedCount', { count: acceptedSuggestions.length })}
          </span>
        )}
      </div>

      {/* Empty State */}
      {pendingSuggestions.length === 0 ? (
        <div className="py-8 text-center text-sm font-sans text-[#555555]">
          <div className="font-mono text-xs uppercase tracking-wider text-[#777777] mb-1">
            {t('components.suggestionsInbox.emptyTitle')}
          </div>
          <p className="max-w-md mx-auto">
            {t('components.suggestionsInbox.emptyBody')}
          </p>
        </div>
      ) : (
        /* Suggestions List */
        <div className="divide-y divide-[#111111] mt-2">
          {pendingSuggestions.map((sug) => {
            const primarySource = sug.sources?.[0];

            return (
              <div
                key={sug.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-black/[0.02]"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#D98A1F] text-[#111111] border border-[#111111]">
                      {t('status.aiSuggested')}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#555555]">
                      {t('components.suggestionsInbox.via', { agent: sug.agent })}
                    </span>
                    {primarySource && (
                      <span
                        className={`text-[11px] font-mono font-semibold px-1.5 py-0.2 border border-[#111111] ${
                          primarySource.trust === 'Verified'
                            ? 'bg-[#2F7D5B] text-white'
                            : 'bg-white text-[#111111]'
                        }`}
                      >
                        {primarySource.trust}
                      </span>
                    )}
                  </div>

                  <h4 className="font-heading font-bold text-base text-[#111111] tracking-tight">
                    {sug.title}
                  </h4>
                  <p className="text-xs text-[#444444] font-sans mt-0.5 leading-relaxed">
                    {sug.description}
                  </p>

                  {primarySource && primarySource.url && (
                    <div className="mt-1">
                      <a
                        href={primarySource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-[#111111] underline hover:bg-black hover:text-white px-0.5 inline-block transition-colors"
                      >
                        {t('components.suggestionsInbox.evidenceSource', {
                          source: primarySource.title || primarySource.url
                        })}
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => onAccept(sug)}
                    className="px-3 py-1.5 bg-[#2F7D5B] text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#111111] hover:brightness-110 active:translate-y-0.5 transition-transform"
                    title={t('components.suggestionsInbox.acceptTitle')}
                  >
                    {t('components.suggestionsInbox.accept')}
                  </button>
                  <button
                    onClick={() => onReject(sug.id)}
                    className="px-3 py-1.5 bg-white text-[#111111] font-mono text-xs font-bold uppercase tracking-wider border border-[#111111] hover:bg-[#E5E0D4] active:translate-y-0.5 transition-transform"
                    title={t('components.suggestionsInbox.rejectTitle')}
                  >
                    {t('components.suggestionsInbox.reject')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Governance Principle Footer */}
      <div className="mt-4 pt-3 border-t border-[#111111] text-[11px] font-mono text-[#666666] leading-relaxed">
        <span className="font-bold text-[#111111]">{t('components.suggestionsInbox.principleLabel')}</span>
        {t('components.suggestionsInbox.principleBody')}
      </div>
    </div>
  );
}
