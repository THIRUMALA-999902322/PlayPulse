import { createClient } from "@supabase/supabase-js";

/*
 * The backend is pinned here rather than read from the environment.
 *
 * These are publishable credentials: they are compiled into every client bundle
 * by design, and Row Level Security — not secrecy — is what protects the data.
 * There is nothing here an attacker could not read out of the deployed
 * JavaScript anyway.
 *
 * Pinning also fixes a real failure. The Vercel project still carries a
 * VITE_SUPABASE_URL pointing at a Supabase project that was deleted, and Vite
 * gives host environment variables priority over .env files — so the deployed
 * build was talking to a database that no longer exists. Reading env here would
 * reintroduce that. Once that stale variable is removed from the Vercel
 * dashboard this can go back to import.meta.env.
 */
const SUPABASE_URL = "https://heylgtgocywvrgpyilqu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_62MUtM2s7r_7Mw6EuTYCrw_rBUpqqpH";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export const isSupabaseConfigured = true;
