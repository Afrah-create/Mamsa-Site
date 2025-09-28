// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://lvcwbyqzjmpyopmbzqvc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleXFmamRseWdoYWVhYXZhZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjE1MTIsImV4cCI6MjA3NDYzNzUxMn0._fpZB5J1pafKN4UqLdn1ZdURcRsNddW7xGnsB4l8-QY';

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
