import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

export const createServerClient = async (): Promise<SupabaseServerClient | null> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          // Only set cookies if we're in a context where it's allowed
          // (Server Actions or Route Handlers)
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, secure: true })
          );
        } catch (error) {
          // Silently ignore cookie setting errors in contexts where cookies can't be modified
          // This happens during server component rendering when Supabase tries to refresh tokens
          // The cookies will be set properly when the user interacts (login, etc.)
          // No logging needed - this is expected behavior in server components
        }
      },
    },
    auth: {
      // Disable automatic token refresh in server components to prevent errors
      // Tokens will be refreshed properly in client-side contexts
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'x-hasura-role': 'anon' },
    },
  });
};
