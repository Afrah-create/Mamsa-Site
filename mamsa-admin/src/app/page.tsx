'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('No authenticated user found:', error);
        router.push('/login');
        return;
      }

      console.log('Authenticated user found:', user.email);

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError) {
        console.log('Admin check error:', adminError);
        // If table doesn't exist, redirect to dashboard to handle creation
        if (adminError.code === 'PGRST116' || adminError.message.includes('relation "admin_users" does not exist')) {
          console.log('Admin table not found, redirecting to dashboard...');
          router.push('/dashboard');
          return;
        }
        
        // If user not found in admin table, redirect to login
        console.log('User not found in admin table');
        router.push('/login');
        return;
      }

      if (!adminData) {
        console.log('No admin data found');
        router.push('/login');
        return;
      }

      console.log('Admin access granted for:', adminData.full_name);
      // Redirect to dashboard if authenticated
      router.push('/dashboard');
    } catch (error) {
      console.error('Auth check failed:', error);
      // Allow access to dashboard to handle creation
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">MAMSA Admin Portal</h1>
        <p className="text-gray-600 mt-2">Loading...</p>
      </div>
    </div>
  );
}
