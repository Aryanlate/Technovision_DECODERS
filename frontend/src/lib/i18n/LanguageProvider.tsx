'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, getLocaleMeta, isLocale } from './locales';
import { createTranslator, getStoredLocale, setStoredLocale } from './index';
import type { Locale, TFunction } from './types';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: createTranslator(DEFAULT_LOCALE)
});

/**
 * Remembers the interface language per user, keeps <html lang> in sync and
 * exposes `t()` to every component.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Server render always uses the default locale; the stored choice is applied
  // after mount so server and client markup match (no hydration mismatch).
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());

    // Keep multiple tabs in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY && isLocale(event.newValue)) {
        setLocaleState(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = getLocaleMeta(locale).htmlLang;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

/** Reads the current language and `t()` from context. */
export function useTranslation(): LanguageContextValue {
  return useContext(LanguageContext);
}
