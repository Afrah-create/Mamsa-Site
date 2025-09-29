import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('📁 Please add these to your .env.local file:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
    console.error('');
    console.error('💡 Get these values from: https://supabase.com/dashboard/project/_/settings/api');
    
    // Return a dummy client to prevent crashes
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Missing configuration' } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Missing configuration' } }),
        signOut: () => Promise.resolve({ error: null })
      }
    } as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
