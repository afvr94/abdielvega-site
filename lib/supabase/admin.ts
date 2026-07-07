import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. Server-only (import never reaches the
// browser). Used by the TV cron sync and the one-time import script, which have
// no user session to authorize against the owner-only policies.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
