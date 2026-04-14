export type AdminRole = 'super_admin' | 'admin' | 'moderator';
export type AdminStatus = 'active' | 'inactive' | 'suspended';

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login: string | null;
}

const ROLES: AdminRole[] = ['super_admin', 'admin', 'moderator'];
const STATUSES: AdminStatus[] = ['active', 'inactive', 'suspended'];

export function parseAdminRole(value: string): AdminRole {
  const v = String(value || '').trim();
  return ROLES.includes(v as AdminRole) ? (v as AdminRole) : 'admin';
}

export function parseAdminStatus(value: string): AdminStatus {
  const v = String(value || '').trim();
  return STATUSES.includes(v as AdminStatus) ? (v as AdminStatus) : 'active';
}

/** DB row shape from mysql2 (dates may be Date or string). */
export type AdminUserRow = {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: Date | string;
  last_login?: Date | string | null;
};

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  return s.length ? s : null;
}

function emptyToNull(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length ? t : null;
}

export function rowToAdminUser(row: AdminUserRow): AdminUser {
  const email = String(row.email).trim();
  const fullName = (row.full_name ?? '').trim() || email;
  return {
    id: row.id,
    full_name: fullName,
    email,
    role: parseAdminRole(row.role),
    status: parseAdminStatus(row.status),
    phone: emptyToNull(row.phone),
    bio: emptyToNull(row.bio),
    avatar_url: row.avatar_url != null && String(row.avatar_url).trim() !== '' ? String(row.avatar_url).trim() : null,
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
    last_login: toIso(row.last_login ?? null),
  };
}
