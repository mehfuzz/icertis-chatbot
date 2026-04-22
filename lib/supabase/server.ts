import { createClient } from '@supabase/supabase-js';

// Trim trailing slash — Supabase Kong gateway returns "Invalid path" on double-slash URLs
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Server client — uses service role key, bypasses RLS
// Never expose this key to the browser
export function createServerClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
