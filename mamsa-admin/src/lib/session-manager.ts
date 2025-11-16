'use client';

import { createClient } from './supabase';
import { User } from '@supabase/supabase-js';

export interface SessionData {
  user: User;
  adminData: {
    role: string;
    status: string;
    id: number;
  };
}

/**
 * Clear all session data from storage
 */
export function clearSessionData() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error('Error clearing session data:', error);
  }
}

/**
 * Validate current session and check if user is still authenticated
 */
export async function validateSession(): Promise<SessionData | null> {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      clearSessionData();
      return null;
    }

    // Verify user is still an admin (super_admin, admin, or moderator)
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role, status, id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData) {
      clearSessionData();
      return null;
    }

    // Valid admin roles
    const validRoles = ['super_admin', 'admin', 'moderator'];

    // Check if user is still active and has a valid admin role
    if (!validRoles.includes(adminData.role) || adminData.status !== 'active') {
      clearSessionData();
      return null;
    }

    return {
      user,
      adminData: {
        role: adminData.role,
        status: adminData.status,
        id: adminData.id,
      },
    };
  } catch (error) {
    console.error('Session validation error:', error);
    clearSessionData();
    return null;
  }
}

/**
 * Check if user is authenticated and redirect if not
 */
export async function requireAuth(): Promise<SessionData | null> {
  const session = await validateSession();
  
  if (!session) {
    // Clear any remaining data
    clearSessionData();
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return session;
}

/**
 * Set up session monitoring to detect logout from other tabs/windows
 */
export function setupSessionMonitoring(onSessionInvalid: () => void) {
  if (typeof window === 'undefined') return;

  // Listen for storage events (logout from other tabs)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'sb-auth-token' || e.key === null) {
      // Session was cleared, invalidate current session
      onSessionInvalid();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Periodically check session validity
  const intervalId = setInterval(async () => {
    const isValid = await validateSession();
    if (!isValid) {
      onSessionInvalid();
      clearInterval(intervalId);
    }
  }, 60000); // Check every minute

  return () => {
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(intervalId);
  };
}

