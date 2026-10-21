/**
 * Language handling for AI-written explanations.
 *
 * Only the prose an agent writes (evidence notes, suggested labels, fit
 * reasons) is translated. Rule reasons are never produced by a model: the rule
 * engine and the interface dictionaries own those, so a status can never change
 * meaning with the language.
 *
 * If the requested language has no provider available, the agent keeps its
 * English text — a translated sentence is optional, a wrong one is not.
 */
export type SupportedLanguage = 'en' | 'hi' | 'mr';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
  mr: 'Marathi (Devanagari script)'
};

/** Accepts 'en' | 'hi' | 'mr' (or a BCP-47 tag such as 'hi-IN'); unknown -> en. */
export function normalizeLanguage(value: unknown): SupportedLanguage {
  if (typeof value !== 'string') return 'en';
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'hi' || base === 'mr') return base;
  return 'en';
}

export function isEnglish(language: SupportedLanguage): boolean {
  return language === 'en';
}

/**
 * The instruction appended to an agent's system prompt. Returns an empty string
 * for English, so English prompts stay byte-identical with the previous
 * behaviour (and keep their cached results).
 */
export function languageInstruction(language: SupportedLanguage): string {
  if (language === 'en') return '';
  return [
    `Write every human-readable string you produce in ${LANGUAGE_NAMES[language]}.`,
    'Keep JSON keys, enum values (Match, Mismatch, Missing info, trust labels) and URLs in English.',
    'Do not translate quoted source sentences: reproduce them exactly as they appear in the source.'
  ].join(' ');
}
