'use client';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

export interface SessionData {
  user: SessionUser;
  adminData: {
    role: string;
    status: string;
    id: string;
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
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      clearSessionData();
      return null;
    }

    const payload = (await response.json()) as {
      user?: SessionUser | null;
      adminData?: {
        role: string;
        status: string;
        id: string;
      };
    };

    if (!payload.user) {
      clearSessionData();
      return null;
    }

    return {
      user: payload.user,
      adminData:
        payload.adminData ?? {
          role: payload.user.role,
          status: 'active',
          id: String(payload.user.id),
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
    if (e.key === null) {
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

