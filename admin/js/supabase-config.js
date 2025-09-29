// Supabase Configuration
// Uses environment variables for secure credential management

// Configure Supabase using environment variables
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration!');
  console.error('📁 Please add environment variables in Vercel:');
  console.error('   VITE_SUPABASE_URL=https://your-project-url.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.error('');
  console.error('💡 Go to Vercel Dashboard → Settings → Environment Variables');
  
  // Redirect to login page if config is missing
  if (window.location.pathname !== '/login.html') {
    window.location.href = '/login.html';
  }
  
  // Create a dummy client to prevent errors
  const dummyClient = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Missing configuration' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Missing configuration' } }),
      signOut: () => Promise.resolve({ error: null })
    }
  };
  
  // Export dummy client
  window.supabaseClient = dummyClient;
  window.dbConfig = {};
  return;
}

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database schema configuration
const DB_CONFIG = {
    tables: {
        news: 'news',
        events: 'events',
        leadership: 'leadership',
        gallery: 'gallery',
        about: 'about',
        services: 'services',
        contact: 'contact',
        settings: 'settings',
        admin_users: 'admin_users'
    },
    storage: {
        images: 'images',
        documents: 'documents'
    }
};

// Export for use in other modules
window.supabaseClient = supabase;
window.dbConfig = DB_CONFIG;
