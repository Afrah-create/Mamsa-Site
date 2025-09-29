// Supabase Configuration
// Uses environment variables for secure credential management

// Configure Supabase using environment variables
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration!');
  console.error('📁 Please create a .env file in your project root with:');
  console.error('   VITE_SUPABASE_URL=https://your-project-url.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.error('');
  console.error('💡 See env.example for the template');
  
  // Throw error to prevent app from running with missing config
  throw new Error('Supabase configuration is required. See console for instructions.');
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
