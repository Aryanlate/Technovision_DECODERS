"use strict";
/**
 * Feature flags for OpportunityKit
 * Manages optional capabilities from Parts 16 to 22
 * Unfinished or optional features can be turned off safely during demo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FEATURE_FLAGS = void 0;
exports.getFeatureFlags = getFeatureFlags;
// All optional features default to ON so the full capability set is active.
exports.DEFAULT_FEATURE_FLAGS = {
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
function getFeatureFlags(overrides) {
    const flags = { ...exports.DEFAULT_FEATURE_FLAGS };
    const globalProc = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
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
//# sourceMappingURL=flags.js.map