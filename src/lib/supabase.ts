import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isValid(url?: string, key?: string): boolean {
  return !!(
    url &&
    key &&
    !url.startsWith("your_") &&
    url.startsWith("http") &&
    !key.startsWith("your_")
  );
}

/** Browser-safe anon client (RLS enforced). Returns null if env is missing. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isValid(supabaseUrl, supabaseAnonKey)) return null;
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Server-only admin client (bypasses RLS). Use only in API routes. */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isValid(supabaseUrl, supabaseServiceKey)) return null;
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/** Server anon client for SSR (RLS enforced). */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isValid(supabaseUrl, supabaseAnonKey)) return null;
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false },
  });
}

// Legacy export for backwards compat
export const supabase = getSupabaseBrowserClient();

export const ADMIN_EMAIL_OVERRIDE = "jonakfir@gmail.com";

/** Check if an email is the permanent hardcoded admin. */
export function isPermanentAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL_OVERRIDE;
}
