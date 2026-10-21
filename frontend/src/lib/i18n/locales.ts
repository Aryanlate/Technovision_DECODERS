import type { Locale } from './types';

export interface LocaleMeta {
  code: Locale;
  /** Language name written in the language itself. */
  nativeLabel: string;
  /** Language name in English, used for accessible labels. */
  englishLabel: string;
  /** BCP-47 tag written to <html lang>. */
  htmlLang: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', nativeLabel: 'English', englishLabel: 'English', htmlLang: 'en' },
  { code: 'hi', nativeLabel: 'हिंदी', englishLabel: 'Hindi', htmlLang: 'hi' },
  { code: 'mr', nativeLabel: 'मराठी', englishLabel: 'Marathi', htmlLang: 'mr' }
];

export const DEFAULT_LOCALE: Locale = 'en';

/** The language a user picked, remembered per user in localStorage. */
export const LOCALE_STORAGE_KEY = 'opportunitykit_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.some((l) => l.code === value);
}

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return LOCALES.find((l) => l.code === locale) || LOCALES[0];
}
