/**
 * Rule-based scam and legitimacy checker for opportunity listings.
 *
 * Plain TypeScript — no AI, no network. Every point comes from a named rule
 * with a fixed weight, so the score is transparent and auditable. The checker
 * also returns the exact positions of each warning sign inside the original
 * text so the interface can highlight them.
 *
 * A normal, honest listing stays Low. High always needs a concrete reason: a
 * fee demand, a request for an OTP/password/bank detail, or several stacked
 * warning signs.
 */
export type ScamRiskLevel = 'Low' | 'Medium' | 'High';
export type ScamSeverity = 'warning' | 'danger';
/** A matched span of the original text (character offsets, end exclusive). */
export interface ScamTextMatch {
    start: number;
    end: number;
    text: string;
}
export interface ScamFinding {
    ruleId: string;
    label: string;
    points: number;
    severity: ScamSeverity;
    explanation: string;
    matches: ScamTextMatch[];
}
export interface ScamHighlight extends ScamTextMatch {
    ruleId: string;
    label: string;
    points: number;
    severity: ScamSeverity;
    explanation: string;
}
export interface ScamCheckOptions {
    /** A known source URL for the listing (e.g. from a discovery result). */
    sourceUrl?: string;
}
export interface ScamCheckResult {
    level: ScamRiskLevel;
    score: number;
    findings: ScamFinding[];
    highlights: ScamHighlight[];
    safeNextSteps: string[];
    isClean: boolean;
    summary: string;
}
/** Points needed to reach each level (a rule is only counted once). */
export declare const SCAM_MEDIUM_THRESHOLD = 20;
export declare const SCAM_HIGH_THRESHOLD = 50;
/** Always shown with a check, whatever the risk level. */
export declare const SCAM_SAFE_NEXT_STEPS: string[];
/** Runs every visible rule over the listing and combines the points. */
export declare function checkScam(text: string, options?: ScamCheckOptions): ScamCheckResult;
//# sourceMappingURL=scam.d.ts.map