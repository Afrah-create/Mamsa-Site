'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { optimizeImageForUpload } from '@/lib/image-client';
import { resolveStudentImagePreview, type StudentProductRecord } from './student-form-utils';

type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  display_order: string;
  is_available: boolean;
  is_featured: boolean;
  image_url: string | null;
};

type Props = {
  isOpen: boolean;
  loading?: boolean;
  product?: StudentProductRecord | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

const defaultValues: ProductFormValues = {
  name: '',
  description: '',
  price: '',
  currency: 'UGX',
  category: '',
  display_order: '0',
  is_available: true,
  is_featured: false,
  image_url: null,
};

export default function ProductModal({ isOpen, loading = false, product, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ProductFormValues>(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        price: product.price != null ? String(product.price) : '',
        currency: product.currency || 'UGX',
        category: product.category ?? '',
        display_order: String(product.display_order ?? 0),
        is_available: Boolean(product.is_available),
        is_featured: Boolean(product.is_featured),
        image_url: null,
      });
      setImagePreview(resolveStudentImagePreview(product.image_url));
    } else {
      setForm(defaultValues);
      setImagePreview(null);
    }
    setError('');
    setSubmitting(false);
  }, [isOpen, product]);

  const disabled = loading || submitting;

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await optimizeImageForUpload(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.78,
    });
    setForm((prev) => ({ ...prev, image_url: dataUrl }));
    setImagePreview(dataUrl);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Product name is required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="relative my-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{product ? 'Edit product' : 'Add product'}</h3>
            <p className="text-sm text-gray-500">Add a product or service for this student listing.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-gray-600" aria-label="Close">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-sm font-semibold text-gray-800">Product image</label>
            {imagePreview ? (
              <div className="space-y-2">
                <div className="relative h-44 w-full overflow-hidden rounded-lg border border-gray-200">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                </div>
                <input type="file" accept="image/*" onChange={handleImage} className="text-sm text-gray-600" />
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleImage} className="block w-full text-sm text-gray-600" />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
              <input className={inputClass} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
              <input className={inputClass} value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <input className={inputClass} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Display order</label>
              <input className={inputClass} type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input id="product-available" type="checkbox" checked={form.is_available} onChange={(e) => setForm((p) => ({ ...p, is_available: e.target.checked }))} />
              <label htmlFor="product-available" className="text-sm text-gray-700">Available on public site</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="product-featured" type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} />
              <label htmlFor="product-featured" className="text-sm text-gray-700">Featured product</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} disabled={disabled} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {disabled ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
