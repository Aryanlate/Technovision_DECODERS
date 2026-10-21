import { Checklist, Requirement } from '../types/index.js';
export interface ParseResult {
    checklist: Checklist;
    warnings: string[];
}
/**
 * Normalizes opportunity text into individual sentences for rule parsing
 * and traceability.
 */
export declare function splitIntoSentences(text: string): string[];
/**
 * Detects opportunity type from text keywords:
 * internship | scholarship | competition | custom
 */
export declare function detectOpportunityType(text: string, title?: string): 'internship' | 'scholarship' | 'competition' | 'custom';
/**
 * Normalizes date strings (e.g. "November 15, 2026", "30 Nov", "30/11/2026")
 * into YYYY-MM-DD format.
 */
export declare function normalizeDate(dateStr: string): string | null;
/**
 * Transparent, deterministic Rule Parser (plain TypeScript, no AI).
 * Turns pasted opportunity text into a Checklist using regex and keyword rules.
 *
 * Each detected requirement retains its exact source sentence.
 * Returns parse warnings for non-trivial sentences that could not be understood.
 */
export declare function parseOpportunityToChecklist(rawText: string, opportunityTitle?: string): ParseResult;
/**
 * Standard parseOpportunity function returning Requirement[]
 * Preserves 100% backward compatibility with all test suites and UI callers.
 */
export declare function parseOpportunity(rawText: string): Requirement[];
/**
 * Parse alias returning Checklist
 */
export declare function parseChecklist(rawText: string, opportunityTitle?: string): Checklist & {
    warnings: string[];
};
//# sourceMappingURL=index.d.ts.map