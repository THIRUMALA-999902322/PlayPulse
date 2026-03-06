import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback so app doesn't crash if env vars are missing
const url = supabaseUrl || "https://placeholder.supabase.co";
const key = supabaseAnonKey || "placeholder-key";

export const supabase = createClient(url, key);
export const isSupabaseConfigured =
  !!supabaseUrl && supabaseUrl !== "your_supabase_project_url" &&
  !!supabaseAnonKey && supabaseAnonKey !== "your_supabase_anon_key";
