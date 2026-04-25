import { resolveImageSrc } from '@/lib/image-utils';

export type SkilledStudentRecord = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  bio: string | null;
  category: 'skill' | 'business';
  title: string;
  description: string | null;
  location: string | null;
  website_url: string | null;
  social_links: unknown;
  is_active: number;
  is_featured: number;
};

export function resolveStudentImagePreview(profileImage: string | null | undefined): string {
  if (!profileImage) return '';
  const t = String(profileImage).trim();
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:')) return t;
  return resolveImageSrc(t) ?? '';
}

export function socialLinksToText(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return JSON.stringify(p, null, 2);
    } catch {
      return raw;
    }
  }
  if (typeof raw === 'object') {
    return JSON.stringify(raw, null, 2);
  }
  return '';
}

export function parseSocialLinksInput(text: string): unknown {
  const t = text.trim();
  if (!t) return null;
  const parsed = JSON.parse(t) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Social links must be a JSON object, e.g. {"linkedin":"https://..."}');
  }
  return parsed;
}

export function rowToStudentRecord(row: Record<string, unknown>): SkilledStudentRecord {
  const cat = String(row.category ?? 'skill').toLowerCase();
  const category = cat === 'business' ? 'business' : 'skill';
  return {
    id: Number(row.id),
    full_name: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone != null ? String(row.phone) : null,
    profile_image: row.profile_image != null ? String(row.profile_image) : null,
    bio: row.bio != null ? String(row.bio) : null,
    category,
    title: String(row.title ?? ''),
    description: row.description != null ? String(row.description) : null,
    location: row.location != null ? String(row.location) : null,
    website_url: row.website_url != null ? String(row.website_url) : null,
    social_links: row.social_links,
    is_active: Number(row.is_active ?? 0) ? 1 : 0,
    is_featured: Number(row.is_featured ?? 0) ? 1 : 0,
  };
}

export function formatDateInput(value: unknown): string {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export type PaymentRecord = {
  id: number;
  amount: number;
  currency: string;
  payment_date: string;
  expiry_date: string;
  payment_method: string | null;
  transaction_ref: string | null;
  status: 'active' | 'pending' | 'expired';
  notes: string | null;
};

export type StudentProductRecord = {
  id: number;
  student_id: number;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  category: string | null;
  is_available: number;
  is_featured: number;
  display_order: number;
  created_at: string;
  updated_at: string | null;
};

export type ListingBadge = { label: string; tone: 'green' | 'red' | 'amber' };

/** Latest payment = highest payment_date, then id (matches API ordering). */
export function listingBadgeFromPayments(payments: Record<string, unknown>[]): ListingBadge {
  const sorted = [...payments].sort((a, b) => {
    const da = String(a.payment_date ?? '');
    const db = String(b.payment_date ?? '');
    if (da !== db) return db.localeCompare(da);
    return Number(b.id) - Number(a.id);
  });
  const latest = sorted[0];
  if (!latest) return { label: 'Inactive', tone: 'red' };

  const status = String(latest.status ?? '').toLowerCase();
  const expStr = formatDateInput(latest.expiry_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let expDay: Date | null = null;
  if (expStr) {
    const parts = expStr.split('-').map(Number);
    const [y, m, d] = parts;
    if (y && m && d) expDay = new Date(y, m - 1, d);
  }

  if (status === 'pending') return { label: 'Pending', tone: 'amber' };
  if (status === 'active' && expDay && expDay >= today) return { label: 'Active', tone: 'green' };
  return { label: 'Inactive', tone: 'red' };
}

export function rowToPaymentRecord(row: Record<string, unknown>): PaymentRecord {
  const statusRaw = String(row.status ?? 'pending').toLowerCase();
  const status =
    statusRaw === 'active' || statusRaw === 'expired' ? (statusRaw as 'active' | 'expired') : 'pending';
  return {
    id: Number(row.id),
    amount: Number(row.amount),
    currency: String(row.currency ?? 'UGX'),
    payment_date: formatDateInput(row.payment_date),
    expiry_date: formatDateInput(row.expiry_date),
    payment_method: row.payment_method != null ? String(row.payment_method) : null,
    transaction_ref: row.transaction_ref != null ? String(row.transaction_ref) : null,
    status,
    notes: row.notes != null ? String(row.notes) : null,
  };
}

export function rowToStudentProductRecord(row: Record<string, unknown>): StudentProductRecord {
  return {
    id: Number(row.id),
    student_id: Number(row.student_id),
    name: String(row.name ?? ''),
    description: row.description != null ? String(row.description) : null,
    price: row.price == null || String(row.price).trim() === '' ? null : Number(row.price),
    currency: String(row.currency ?? 'UGX'),
    image_url: row.image_url != null ? String(row.image_url) : null,
    category: row.category != null ? String(row.category) : null,
    is_available: Number(row.is_available ?? 1) ? 1 : 0,
    is_featured: Number(row.is_featured ?? 0) ? 1 : 0,
    display_order: Number(row.display_order ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
  };
}
