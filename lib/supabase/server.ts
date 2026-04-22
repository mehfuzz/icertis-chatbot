import { createClient } from '@supabase/supabase-js';

// Strip /rest/v1 suffix and trailing slash — the client appends these itself.
// A common mistake is setting the URL to https://xyz.supabase.co/rest/v1/ instead of https://xyz.supabase.co
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Server client — uses service role key, bypasses RLS
// Never expose this key to the browser
export function createServerClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
