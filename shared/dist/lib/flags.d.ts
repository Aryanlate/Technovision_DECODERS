/**
 * Feature flags for OpportunityKit
 * Manages optional capabilities from Parts 16 to 22
 * Unfinished or optional features can be turned off safely during demo.
 */
export interface FeatureFlags {
    /** Part 16: Scam and legitimacy checker */
    ENABLE_SCAM_CHECKER: boolean;
    /** Part 17: Multi-agent evidence gathering with citations */
    ENABLE_AGENT_EVIDENCE: boolean;
    /** Part 18: Supabase database and authentication sync */
    ENABLE_SUPABASE_SYNC: boolean;
    /** Part 19: Printable PDF checklist export */
    ENABLE_PDF_EXPORT: boolean;
    /** Part 20: Calendar deadline and reminder (.ics) export */
    ENABLE_CALENDAR_EXPORT: boolean;
    /** Part 21: Action plan generation for missing requirements */
    ENABLE_ACTION_PLAN_GENERATOR: boolean;
    /** Part 22: Live LLM gateway fallback chaining */
    ENABLE_LIVE_LLM_GATEWAY: boolean;
    /** Part 23: English / Hindi / Marathi interface language toggle */
    ENABLE_I18N: boolean;
    /** Part 24: Cream (default) and dark themes with a toggle */
    ENABLE_DARK_MODE: boolean;
    /** Part 25: Skippable 3-step first-visit onboarding tour */
    ENABLE_ONBOARDING_TOUR: boolean;
    /** Part 26: Keyboard shortcuts and the shortcuts help dialog */
    ENABLE_KEYBOARD_SHORTCUTS: boolean;
    /** Part 27: College batch report export as a PDF */
    ENABLE_COLLEGE_REPORT_EXPORT: boolean;
    /** Part 28: Partner-published drive checklists (/drive/new and /drive/[id]) */
    ENABLE_DRIVE_PUBLISHING: boolean;
    /** Part 29: "How we stay sustainable" cost model on the pricing page */
    ENABLE_SUSTAINABILITY_MODEL: boolean;
    /** Part 30: Friendly, non-blocking Premium upgrade hints */
    ENABLE_UPGRADE_NUDGES: boolean;
}
export declare const DEFAULT_FEATURE_FLAGS: FeatureFlags;
/**
 * Resolves feature flags from process.env if present, otherwise uses defaults.
 */
export declare function getFeatureFlags(overrides?: Partial<FeatureFlags>): FeatureFlags;
//# sourceMappingURL=flags.d.ts.map