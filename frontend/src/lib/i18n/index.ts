/**
 * Tiny dictionary loader for the OpportunityKit interface.
 *
 * Interface text lives in per-locale dictionaries and is addressed with
 * dot-separated keys, e.g. `translate('en', 'check.analyse')`. Anything missing
 * from a locale falls back to the English string so a partially translated
 * screen never shows a blank or a raw key.
 */
import en from './dictionaries/en';
import hi from './dictionaries/hi';
import mr from './dictionaries/mr';
import components from './dictionaries/components';
import home from './dictionaries/pages/home';
import check from './dictionaries/pages/check';
import profile from './dictionaries/pages/profile';
import result from './dictionaries/pages/result';
import tracker from './dictionaries/pages/tracker';
import pricing from './dictionaries/pages/pricing';
import features from './dictionaries/features';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale } from './locales';
import type { Dictionary, Locale, TFunction, TranslationVars } from './types';

export * from './locales';
export * from './types';

/**
 * Each feature module owns whole top-level namespaces (`home`, `check`, ...),
 * so it replaces the shared dictionary for those keys instead of merging into
 * it. That keeps a single source of truth per screen.
 */
const MODULES = [components, home, check, profile, result, tracker, pricing, features];
const BASE: Record<Locale, Dictionary> = { en, hi, mr };

function buildDictionary(locale: Locale): Dictionary {
  return MODULES.reduce<Dictionary>(
    (acc, module_) => ({ ...acc, ...module_[locale] }),
    BASE[locale]
  );
}

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: buildDictionary('en'),
  hi: buildDictionary('hi'),
  mr: buildDictionary('mr')
};

/** Walks a dot path such as `check.analyse` through a nested dictionary. */
function resolvePath(dict: Dictionary, key: string): string | undefined {
  const parts = key.split('.');
  let node: string | Dictionary | undefined = dict;

  for (const part of parts) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }

  return typeof node === 'string' ? node : undefined;
}

/** Replaces `{placeholder}` tokens with the supplied values. */
function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * Resolves a key for a locale, falling back to English and finally to the key
 * itself (so a missing string is obvious rather than invisible).
 */
export function translate(locale: Locale, key: string, vars?: TranslationVars): string {
  const fromLocale = resolvePath(DICTIONARIES[locale], key);
  const template = fromLocale ?? resolvePath(DICTIONARIES[DEFAULT_LOCALE], key) ?? key;
  return interpolate(template, vars);
}

/** Creates a bound `t()` for a locale, memoised by the provider. */
export function createTranslator(locale: Locale): TFunction {
  return (key: string, vars?: TranslationVars) => translate(locale, key, vars);
}

/** Reads the language the user picked, remembering it per user. */
export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  window.dispatchEvent(new CustomEvent('opportunitykit_locale_changed', { detail: { locale } }));
}
