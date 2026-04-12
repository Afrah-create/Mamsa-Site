'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import { adminRequest } from '@/lib/admin-api';
import { requireAuth, type SessionUser } from '@/lib/session-manager';
import { getPublicUrl } from '@/lib/cloudinary';

type StudentDetail = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  bio: string | null;
  category: string;
  title: string;
  description: string | null;
  location: string | null;
  website_url: string | null;
  social_links: unknown;
  is_active: number;
  is_featured: number;
};

type PaymentRow = Record<string, unknown>;

type DetailPayload = {
  student: StudentDetail;
  payments: PaymentRow[];
};

function imageSrc(profileImage: string | null) {
  if (!profileImage) return '';
  const t = String(profileImage).trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return getPublicUrl(t.replace(/^\/+/, '')) || '';
}

export default function SkilledStudentDetailAdminPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<DetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const session = await requireAuth();
      if (!session) return;
      setUser(session.user);
    } catch {
      window.location.href = '/login';
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminRequest<DetailPayload>(`/api/admin/skilled-students/${id}`);
      setPayload(data);
    } catch (e) {
      setPayload(null);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user || !id) return;
    void load();
  }, [user, id, load]);

  if (loadingUser || !user) {
    return <AdminLoadingState />;
  }

  const s = payload?.student;
  const img = s ? imageSrc(s.profile_image) : '';

  return (
    <AdminLayout user={user}>
      <div className="space-y-6 p-6">
        <nav className="text-sm text-gray-500">
          <Link href="/skilled-students" className="font-medium text-emerald-600 hover:text-emerald-800">
            Skilled students
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{s?.full_name ?? id}</span>
        </nav>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : s ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
            <div className="space-y-4">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {img ? (
                  <Image src={img} alt={s.full_name} fill className="object-cover" sizes="280px" unoptimized />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-gray-400">No image</div>
                )}
              </div>
              <Link
                href={`/community/students/${s.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-800"
              >
                Open public profile (if active)
              </Link>
            </div>

            <div className="min-w-0 space-y-6">
              <header>
                <h1 className="text-2xl font-bold text-gray-900">{s.full_name}</h1>
                <p className="mt-1 text-emerald-700">{s.title}</p>
                <p className="mt-2 text-sm text-gray-500">
                  {s.email}
                  {s.phone ? ` · ${s.phone}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-1 font-medium capitalize text-gray-700">{s.category}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700">
                    Listing {s.is_active ? 'on' : 'off'}
                  </span>
                  {s.is_featured ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-800">Featured</span>
                  ) : null}
                </div>
              </header>

              {s.location ? <p className="text-sm text-gray-600">{s.location}</p> : null}
              {s.website_url ? (
                <p className="text-sm">
                  <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    {s.website_url}
                  </a>
                </p>
              ) : null}
              {s.bio ? (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bio</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{s.bio}</p>
                </section>
              ) : null}
              {s.description ? (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{s.description}</p>
                </section>
              ) : null}

              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payments</h2>
                {payload?.payments.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No payment records.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white text-sm">
                    {(payload?.payments ?? []).map((p, i) => (
                      <li key={i} className="px-3 py-2 font-mono text-xs text-gray-700">
                        {JSON.stringify(p)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
