'use client';

import React from 'react';
import { useTheme } from '../lib/ThemeProvider';
import { useTranslation } from '../lib/i18n/LanguageProvider';

/**
 * Light / dark switch. The cream theme is the light default; the dark variant
 * keeps the same status colours, adjusted for contrast.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { resolved, toggle, preference } = useTheme();
  const { t } = useTranslation();
  const isDark = resolved === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={`${t('theme.switchTheme')} — ${t(isDark ? 'theme.dark' : 'theme.light')}`}
      title={preference === 'system' ? t('theme.usingSystem') : t('theme.switchTheme')}
      className={`flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-[#111111] border border-[#111111] px-2 py-1 hover:bg-[#111111]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 ${className}`}
    >
      {isDark ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      )}
      <span aria-hidden="true">{t(isDark ? 'theme.dark' : 'theme.light')}</span>
    </button>
  );
};
