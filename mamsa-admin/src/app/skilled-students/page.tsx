'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import { adminRequest } from '@/lib/admin-api';
import { requireAuth, type SessionUser } from '@/lib/session-manager';

type SkilledStudentRow = {
  id: number;
  full_name: string;
  email: string;
  title: string;
  category: string;
  is_active: number;
  is_featured: number;
  latest_payment_status?: string | null;
  latest_payment_expiry?: string | null;
};

type ListPayload = {
  items: SkilledStudentRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function SkilledStudentsAdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SkilledStudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

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
    try {
      setLoading(true);
      const q = new URLSearchParams({ page: '1', limit: '50' });
      if (search.trim()) q.set('search', search.trim());
      const data = await adminRequest<ListPayload>(`/api/admin/skilled-students?${q.toString()}`);
      setRows(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  if (loadingUser || !user) {
    return <AdminLoadingState />;
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skilled students</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage directory listings and payments. Public site shows only active students with a valid payment window.
            </p>
          </div>
          <Link
            href="/community/students"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            View public directory
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or title…"
            className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-md"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      No skilled students yet. Create one via the API or seed scripts.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.full_name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-700">{r.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            r.is_active
                              ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                              : 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                          }
                        >
                          {r.is_active ? 'On' : 'Off'}
                        </span>
                        {r.is_featured ? (
                          <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Featured
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {r.latest_payment_status ?? '—'}
                        {r.latest_payment_expiry ? (
                          <div className="text-gray-400">Expires {String(r.latest_payment_expiry)}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/skilled-students/${r.id}`}
                          className="font-semibold text-emerald-600 hover:text-emerald-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {total > 0 ? <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">{total} total</p> : null}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
