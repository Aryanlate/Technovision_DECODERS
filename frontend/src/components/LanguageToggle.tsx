'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/LanguageProvider';
import { LOCALES } from '../lib/i18n/locales';
import type { Locale } from '../lib/i18n/types';

/**
 * Language switcher for English, Hindi and Marathi.
 * The choice is remembered per user (see LanguageProvider).
 */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <label className={`flex items-center gap-1.5 ${className}`}>
      <span className="sr-only-editorial">{t('language.change')}</span>
      <span aria-hidden="true" className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#111111]/70">
        {t('language.label')}
      </span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t('language.change')}
        className="text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-[#111111] border border-[#111111] px-1.5 py-1 hover:bg-[#111111]/5 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 cursor-pointer"
      >
        {LOCALES.map((option) => (
          <option key={option.code} value={option.code} lang={option.htmlLang}>
            {option.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
};
