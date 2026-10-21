import {
  FeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  getFeatureFlags as getSharedFlags
} from '@opportunity-kit/shared';

export const DEMO_MODE_STORAGE_KEY = 'opportunitykit_demo_mode';

/**
 * Returns whether offline/presentation Demo Mode is active.
 * Default is TRUE so presentations and evaluation tests work 100% reliably
 * with zero external network dependency or API failures.
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
  return stored !== null ? stored === 'true' : true;
}

/**
 * Updates Demo Mode in localStorage and notifies components.
 */
export function setDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent('opportunitykit_demo_mode_changed', { detail: { enabled } }));
}

/**
 * Returns resolved feature flags.
 */
export function getFeatureFlags(): FeatureFlags {
  return getSharedFlags();
}

export { DEFAULT_FEATURE_FLAGS };
export type { FeatureFlags };
