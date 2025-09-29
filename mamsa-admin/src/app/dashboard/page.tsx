'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    news: 0,
    events: 0,
    leadership: 0,
    gallery: 0,
    totalUsers: 0,
    totalViews: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'news', action: 'Published new article', title: 'MAMSA Annual Conference 2024', time: '2 hours ago', user: 'Admin' },
    { id: 2, type: 'event', action: 'Created new event', title: 'Leadership Workshop', time: '4 hours ago', user: 'Admin' },
    { id: 3, type: 'gallery', action: 'Uploaded image', title: 'Conference Photos', time: '6 hours ago', user: 'Admin' },
    { id: 4, type: 'leadership', action: 'Updated profile', title: 'Dr. Sarah Johnson', time: '1 day ago', user: 'Admin' },
  ]);
  
  const [upcomingEvents, setUpcomingEvents] = useState([
    { id: 1, title: 'MAMSA Annual Conference', date: '2024-03-15', location: 'Convention Center', attendees: 150 },
    { id: 2, title: 'Leadership Workshop', date: '2024-03-20', location: 'Training Hall', attendees: 25 },
    { id: 3, title: 'Member Meeting', date: '2024-03-25', location: 'Main Hall', attendees: 80 },
  ]);
  
  const supabase = createClient();

  useEffect(() => {
    // Load content immediately, check auth in background
    loadStats();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/login';
        return;
      }

      // Check if user is admin
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

  const loadStats = async () => {
    try {
      const [newsResult, eventsResult, leadershipResult, galleryResult] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('leadership').select('*', { count: 'exact', head: true }),
        supabase.from('gallery').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        news: newsResult.count || 0,
        events: eventsResult.count || 0,
        leadership: leadershipResult.count || 0,
        gallery: galleryResult.count || 0,
        totalUsers: 1250, // Mock data
        totalViews: 15420 // Mock data
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };


  // Remove loading spinner - show content immediately

  return (
    <AdminLayout user={user}>
      <div className="w-full space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Welcome back, {user?.email?.split('@')[0] || 'Admin'}!</h1>
              <p className="text-green-100 mt-1">Here&apos;s what&apos;s happening with MAMSA today.</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-green-200">Last login</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 lg:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div className="ml-3 lg:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">News Articles</dt>
                    <dd className="text-xl lg:text-2xl font-bold text-gray-900">{stats.news || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 lg:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3 lg:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Events</dt>
                    <dd className="text-xl lg:text-2xl font-bold text-gray-900">{stats.events || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 lg:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-3 lg:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Leadership</dt>
                    <dd className="text-xl lg:text-2xl font-bold text-gray-900">{stats.leadership || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 lg:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3 lg:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Gallery</dt>
                    <dd className="text-xl lg:text-2xl font-bold text-gray-900">{stats.gallery || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 lg:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-3 lg:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-xl lg:text-2xl font-bold text-gray-900">{(stats.totalUsers || 0).toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 lg:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-3 lg:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Page Views</dt>
                    <dd className="text-xl lg:text-2xl font-bold text-gray-900">{(stats.totalViews || 0).toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'news' ? 'bg-blue-100' :
                      activity.type === 'event' ? 'bg-green-100' :
                      activity.type === 'gallery' ? 'bg-yellow-100' : 'bg-purple-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        activity.type === 'news' ? 'text-blue-600' :
                        activity.type === 'event' ? 'text-green-600' :
                        activity.type === 'gallery' ? 'text-yellow-600' : 'text-purple-600'
                      }`}>
                        {activity.type === 'news' ? '📰' : activity.type === 'event' ? '📅' : activity.type === 'gallery' ? '🖼️' : '👥'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time} by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-green-500 pl-4">
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.location}</p>
                    <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                    <p className="text-xs text-green-600 font-medium">{event.attendees} attendees</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Link href="/news" className="bg-blue-600 hover:bg-blue-700 text-white px-4 lg:px-6 py-3 rounded-lg text-sm font-medium text-center transition-colors">
                📰 Manage News
              </Link>
              <Link href="/events" className="bg-green-600 hover:bg-green-700 text-white px-4 lg:px-6 py-3 rounded-lg text-sm font-medium text-center transition-colors">
                📅 Manage Events
              </Link>
              <Link href="/leadership" className="bg-purple-600 hover:bg-purple-700 text-white px-4 lg:px-6 py-3 rounded-lg text-sm font-medium text-center transition-colors">
                👥 Manage Leadership
              </Link>
              <Link href="/gallery" className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 lg:px-6 py-3 rounded-lg text-sm font-medium text-center transition-colors">
                🖼️ Manage Gallery
              </Link>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Website Online</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Database Connected</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Email Service Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
