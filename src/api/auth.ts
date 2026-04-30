import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Read the current Supabase session, if any. Returns null when the user is
 * unauthenticated. Errors are silently treated as "no session" to match the
 * existing AuthContext behaviour, which never propagates getSession errors.
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Subscribe to auth state changes. Returns the unsubscribe function.
 */
export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Sign in with email + password. Returns the raw Supabase result so callers
 * can inspect data.user as well as any error (used by AuthContext to then
 * check the profile.is_active flag).
 */
export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Look up a user's profile.is_active flag. Returns null if no profile row
 * exists (treated as "active" by callers, matching prior behaviour).
 */
export async function getProfileActive(userId: string): Promise<{ is_active: boolean } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('user_id', userId)
    .single();
  return data as { is_active: boolean } | null;
}

/**
 * Check whether a user has the 'admin' app_role. The admin panel is
 * admin-only, so this gate runs both on sign-in and on every session load
 * (to catch cached sessions that predate this restriction).
 */
export async function getUserIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });
  if (error) return false;
  return data === true;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Request a password-reset email. Returns the supabase result so the caller
 * can show error.message inline in the form.
 */
export function requestPasswordReset(email: string, redirectTo: string): Promise<{ error: AuthError | null }> {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

/**
 * Update the current user's password (requires an active session, typically
 * provided by a magic-link redirect from requestPasswordReset).
 */
export function updatePassword(password: string): Promise<{ error: AuthError | null }> {
  return supabase.auth.updateUser({ password }) as unknown as Promise<{ error: AuthError | null }>;
}
