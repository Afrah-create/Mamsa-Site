'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';

interface LeadershipMember {
  id: number;
  name: string;
  position: string;
  bio: string;
  image_url: string;
  created_at: string;
}

export default function LeadershipPage() {
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    loadLeadership();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/login';
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
        window.location.href = '/login';
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/login';
    }
  };

  const loadLeadership = async () => {
    try {
      const { data, error } = await supabase
        .from('leadership')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading leadership:', error);
        return;
      }

      setLeadership(data || []);
    } catch (error) {
      console.error('Failed to load leadership:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="w-full">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900">Leadership Team</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto">
                Add New Member
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading leadership team...</p>
              </div>
            ) : leadership.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leadership members</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new leadership member.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {leadership.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                          <span className="text-lg font-medium text-gray-600">{member.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                        <p className="text-sm text-blue-600">{member.position}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 line-clamp-3">{member.bio}</p>
                    <div className="mt-4 flex justify-center sm:justify-start space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors">Edit</button>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
