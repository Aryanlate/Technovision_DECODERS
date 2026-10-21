import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both Supabase keys are present at build time. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Singleton Supabase browser client.
 * Returns null if Supabase environment variables are not configured,
 * ensuring 100% reliable offline/local operation without credentials.
 */
export const supabase: SupabaseClient | null =
  typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/** Result of an auth attempt, already worded for the student. */
export interface AuthResult {
  ok: boolean;
  message: string;
  /** True when Supabase is set to require an email confirmation first. */
  needsConfirmation?: boolean;
}

const NOT_CONFIGURED =
  'Cloud sign-in is not set up yet, so everything is saved on this device. Add your Supabase keys to turn on cloud sync.';

/**
 * Signs an existing student in with email + password.
 * Never throws: every failure comes back as a friendly message.
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Signed in. Your tracker now syncs to the cloud.' };
  } catch {
    return {
      ok: false,
      message: 'Could not reach the sign-in service. Check your connection and try again.'
    };
  }
}

/**
 * Creates a new account. When Supabase still requires email confirmation no
 * session is returned — that is reported as `needsConfirmation`, not an error.
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });
    if (error) return { ok: false, message: error.message };
    if (!data.session) {
      return {
        ok: true,
        needsConfirmation: true,
        message: 'Account created. Open the confirmation email, then come back and sign in.'
      };
    }
    return { ok: true, message: 'Account created. Your tracker now syncs to the cloud.' };
  } catch {
    return {
      ok: false,
      message: 'Could not reach the sign-up service. Check your connection and try again.'
    };
  }
}

/** Signs the current student out. Local data on this device is left untouched. */
export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Auth] Sign-out failed:', err);
  }
}

/** Current signed-in email, or null. Safe when Supabase is not configured. */
export async function getCurrentUserEmail(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const user = await getSupabaseUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Subscribes to sign-in / sign-out. Calls back immediately with the current
 * email so the UI is correct on first paint. Returns an unsubscribe function.
 */
export function onAuthChange(callback: (email: string | null) => void): () => void {
  if (!supabase) {
    callback(null);
    return () => {};
  }
  void getCurrentUserEmail().then(callback);
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.email ?? null);
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Checks if the student is currently authenticated via Supabase
 */
export async function isSupabaseLoggedIn(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch {
    return false;
  }
}

/**
 * Returns current authenticated user or null
 */
export async function getSupabaseUser() {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}
