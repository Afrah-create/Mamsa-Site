'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/admin-api';
import type { PaymentRecord } from './student-form-utils';

type Props = {
  isOpen: boolean;
  studentId: number;
  payment: PaymentRecord | null;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function EditPaymentModal({ isOpen, studentId, payment, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('UGX');
  const [paymentDate, setPaymentDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [status, setStatus] = useState<'active' | 'pending' | 'expired'>('pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !payment) return;
    setAmount(String(payment.amount));
    setCurrency(payment.currency || 'UGX');
    setPaymentDate(payment.payment_date);
    setExpiryDate(payment.expiry_date);
    setPaymentMethod(payment.payment_method ?? '');
    setTransactionRef(payment.transaction_ref ?? '');
    setStatus(payment.status);
    setNotes(payment.notes ?? '');
    setFormError('');
    setLoading(false);
  }, [isOpen, payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    setFormError('');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      await adminRequest<unknown>(`/api/admin/skilled-students/${studentId}/payments/${payment.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: amt,
          currency: currency.trim() || 'UGX',
          payment_date: paymentDate,
          expiry_date: expiryDate,
          payment_method: paymentMethod.trim() || null,
          transaction_ref: transactionRef.trim() || null,
          status,
          notes: notes.trim() || null,
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-emerald-50 p-5">
          <h3 className="text-lg font-semibold text-gray-900">Edit payment</h3>
          <button type="button" onClick={handleClose} className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-600" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {formError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div> : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount *</label>
              <input type="number" step="0.01" min="0" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
              <input className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={8} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Payment date *</label>
              <input type="date" className={inputClass} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Expiry date *</label>
              <input type="date" className={inputClass} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Payment method</label>
              <input className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Transaction ref</label>
              <input className={inputClass} value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Status *</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="active">active</option>
                <option value="pending">pending</option>
                <option value="expired">expired</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={handleClose} disabled={loading} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
