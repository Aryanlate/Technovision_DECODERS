/**
 * Translatable templates for the deterministic rule reasons.
 *
 * Every reason the rule engine produces comes from a template key plus its
 * values — never from an LLM. The English text lives here and is rendered by
 * `renderReason`, so the backend, the tests and the PDF keep working in
 * English. The frontend looks the same key up in the Hindi and Marathi
 * dictionaries and falls back to this English text when a key is missing.
 *
 * A translation is a plain string with `{placeholders}`, e.g.
 * `"numberRule.min.match": "{metric} {value} meets the minimum requirement of {threshold}."`
 */
export type TemplateParams = Record<string, string | number>;
/** Reason template keys for every rule branch (English is the source of truth). */
export declare const REASON_TEMPLATES: Record<string, string>;
/** Fills `{placeholders}` in a template. Unknown placeholders are left as-is. */
export declare function renderTemplate(template: string, params?: TemplateParams): string;
/**
 * Renders the English text for a reason template key and, in parallel, returns
 * the key with its values so the frontend can translate it.
 */
export declare function renderReason(key: string, params?: TemplateParams): {
    key: string;
    params: TemplateParams;
    text: string;
};
//# sourceMappingURL=reasonTemplates.d.ts.map