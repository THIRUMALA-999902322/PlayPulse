import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { AuthContext } from "./contexts";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Nothing to restore when there's no backend, so we start ready.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession()
      .then(({ data }) => setUser(data?.session?.user ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, username) => {
    if (!isSupabaseConfigured) return { error: { message: "Database isn't configured yet." } };

    // The profile row is created by an `on auth.users insert` trigger, so it
    // exists even when the session doesn't (email-confirmation flows).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name: username } },
    });

    return { data, error, needsConfirmation: !error && !data?.session };
  };

  const signIn = async (email, password) =>
    isSupabaseConfigured
      ? supabase.auth.signInWithPassword({ email, password })
      : { error: { message: "Database isn't configured yet." } };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
  };

  const resendConfirmation = async (email) =>
    isSupabaseConfigured
      ? supabase.auth.resend({ type: "signup", email })
      : { error: { message: "Database isn't configured yet." } };

  /** Sends the reset link back to the app, where updatePassword finishes the job. */
  const requestPasswordReset = async (email) =>
    isSupabaseConfigured
      ? supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` })
      : { error: { message: "Database isn't configured yet." } };

  const updatePassword = async (password) =>
    isSupabaseConfigured
      ? supabase.auth.updateUser({ password })
      : { error: { message: "Database isn't configured yet." } };

  return (
    <AuthContext.Provider
      value={{
        user, loading, signUp, signIn, signOut,
        resendConfirmation, requestPasswordReset, updatePassword,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
