import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True only when both env vars are present. The UI uses this to show a friendly
// "setup needed" notice instead of crashing when keys are missing.
export const isSupabaseConfigured = Boolean(url && anonKey);

// When unconfigured we still export a client built with harmless placeholders so
// imports never throw; calls simply fail and are handled by the caller.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
