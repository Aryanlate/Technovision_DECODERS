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

// All optional features default to ON so the full capability set is active.
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  ENABLE_SCAM_CHECKER: true,
  ENABLE_AGENT_EVIDENCE: true,
  ENABLE_SUPABASE_SYNC: true,
  ENABLE_PDF_EXPORT: true,
  ENABLE_CALENDAR_EXPORT: true,
  ENABLE_ACTION_PLAN_GENERATOR: true,
  ENABLE_LIVE_LLM_GATEWAY: true,
  ENABLE_I18N: true,
  ENABLE_DARK_MODE: true,
  ENABLE_ONBOARDING_TOUR: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_COLLEGE_REPORT_EXPORT: true,
  ENABLE_DRIVE_PUBLISHING: true,
  ENABLE_SUSTAINABILITY_MODEL: true,
  ENABLE_UPGRADE_NUDGES: true
};

/**
 * Resolves feature flags from process.env if present, otherwise uses defaults.
 */
export function getFeatureFlags(overrides?: Partial<FeatureFlags>): FeatureFlags {
  const flags = { ...DEFAULT_FEATURE_FLAGS };

  const globalProc = typeof globalThis !== 'undefined' ? (globalThis as unknown as { process?: { env?: Record<string, string> } }).process : undefined;
  const env = globalProc?.env;

  if (env) {
    if (env.FEATURE_SCAM_CHECKER !== undefined) {
      flags.ENABLE_SCAM_CHECKER = env.FEATURE_SCAM_CHECKER === 'true';
    }
    if (env.FEATURE_AGENT_EVIDENCE !== undefined) {
      flags.ENABLE_AGENT_EVIDENCE = env.FEATURE_AGENT_EVIDENCE === 'true';
    }
    if (env.FEATURE_SUPABASE_SYNC !== undefined) {
      flags.ENABLE_SUPABASE_SYNC = env.FEATURE_SUPABASE_SYNC === 'true';
    }
    if (env.FEATURE_PDF_EXPORT !== undefined) {
      flags.ENABLE_PDF_EXPORT = env.FEATURE_PDF_EXPORT === 'true';
    }
    if (env.FEATURE_CALENDAR_EXPORT !== undefined) {
      flags.ENABLE_CALENDAR_EXPORT = env.FEATURE_CALENDAR_EXPORT === 'true';
    }
    if (env.FEATURE_ACTION_PLAN !== undefined) {
      flags.ENABLE_ACTION_PLAN_GENERATOR = env.FEATURE_ACTION_PLAN === 'true';
    }
    if (env.FEATURE_LIVE_LLM !== undefined) {
      flags.ENABLE_LIVE_LLM_GATEWAY = env.FEATURE_LIVE_LLM === 'true';
    }
    if (env.FEATURE_I18N !== undefined) {
      flags.ENABLE_I18N = env.FEATURE_I18N === 'true';
    }
    if (env.FEATURE_DARK_MODE !== undefined) {
      flags.ENABLE_DARK_MODE = env.FEATURE_DARK_MODE === 'true';
    }
    if (env.FEATURE_ONBOARDING_TOUR !== undefined) {
      flags.ENABLE_ONBOARDING_TOUR = env.FEATURE_ONBOARDING_TOUR === 'true';
    }
    if (env.FEATURE_KEYBOARD_SHORTCUTS !== undefined) {
      flags.ENABLE_KEYBOARD_SHORTCUTS = env.FEATURE_KEYBOARD_SHORTCUTS === 'true';
    }
    if (env.FEATURE_COLLEGE_REPORT_EXPORT !== undefined) {
      flags.ENABLE_COLLEGE_REPORT_EXPORT = env.FEATURE_COLLEGE_REPORT_EXPORT === 'true';
    }
    if (env.FEATURE_DRIVE_PUBLISHING !== undefined) {
      flags.ENABLE_DRIVE_PUBLISHING = env.FEATURE_DRIVE_PUBLISHING === 'true';
    }
    if (env.FEATURE_SUSTAINABILITY_MODEL !== undefined) {
      flags.ENABLE_SUSTAINABILITY_MODEL = env.FEATURE_SUSTAINABILITY_MODEL === 'true';
    }
    if (env.FEATURE_UPGRADE_NUDGES !== undefined) {
      flags.ENABLE_UPGRADE_NUDGES = env.FEATURE_UPGRADE_NUDGES === 'true';
    }
  }

  return {
    ...flags,
    ...(overrides || {})
  };
}
