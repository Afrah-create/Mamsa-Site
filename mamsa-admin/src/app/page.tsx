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
        router.push('/login');
        return;
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
        router.push('/login');
        return;
      }

      // Redirect to dashboard if authenticated
      router.push('/dashboard');
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">MAMSA Admin Portal</h1>
        <p className="text-gray-600 mt-2">Checking authentication...</p>
      </div>
    </div>
  );
}
