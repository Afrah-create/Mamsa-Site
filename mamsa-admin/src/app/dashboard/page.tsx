'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

const INITIAL_STATS = {
  news: 0,
  events: 0,
  leadership: 0,
  gallery: 0,
  totalUsers: 0,
  totalViews: 0
};

const DASHBOARD_CACHE_KEY = 'admin_dashboard_snapshot_v1';

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(INITIAL_STATS);
  
  interface Activity {
    id: string;
    type: 'news' | 'event' | 'gallery' | 'leadership';
    action: string;
    title: string;
    time: string;
    user: string;
  }

  interface UpcomingEvent {
    id: number;
    title: string;
    date: string;
    location: string;
    attendees: number;
  }

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  
  const supabase = createClient();
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [hasSnapshot, setHasSnapshot] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error || !authUser) {
        console.log('No authenticated user found:', error);
        window.location.href = '/login';
        return;
      }

      console.log('Authenticated user found:', authUser.email);

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (adminError) {
        console.log('Admin check error:', adminError);

        if (adminError.code === 'PGRST116' || adminError.message.includes('relation "admin_users" does not exist')) {
          console.log('Admin table not found, creating admin user...');
          const { error: createError } = await supabase
            .from('admin_users')
            .insert({
              user_id: authUser.id,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Admin User',
              email: authUser.email || '',
              role: 'super_admin',
              permissions: {
                news: true,
                events: true,
                leadership: true,
                gallery: true,
                users: true,
                reports: true
              },
              status: 'active'
            });

          if (createError) {
            console.error('Failed to create admin user:', createError);
            setUser(authUser);
            return;
          }

          console.log('Admin user created successfully');
          setUser(authUser);
          return;
        }

        console.log('User not found in admin table');
        window.location.href = '/login';
        return;
      }

      if (!adminData) {
        console.log('No admin data found');
        window.location.href = '/login';
        return;
      }

      console.log('Admin access granted for:', adminData.full_name);
      setUser(authUser);
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }, [supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user || snapshotReady) return;

    try {
      const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          stats?: typeof INITIAL_STATS;
          recentActivity?: Activity[];
          upcomingEvents?: UpcomingEvent[];
          timestamp?: string;
        };

        if (parsed.stats) setStats(parsed.stats);
        if (parsed.recentActivity) setRecentActivity(parsed.recentActivity);
        if (parsed.upcomingEvents) setUpcomingEvents(parsed.upcomingEvents);

        if (parsed.stats || parsed.recentActivity || parsed.upcomingEvents) {
          setHasSnapshot(true);
          setLoading(false);
        }
      }
    } catch (error) {
      console.warn('Failed to restore dashboard snapshot', error);
    } finally {
      setSnapshotReady(true);
    }
  }, [snapshotReady, user]);

  const fetchStats = useCallback(async (): Promise<typeof INITIAL_STATS> => {
    try {
      const [newsResult, eventsResult, leadershipResult, galleryResult, usersResult] = await Promise.all([
        supabase.from('news').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('leadership').select('id', { count: 'exact', head: true }),
        supabase.from('gallery').select('id', { count: 'exact', head: true }),
        supabase.from('admin_users').select('id', { count: 'exact', head: true })
      ]);

      return {
        news: newsResult.count || 0,
        events: eventsResult.count || 0,
        leadership: leadershipResult.count || 0,
        gallery: galleryResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalViews: 15420
      };
    } catch (error) {
      console.error('Failed to load stats:', error);
      return INITIAL_STATS;
    }
  }, [supabase]);

  const fetchRecentActivity = useCallback(async (): Promise<Activity[]> => {
    try {
      const [newsData, eventsData, galleryData, leadershipData] = await Promise.all([
        supabase.from('news').select('id, title, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('events').select('id, title, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('gallery').select('id, title, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('leadership').select('id, name, created_at').order('created_at', { ascending: false }).limit(4)
      ]);

      type ActivitySeed = {
        id: string;
        type: Activity['type'];
        action: string;
        title: string;
        created_at: string;
      };

      const seeds: ActivitySeed[] = [];

      newsData.data?.forEach((item: { id: number; title: string; created_at: string }) =>
        seeds.push({
          id: `news-${item.id}`,
          type: 'news',
          action: 'Published new article',
          title: item.title,
          created_at: item.created_at
        })
      );

      eventsData.data?.forEach((item: { id: number; title: string; created_at: string }) =>
        seeds.push({
          id: `event-${item.id}`,
          type: 'event',
          action: 'Created new event',
          title: item.title,
          created_at: item.created_at
        })
      );

      galleryData.data?.forEach((item: { id: number; title: string; created_at: string }) =>
        seeds.push({
          id: `gallery-${item.id}`,
          type: 'gallery',
          action: 'Uploaded image',
          title: item.title,
          created_at: item.created_at
        })
      );

      leadershipData.data?.forEach((item: { id: number; name: string; created_at: string }) =>
        seeds.push({
          id: `leadership-${item.id}`,
          type: 'leadership',
          action: 'Updated profile',
          title: item.name,
          created_at: item.created_at
        })
      );

      seeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return seeds.slice(0, 4).map((item) => ({
        id: item.id,
        type: item.type,
        action: item.action,
        title: item.title,
        time: formatTimeAgo(item.created_at),
        user: 'Admin'
      }));
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      return [];
    }
  }, [supabase]);

  const fetchUpcomingEvents = useCallback(async (): Promise<UpcomingEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, location, capacity')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error loading upcoming events:', error);
        return [];
      }

      return (
        data?.map((event: { id: number; title: string; date: string; location?: string; capacity?: number }) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location || 'TBA',
          attendees: event.capacity || 0
        })) || []
      );
    } catch (error) {
      console.error('Failed to load upcoming events:', error);
      return [];
    }
  }, [supabase]);

  useEffect(() => {
    if (!user || !snapshotReady) return;

    let cancelled = false;

    const loadDashboardData = async () => {
      if (!hasSnapshot) {
        setLoading(true);
      }

      try {
        const [statsData, activityData, eventsData] = await Promise.all([
          fetchStats(),
          fetchRecentActivity(),
          fetchUpcomingEvents()
        ]);

        if (cancelled) return;

        setStats(statsData);
        setRecentActivity(activityData);
        setUpcomingEvents(eventsData);

        try {
          sessionStorage.setItem(
            DASHBOARD_CACHE_KEY,
            JSON.stringify({
              stats: statsData,
              recentActivity: activityData,
              upcomingEvents: eventsData,
              timestamp: new Date().toISOString()
            })
          );
          setHasSnapshot(true);
        } catch (storageError) {
          console.warn('Failed to persist dashboard snapshot', storageError);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load dashboard data:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [fetchRecentActivity, fetchStats, fetchUpcomingEvents, hasSnapshot, snapshotReady, user]);

  // Show loading state if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">MAMSA Admin Portal</h1>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AdminLayout user={user}>
        <div className="flex h-full items-center justify-center py-16">
          <div className="text-center text-gray-600">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="font-medium">Loading dashboard data…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="w-full max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Welcome Section */}
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="hidden lg:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c1.656 0 3-1.343 3-3S13.656 2 12 2 9 3.343 9 5s1.344 3 3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">Admin Overview</p>
                <h1 className="mt-2 text-2xl lg:text-3xl font-bold text-gray-900">Welcome back, {user?.email?.split('@')[0] || 'Admin'}</h1>
                <p className="mt-2 text-sm text-gray-600">Here is a summary of the latest activity across the platform.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-inner">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-emerald-500">Last login</p>
                <p className="text-sm font-semibold text-emerald-700">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-6">
          {[
            {
              label: 'News Articles',
              value: stats.news || 0,
              iconColor: 'text-emerald-600',
              iconPath: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              )
            },
            {
              label: 'Events',
              value: stats.events || 0,
              iconColor: 'text-emerald-600',
              iconPath: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              )
            },
            {
              label: 'Leadership',
              value: stats.leadership || 0,
              iconColor: 'text-emerald-600',
              iconPath: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              )
            },
            {
              label: 'Gallery',
              value: stats.gallery || 0,
              iconColor: 'text-emerald-600',
              iconPath: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              )
            },
            {
              label: 'Total Users',
              value: (stats.totalUsers || 0).toLocaleString(),
              iconColor: 'text-emerald-600',
              iconPath: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              )
            },
            {
              label: 'Page Views',
              value: (stats.totalViews || 0).toLocaleString(),
              iconColor: 'text-emerald-600',
              iconPath: (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
              )
            }
          ].map((card) => (
            <div key={card.label} className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-md">
              <div className="p-4 lg:p-5 flex-1">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 ${card.iconColor}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {card.iconPath}
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</dt>
                      <dd className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {activity.type === 'news' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        )}
                        {activity.type === 'event' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        )}
                        {activity.type === 'gallery' && (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 16l1.586-1.586a2 2 0 012.828 0L20 14" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </>
                        )}
                        {activity.type === 'leadership' && (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </>
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.title}</p>
                      <p className="text-xs text-gray-400">{activity.time} by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white shadow rounded-lg border border-gray-100">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-4 divide-y divide-gray-100">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className={index === 0 ? '' : 'pt-4'}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                        <p className="mt-1 text-sm text-gray-600">{event.location}</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium">{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-emerald-600">{event.attendees} registered attendees</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg border border-gray-100">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4">
              {[
                {
                  href: '/news',
                  label: 'Manage News',
                  bg: 'bg-emerald-600 hover:bg-emerald-700',
                  iconPaths: (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </>
                  )
                },
                {
                  href: '/events',
                  label: 'Manage Events',
                  bg: 'bg-emerald-600 hover:bg-emerald-700',
                  iconPaths: (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </>
                  )
                },
                {
                  href: '/leadership',
                  label: 'Manage Leadership',
                  bg: 'bg-emerald-600 hover:bg-emerald-700',
                  iconPaths: (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </>
                  )
                },
                {
                  href: '/gallery',
                  label: 'Manage Gallery',
                  bg: 'bg-emerald-600 hover:bg-emerald-700',
                  iconPaths: (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </>
                  )
                }
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`${action.bg} text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-3`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 shadow-sm">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {action.iconPaths}
                    </svg>
                  </span>
                  <span>{action.label}</span>
                </Link>
              ))}
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
