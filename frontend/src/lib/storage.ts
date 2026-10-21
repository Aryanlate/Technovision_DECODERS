import {
  StudentProfile,
  EvaluationResult,
  SAMPLE_STUDENT_PROFILE,
  parseOpportunity,
  evaluateProfileAgainstOpportunity
} from '@opportunity-kit/shared';
import { supabase, isSupabaseLoggedIn, getSupabaseUser } from './supabase';

export const PROFILE_KEY = 'opportunitykit_student_profile';
export const LAST_RESULT_KEY = 'opportunitykit_last_evaluation';

/**
 * Synchronous local retrieval of student profile from localStorage.
 * Used for instant SSR hydration and offline default.
 */
export function getStoredProfile(): StudentProfile {
  if (typeof window === 'undefined') {
    return SAMPLE_STUDENT_PROFILE;
  }

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return SAMPLE_STUDENT_PROFILE;
    const parsed = JSON.parse(raw);
    const parsedLinks = parsed.links || {};
    const sampleLinks = SAMPLE_STUDENT_PROFILE.links || {};
    return {
      ...SAMPLE_STUDENT_PROFILE,
      ...parsed,
      skills: Array.isArray(parsed.skills) ? parsed.skills : (SAMPLE_STUDENT_PROFILE.skills || []),
      documents: Array.isArray(parsed.documents) ? parsed.documents : (SAMPLE_STUDENT_PROFILE.documents || []),
      projects: Array.isArray(parsed.projects) ? parsed.projects : (SAMPLE_STUDENT_PROFILE.projects || []),
      links: {
        github: parsedLinks.github ?? sampleLinks.github ?? '',
        linkedin: parsedLinks.linkedin ?? sampleLinks.linkedin ?? '',
        instagram: parsedLinks.instagram ?? sampleLinks.instagram ?? '',
        portfolio: parsedLinks.portfolio ?? sampleLinks.portfolio ?? ''
      }
    };
  } catch (err) {
    console.error('Failed to load stored profile from localStorage:', err);
    return SAMPLE_STUDENT_PROFILE;
  }
}

/**
 * Synchronous local save of student profile to localStorage,
 * with background async sync to Supabase if currently logged in.
 */
export function saveStoredProfile(profile: StudentProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }

  // Fire-and-forget sync to Supabase in background if logged in
  if (supabase) {
    isSupabaseLoggedIn()
      .then((loggedIn) => {
        if (loggedIn) {
          saveProfileToSupabase(profile).catch((err) => {
            console.warn('[Storage] Background Supabase sync error:', err);
          });
        }
      })
      .catch(() => {});
  }
}

/**
 * Asynchronously loads student profile:
 * - If logged in to Supabase: fetches from Supabase table 'student_profiles'
 * - If record exists, syncs it to localStorage and returns it
 * - Otherwise (not logged in or offline), loads from localStorage with fallback to benchmark sample
 */
export async function loadProfile(): Promise<StudentProfile> {
  if (typeof window === 'undefined') {
    return SAMPLE_STUDENT_PROFILE;
  }

  try {
    const loggedIn = await isSupabaseLoggedIn();
    if (loggedIn && supabase) {
      const user = await getSupabaseUser();
      if (user?.id) {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          // If stored as JSON blob in profile_data or direct row
          const remoteProfile: StudentProfile = (data.profile_data || data) as StudentProfile;
          if (remoteProfile && remoteProfile.name) {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(remoteProfile));
            return remoteProfile;
          }
        } else if (!data) {
          // New Supabase user: upload current local profile to initialize remote row
          const localProfile = getStoredProfile();
          await saveProfileToSupabase(localProfile);
          return localProfile;
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Supabase profile fetch failed, falling back to localStorage:', err);
  }

  return getStoredProfile();
}

/**
 * Asynchronously saves student profile:
 * - Always saves to localStorage immediately
 * - If logged in to Supabase: upserts profile to Supabase table 'student_profiles'
 */
export async function saveProfile(profile: StudentProfile): Promise<void> {
  saveStoredProfile(profile);

  try {
    const loggedIn = await isSupabaseLoggedIn();
    if (loggedIn && supabase) {
      await saveProfileToSupabase(profile);
    }
  } catch (err) {
    console.warn('[Storage] Could not persist profile to Supabase:', err);
  }
}

/**
 * Helper to upsert student profile into Supabase
 */
async function saveProfileToSupabase(profile: StudentProfile): Promise<void> {
  if (!supabase) return;
  const user = await getSupabaseUser();
  if (!user?.id) return;

  const payload = {
    id: user.id,
    user_id: user.id,
    name: profile.name,
    year: profile.year,
    branch: profile.branch,
    cgpa: profile.cgpa,
    skills: profile.skills,
    documents: profile.documents,
    availability_weeks: profile.availabilityWeeks,
    links: profile.links,
    projects: profile.projects,
    profile_data: profile,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('student_profiles').upsert(payload, {
    onConflict: 'id'
  });

  if (error) {
    // If the table doesn't have custom columns, try minimalist profile_data upsert
    const fallbackPayload = {
      id: user.id,
      profile_data: profile,
      updated_at: new Date().toISOString()
    };
    const { error: fallbackError } = await supabase
      .from('student_profiles')
      .upsert(fallbackPayload, { onConflict: 'id' });

    if (fallbackError) {
      console.warn('[Storage] Supabase upsert error:', fallbackError.message);
    }
  }
}

/**
 * Resets profile to the benchmark sample profile
 */
export function resetProfileToSample(): StudentProfile {
  saveStoredProfile(SAMPLE_STUDENT_PROFILE);
  return SAMPLE_STUDENT_PROFILE;
}

/**
 * Loads latest evaluation result from localStorage
 */
export function getStoredEvaluation(): EvaluationResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Saves latest evaluation result to localStorage
 */
export function saveStoredEvaluation(result: EvaluationResult): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
  } catch (err) {
    console.error('Failed to save evaluation:', err);
  }
}

export const CHECKLIST_KEY = 'opportunitykit_current_checklist';

/**
 * Checks if a custom student profile has been explicitly created/saved in storage
 */
export function hasStoredProfile(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(PROFILE_KEY));
}

/**
 * Loads the current parsed/customized checklist from localStorage
 */
export function getStoredChecklist(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Saves current parsed/customized checklist to localStorage
 */
export function saveStoredChecklist(checklist: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
  } catch (err) {
    console.error('Failed to save checklist:', err);
  }
}

/** Prefix shared by every key this app is allowed to write. */
export const STORAGE_KEY_PREFIX = 'opportunitykit_';

/**
 * Removes every local byte this app stores — the profile, the tracker
 * (last evaluation + checklist), analytics events, the presentation-mode
 * setting, the Discover selection and any share links — then, when signed in,
 * deletes the saved profile row from Supabase.
 *
 * Share links are swept by key prefix so a future share feature is covered too.
 */
export async function deleteAllUserData(): Promise<{ deletedRemote: boolean; clearedKeys: number }> {
  if (typeof window === 'undefined') return { deletedRemote: false, clearedKeys: 0 };

  // 1. Clear every app-owned localStorage key.
  const localKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) localKeys.push(key);
  }
  localKeys.forEach((key) => localStorage.removeItem(key));

  // 2. Clear every app-owned sessionStorage key (Discover selection + analytics).
  const sessionKeys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) sessionKeys.push(key);
  }
  sessionKeys.forEach((key) => sessionStorage.removeItem(key));

  // 3. Delete the saved profile, tracker items and share links from Supabase.
  let deletedRemote = false;
  try {
    if (supabase) {
      const loggedIn = await isSupabaseLoggedIn();
      const user = loggedIn ? await getSupabaseUser() : null;
      if (user?.id) {
        const { error } = await supabase.from('student_profiles').delete().eq('id', user.id);
        deletedRemote = !error;
        if (error) console.warn('[Storage] Supabase delete error:', error.message);

        // Best effort: also clear the tracker, share and drive rows for this account.
        const [trackerResult, shareResult, driveResult] = await Promise.all([
          supabase.from('tracker_items').delete().eq('user_id', user.id),
          supabase.from('share_snapshots').delete().eq('user_id', user.id),
          supabase.from('drive_checklists').delete().eq('user_id', user.id)
        ]);
        if (trackerResult.error) console.warn('[Storage] Tracker delete error:', trackerResult.error.message);
        if (shareResult.error) console.warn('[Storage] Share delete error:', shareResult.error.message);
        if (driveResult.error) console.warn('[Storage] Drive delete error:', driveResult.error.message);
      }
    }
  } catch (err) {
    console.warn('[Storage] Could not delete remote profile:', err);
  }

  return { deletedRemote, clearedKeys: localKeys.length + sessionKeys.length };
}

/**
 * Storage Helper object grouping profile, checklist, and evaluation storage methods
 */
export const storageHelper = {
  loadProfile,
  saveProfile,
  hasStoredProfile,
  getStoredProfile,
  saveStoredProfile,
  resetProfileToSample,
  getStoredChecklist,
  saveStoredChecklist,
  getStoredEvaluation,
  saveStoredEvaluation,
  deleteAllUserData
};

/**
 * Runs evaluation either through backend API or directly locally
 * Ensures core flow works even if backend is asleep or offline!
 */
export async function evaluateOpportunity(
  opportunityText: string,
  opportunityTitle: string,
  profile: StudentProfile
): Promise<{ result: EvaluationResult; source: 'backend' | 'offline_local' }> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  try {
    // Attempt backend evaluation with 4-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${backendUrl}/api/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opportunityText,
        opportunityTitle,
        profile
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: EvaluationResult = await response.json();
      saveStoredEvaluation(data);
      return { result: data, source: 'backend' };
    }
  } catch (err) {
    console.warn('[Evaluator] Backend API unavailable or timed out. Running pure TypeScript engine locally.', err);
  }

  // Fallback: Run deterministic Rule Parser and Rule Engine directly in browser!
  const requirements = parseOpportunity(opportunityText);
  const localResult = evaluateProfileAgainstOpportunity(
    requirements,
    profile,
    opportunityTitle,
    opportunityText
  );

  saveStoredEvaluation(localResult);
  return { result: localResult, source: 'offline_local' };
}
