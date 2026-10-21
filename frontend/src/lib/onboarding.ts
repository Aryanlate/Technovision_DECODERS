/**
 * First-visit onboarding tour state.
 *
 * The tour is shown once automatically and can be replayed from the footer.
 * A tiny custom event decouples the footer button from the tour component.
 */
export const ONBOARDING_STORAGE_KEY = 'opportunitykit_onboarding_seen';
export const ONBOARDING_REPLAY_EVENT = 'opportunitykit_replay_tour';

export function hasSeenTour(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

export function markTourSeen(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

/** Clears the "seen" flag and asks the tour to open again. */
export function requestTourReplay(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ONBOARDING_REPLAY_EVENT));
}
