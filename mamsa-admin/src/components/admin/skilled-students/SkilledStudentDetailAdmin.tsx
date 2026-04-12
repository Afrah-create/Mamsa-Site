'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { requireAuth, type SessionUser } from '@/lib/session-manager';
import { publicAssetUrl } from '@/lib/upload';
import AddPaymentModal from './AddPaymentModal';
import EditPaymentModal from './EditPaymentModal';
import EditStudentModal from './EditStudentModal';
import {
  listingBadgeFromPayments,
  rowToPaymentRecord,
  rowToStudentRecord,
  type PaymentRecord,
  type SkilledStudentRecord,
} from './student-form-utils';

type DetailPayload = {
  student: SkilledStudentRecord;
  payments: Record<string, unknown>[];
};

function imageSrc(profileImage: string | null) {
  if (!profileImage) return '';
  const t = String(profileImage).trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return publicAssetUrl(t);
}

function badgeToneClass(tone: 'green' | 'red' | 'amber') {
  switch (tone) {
    case 'green':
      return 'border border-green-200 bg-green-100 text-green-800';
    case 'amber':
      return 'border border-amber-200 bg-amber-100 text-amber-800';
    default:
      return 'border border-red-200 bg-red-100 text-red-800';
  }
}

export default function SkilledStudentDetailAdmin() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<DetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<PaymentRecord | null>(null);
  const [deletePaymentLoading, setDeletePaymentLoading] = useState(false);

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
      const data = await adminRequest<{ student: Record<string, unknown>; payments: Record<string, unknown>[] }>(
        `/api/admin/skilled-students/${id}`,
      );
      setPayload({
        student: rowToStudentRecord(data.student),
        payments: data.payments ?? [],
      });
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

  const afterMutation = useCallback(() => {
    router.refresh();
    void load();
  }, [router, load]);

  const listingBadge = useMemo(() => {
    if (!payload?.payments) return listingBadgeFromPayments([]);
    return listingBadgeFromPayments(payload.payments);
  }, [payload?.payments]);

  const studentNumericId = payload?.student?.id ?? (id ? Number(id) : 0);

  const confirmDeletePayment = async () => {
    if (!deletePaymentTarget || !studentNumericId) return;
    setDeletePaymentLoading(true);
    try {
      await adminRequest(`/api/admin/skilled-students/${studentNumericId}/payments/${deletePaymentTarget.id}`, {
        method: 'DELETE',
      });
      showToast('Payment deleted.', 'success');
      setDeletePaymentTarget(null);
      afterMutation();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete payment.', 'error');
    } finally {
      setDeletePaymentLoading(false);
    }
  };

  if (loadingUser || !user) {
    return <AdminLoadingState />;
  }

  const s = payload?.student;
  const img = s ? imageSrc(s.profile_image) : '';

  return (
    <AdminLayout user={user}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

      {s ? (
        <EditStudentModal
          isOpen={showEditStudent}
          student={s}
          onClose={() => setShowEditStudent(false)}
          onSuccess={() => {
            showToast('Student updated.', 'success');
            afterMutation();
          }}
        />
      ) : null}

      {studentNumericId ? (
        <AddPaymentModal
          isOpen={showAddPayment}
          studentId={studentNumericId}
          onClose={() => setShowAddPayment(false)}
          onSuccess={() => {
            showToast('Payment added.', 'success');
            afterMutation();
          }}
        />
      ) : null}

      {studentNumericId ? (
        <EditPaymentModal
          isOpen={showEditPayment}
          studentId={studentNumericId}
          payment={editingPayment}
          onClose={() => {
            setShowEditPayment(false);
            setEditingPayment(null);
          }}
          onSuccess={() => {
            showToast('Payment updated.', 'success');
            afterMutation();
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={Boolean(deletePaymentTarget)}
        onClose={() => !deletePaymentLoading && setDeletePaymentTarget(null)}
        onConfirm={confirmDeletePayment}
        title="Delete payment"
        message="Remove this payment record? This cannot be undone."
        confirmText="Delete"
        loading={deletePaymentLoading}
      />

      <div className="space-y-6 p-6">
        <nav className="text-sm text-gray-500">
          <Link href="/admin/skilled-students" className="font-medium text-emerald-600 hover:text-emerald-800">
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
          <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeToneClass(listingBadge.tone)}`}
              >
                {listingBadge.label}
              </span>
              <button
                type="button"
                onClick={() => setShowEditStudent(true)}
                className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
              >
                Edit student
              </button>
            </div>

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
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payments</h2>
                    <button
                      type="button"
                      onClick={() => setShowAddPayment(true)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Add payment
                    </button>
                  </div>

                  {payload.payments.length === 0 ? (
                    <p className="text-sm text-gray-500">No payment records.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                          <tr>
                            <th className="px-3 py-2">Amount</th>
                            <th className="px-3 py-2">Dates</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Ref</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {payload.payments.map((raw) => {
                            const p = rowToPaymentRecord(raw);
                            return (
                              <tr key={p.id}>
                                <td className="px-3 py-2">
                                  {p.amount} {p.currency}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600">
                                  <div>Pay: {p.payment_date}</div>
                                  <div>Exp: {p.expiry_date}</div>
                                </td>
                                <td className="px-3 py-2 capitalize">{p.status}</td>
                                <td className="max-w-[140px] truncate px-3 py-2 text-xs text-gray-500">{p.transaction_ref ?? '—'}</td>
                                <td className="px-3 py-2">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPayment(p);
                                        setShowEditPayment(true);
                                      }}
                                      className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                                      title="Edit payment"
                                      aria-label="Edit payment"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletePaymentTarget(p)}
                                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                                      title="Delete payment"
                                      aria-label="Delete payment"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
