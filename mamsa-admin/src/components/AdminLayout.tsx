'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearSessionData, type SessionUser } from '@/lib/session-manager';
import { AdminProfileProvider, type AdminHeaderProfile } from '@/context/AdminProfileContext';
import { resolveImageSrc } from '@/lib/image-utils';
import { AvatarImage } from '@/components/ui/AvatarImage';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: SessionUser | null;
}

type NotificationType = 'contact';

interface NotificationItem {
  id: number;
  recordId: number;
  title: string;
  subtitle?: string;
  time: string;
  unread: boolean;
  type: NotificationType;
}

interface ContactMessageRow {
  id: number;
  name: string;
  subject: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string | null;
}

const formatRelativeTime = (input?: string | null) => {
  if (!input) return '';
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - value.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} h ago`;
  if (diffDays < 7) return `${diffDays} d ago`;

  return value.toLocaleDateString();
};

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(user ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<AdminHeaderProfile>(null);
  const [currentYear, setCurrentYear] = useState(2025);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications]
  );

  const loadNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/admin/contact-messages', {
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error loading notifications:', response.status, text);
        setNotifications([]);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      const data = (payload.data ?? []) as ContactMessageRow[];

      const mapped: NotificationItem[] = data.map((message) => ({
        id: message.id,
        recordId: message.id,
        title:
          message.status === 'new'
            ? `New message from ${message.name}`
            : `Message from ${message.name}`,
        subtitle: message.subject ?? '',
        time: formatRelativeTime(message.updated_at ?? message.created_at),
        unread: message.status === 'new',
        type: 'contact',
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'News', 
      href: '/news', 
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    { 
      name: 'Events', 
      href: '/events', 
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Leadership', 
      href: '/leadership', 
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    { 
      name: 'Gallery', 
      href: '/gallery', 
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Skilled students',
      href: '/admin/skilled-students',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Contact Inbox',
      href: '/contact-management',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'About MAMSA',
      href: '/about',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1 4v-4m0-4h.01M12 6a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      )
    },
    { 
      name: 'Users', 
      href: '/users', 
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
  ];

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) return;
      const payload = (await response.json().catch(() => ({}))) as { user?: SessionUser };
      const u = payload.user;
      if (u) {
        setCurrentUser({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          avatar_url: u.avatar_url,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadProfile = useCallback(async () => {
    if (!currentUser?.id) return;

    const PROFILE_CACHE_KEY = `admin_profile_${currentUser.id}`;
    try {
      const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AdminHeaderProfile;
        if (parsed && typeof parsed.id === 'number') {
          setProfile(parsed);
        }
      }
    } catch {
      /* ignore cache */
    }

    try {
      const response = await fetch('/api/admin/profile', { credentials: 'include' });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.success && json.data) {
        const d = json.data as {
          id: number;
          full_name: string;
          email: string;
          role: string;
          avatar_url: string | null;
          created_at: string;
        };
        const normalized: AdminHeaderProfile = {
          id: d.id,
          full_name: d.full_name,
          email: d.email,
          role: d.role,
          avatar_url: d.avatar_url,
          created_at: d.created_at,
        };
        setProfile(normalized);
        try {
          sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(normalized));
        } catch {
          /* ignore */
        }
        return;
      }
    } catch (error) {
      console.error('Failed to load profile in AdminLayout:', error);
    }

    const fallback: AdminHeaderProfile = {
      id: currentUser.id,
      full_name: currentUser.name || 'Admin',
      email: currentUser.email,
      role: currentUser.role,
      avatar_url: currentUser.avatar_url ?? null,
      created_at: new Date().toISOString(),
    };
    setProfile(fallback);
    try {
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(fallback));
    } catch {
      /* ignore */
    }
  }, [currentUser]);

  const profileContextValue = useMemo(
    () => ({
      profile,
      setProfile,
      refreshProfile: loadProfile,
      refreshSession,
    }),
    [profile, loadProfile, refreshSession],
  );

  useEffect(() => {
    setCurrentUser(user ?? null);
  }, [user]);

  // Set current year on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!currentUser) return;
    loadNotifications();
  }, [currentUser, loadNotifications]);

  useEffect(() => {
    if (!currentUser) return;

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser, loadNotifications]);

  // Monitor session validity and detect logout from other tabs
  useEffect(() => {
    if (!currentUser) return;

    // Check session validity periodically
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          clearSessionData();
          window.location.replace('/login');
          return;
        }
      } catch {
        // Session invalid, redirect to login
        clearSessionData();
        window.location.replace('/login');
      }
    };

    // Check immediately and then every 2 minutes
    checkSession();
    const intervalId = setInterval(checkSession, 120000);

    // Listen for storage events (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null) {
        // Session was cleared, redirect to login
        clearSessionData();
        window.location.replace('/login');
      }
    };

    // Prevent seeing stale admin pages when navigating back after logout.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        checkSession();
      }
    };

    const handlePopState = () => {
      checkSession();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even on error
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const keywordRoutes: Array<{ keywords: string[]; href: string }> = [
      { keywords: ['dashboard', 'home', 'overview', 'stats'], href: '/dashboard' },
      { keywords: ['news', 'update', 'updates', 'articles', 'posts'], href: '/news' },
      { keywords: ['event', 'events', 'calendar', 'schedule'], href: '/events' },
      { keywords: ['leadership', 'leaders', 'team'], href: '/leadership' },
      { keywords: ['gallery', 'photos', 'images', 'media'], href: '/gallery' },
      { keywords: ['students', 'skilled', 'student'], href: '/admin/skilled-students' },
      { keywords: ['contact', 'inbox', 'messages', 'mail'], href: '/contact-management' },
      { keywords: ['about', 'mamsa', 'about mamsa'], href: '/about' },
      { keywords: ['users', 'admins', 'accounts', 'members'], href: '/users' },
      { keywords: ['profile', 'my profile', 'account'], href: '/admin/profile' },
    ];

    const directMatch = keywordRoutes.find((item) =>
      item.keywords.some((keyword) => keyword.includes(query) || query.includes(keyword))
    );

    if (directMatch) {
      router.push(directMatch.href);
      setSearchQuery('');
      return;
    }

    const navMatch = navigation.find((item) => item.name.toLowerCase().includes(query));
    if (navMatch) {
      router.push(navMatch.href);
      setSearchQuery('');
      return;
    }

    // Keep query so user can refine if no route matched.
  };

  const markNotificationAsRead = useCallback(
    async (id: number) => {
      const notification = notifications.find((item) => item.id === id);
      if (!notification) return;

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, unread: false } : item
        )
      );

      if (notification.type === 'contact' && notification.unread) {
        try {
          await fetch('/api/admin/contact-messages', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: notification.recordId, status: 'in_progress' }),
          });
        } catch (error) {
          console.error('Unexpected notification read error:', error);
        } finally {
          loadNotifications();
        }
      }
    },
    [loadNotifications, notifications]
  );

  const headerAvatarSrc = profile?.avatar_url
    ? resolveImageSrc(profile.avatar_url)
    : currentUser?.avatar_url
      ? resolveImageSrc(currentUser.avatar_url)
      : '';

  return (
    <AdminProfileProvider value={profileContextValue}>
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Click outside to close dropdowns */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-[55]"
          onClick={(e) => {
            // Only close if clicking on the backdrop, not on dropdown content
            if (e.target === e.currentTarget) {
              setShowNotifications(false);
            }
          }}
        />
      )}
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-600 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col h-screen ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Sidebar header - Fixed */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-green-500 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img src="/images/mamsa-logo.JPG" alt="MAMSA logo" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-lg font-semibold text-white">MAMSA Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-green-200 hover:text-white hover:bg-green-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto min-h-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  isActive
                    ? 'bg-green-500 text-white shadow-lg border-r-4 border-green-300'
                    : 'text-green-100 hover:bg-green-500 hover:text-white hover:shadow-md'
                }`}
              >
                <span className={`mr-3 flex-shrink-0 transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`}>{item.icon}</span>
                <span className="transition-all duration-300">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-green-500 px-4 py-3 flex-shrink-0">
          <Link
            href="/admin/profile"
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              pathname === '/admin/profile'
                ? 'bg-green-500 text-white shadow-md border-r-4 border-green-300'
                : 'text-green-100 hover:bg-green-500 hover:text-white'
            }`}
          >
            <AvatarImage
              src={headerAvatarSrc}
              name={profile?.full_name || currentUser?.name || currentUser?.email || 'Admin'}
              size="sm"
              className="ring-2 ring-white/20"
            />
            <span>My Profile</span>
          </Link>
        </div>

        {/* Sign Out Button */}
        <div className="border-t border-green-500 p-4 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-green-500 p-4 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-green-200 mb-2">Follow us</p>
            <div className="flex justify-center space-x-3">
              <a
                href="https://www.facebook.com/profile.php?id=61575142077443"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                className="text-green-200 hover:text-white transition-colors duration-200"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.25.2 2.25.2v2.45h-1.27c-1.25 0-1.64.78-1.64 1.57v1.88h2.79l-.45 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/mamsa213?igsh=MTBpNHFlZHZrbmM3ZQ=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="text-green-200 hover:text-white transition-colors duration-200"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.98 1.53a1.17 1.17 0 1 1 0 2.34 1.17 1.17 0 0 1 0-2.34ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z" />
                </svg>
              </a>
              <a
                href="https://x.com/mamsafraternity"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on X"
                className="text-green-200 hover:text-white transition-colors duration-200"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.9 2H22l-6.77 7.73L23.2 22h-6.26l-4.9-6.62L6.25 22H3.14l7.24-8.28L.8 2h6.43l4.43 6.01L18.9 2zm-1.1 18h1.72L6.31 3.9H4.47L17.8 20z" />
                </svg>
              </a>
            </div>
            <p className="text-xs text-green-300 mt-2">© {currentYear} MAMSA. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen lg:ml-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 left-0 lg:left-64 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900 lg:ml-0">
                {pathname === '/admin/profile'
                  ? 'My Profile'
                  : navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4 lg:mx-8 hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content, users, or settings..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </form>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Button for Mobile */}
              <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 sm:p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-4 text-sm text-gray-500">Loading notifications…</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">No notifications yet.</div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            href={`/contact-management?message=${notification.recordId}`}
                            onClick={() => {
                              markNotificationAsRead(notification.id);
                              setShowNotifications(false);
                            }}
                            className={`block p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                              notification.unread ? 'bg-emerald-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                                notification.unread ? 'bg-emerald-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 leading-tight">
                                  {notification.title}
                                </p>
                                {notification.subtitle && (
                                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                    {notification.subtitle}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {notification.time}
                              </span>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="p-3 sm:p-4 border-t border-gray-200">
                      <Link
                        href="/contact-management"
                        className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-150"
                        onClick={() => setShowNotifications(false)}
                      >
                        View contact inbox
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Display */}
              <div className="flex items-center space-x-3">
                <AvatarImage
                  src={headerAvatarSrc}
                  name={profile?.full_name || currentUser?.name || currentUser?.email || 'Admin'}
                  size="md"
                  className="shadow-sm ring-2 ring-green-100"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {profile?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.email || currentUser?.email || 'admin@mamsa.org'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pt-16 min-h-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="w-full">
            {children}
            </div>
          </div>
        </main>
      </div>
    </div>
    </AdminProfileProvider>
  );
}
