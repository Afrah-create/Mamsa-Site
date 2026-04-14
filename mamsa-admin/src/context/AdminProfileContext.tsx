'use client';

import { createContext, useContext, type ReactNode } from 'react';

/** Profile fields used in the admin header and profile UI (from GET /api/admin/profile). */
export type AdminHeaderProfile = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
} | null;

export type AdminProfileContextValue = {
  profile: AdminHeaderProfile;
  setProfile: (value: AdminHeaderProfile) => void;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AdminProfileContext = createContext<AdminProfileContextValue | null>(null);

export function AdminProfileProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AdminProfileContextValue;
}) {
  return <AdminProfileContext.Provider value={value}>{children}</AdminProfileContext.Provider>;
}

export function useAdminProfile() {
  const ctx = useContext(AdminProfileContext);
  if (!ctx) {
    throw new Error('useAdminProfile must be used within AdminLayout');
  }
  return ctx;
}
