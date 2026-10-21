/**
 * Language support for the OpportunityKit interface.
 *
 * Interface text lives in per-locale dictionaries (see ./dictionaries) and is
 * addressed with dot-separated keys, e.g. `t('check.submit')`. Anything missing
 * from a dictionary falls back to the English string, so a partially translated
 * locale never leaves a blank on screen.
 */

export type Locale = 'en' | 'hi' | 'mr';

/** A dictionary is a nested tree of dot-addressable string leaves. */
export interface Dictionary {
  [key: string]: string | Dictionary;
}

/** Values interpolated into `{placeholders}` inside a translated string. */
export type TranslationVars = Record<string, string | number>;

export type TFunction = (key: string, vars?: TranslationVars) => string;
