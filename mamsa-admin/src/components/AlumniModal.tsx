'use client';

import { useEffect, useState } from 'react';

type AlumniStatus = 'draft' | 'published' | 'archived';

export type AlumniFormValues = {
  full_name: string;
  slug: string;
  graduation_year: string;
  biography: string;
  achievements: string;
  current_position: string;
  organization: string;
  specialty: string;
  image_url: string;
  linkedin: string;
  twitter: string;
  website: string;
  featured: boolean;
  status: AlumniStatus;
  order_position: number;
};

export type AlumniRecord = {
  id: number;
  full_name: string;
  slug: string | null;
  graduation_year: number | null;
  biography: string | null;
  achievements: string | null;
  current_position: string | null;
  organization: string | null;
  specialty: string | null;
  image_url: string | null;
  profile_links: Record<string, string | null> | null;
  featured: boolean;
  status: AlumniStatus;
  order_position: number;
  created_at: string;
};

const defaultValues: AlumniFormValues = {
  full_name: '',
  slug: '',
  graduation_year: '',
  biography: '',
  achievements: '',
  current_position: '',
  organization: '',
  specialty: '',
  image_url: '',
  linkedin: '',
  twitter: '',
  website: '',
  featured: false,
  status: 'draft',
  order_position: 0,
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: AlumniFormValues) => Promise<void> | void;
  editingItem?: AlumniRecord | null;
};

export default function AlumniModal({ isOpen, onClose, onSave, editingItem }: Props) {
  const [form, setForm] = useState<AlumniFormValues>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm(defaultValues);
      setSaving(false);
      setImagePreview('');
      setImageUploadError(null);
      return;
    }

    if (editingItem) {
      setForm({
        full_name: editingItem.full_name ?? '',
        slug: editingItem.slug ?? '',
        graduation_year: editingItem.graduation_year?.toString() ?? '',
        biography: editingItem.biography ?? '',
        achievements: editingItem.achievements ?? '',
        current_position: editingItem.current_position ?? '',
        organization: editingItem.organization ?? '',
        specialty: editingItem.specialty ?? '',
        image_url: editingItem.image_url ?? '',
        linkedin: editingItem.profile_links?.linkedin ?? '',
        twitter: editingItem.profile_links?.twitter ?? '',
        website: editingItem.profile_links?.website ?? '',
        featured: editingItem.featured ?? false,
        status: editingItem.status ?? 'draft',
        order_position: editingItem.order_position ?? 0,
      });
      setImagePreview(editingItem.image_url ?? '');
      setImageUploadError(null);
    } else {
      setForm(defaultValues);
      setImagePreview('');
      setImageUploadError(null);
    }
  }, [editingItem, isOpen]);

  useEffect(() => {
    if (!form.image_url) {
      setImagePreview('');
      return;
    }

    const value = form.image_url.trim();
    if (value.startsWith('data:image') || value.startsWith('http')) {
      setImagePreview(value);
    }
  }, [form.image_url]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name } = target;

    const nextValue =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : name === 'order_position'
        ? Number(target.value) || 0
        : target.value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please choose a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image must be 5MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({
        ...prev,
        image_url: base64,
      }));
      setImagePreview(base64);
      setImageUploadError(null);
    };

    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setForm((prev) => ({
      ...prev,
      image_url: '',
    }));
    setImagePreview('');
    setImageUploadError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingItem ? 'Edit Notable Alumni' : 'Add Notable Alumni'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Highlight inspiring members of the MAMSA community and their achievements.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-800">Core Details</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name<span className="text-emerald-600">*</span>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      required
                      placeholder="Dr. Jane Doe"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Preferred Slug
                    <input
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      placeholder="jane-doe"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Graduation Year
                    <input
                      name="graduation_year"
                      value={form.graduation_year}
                      onChange={handleChange}
                      inputMode="numeric"
                      placeholder="2015"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Specialty / Field
                    <input
                      name="specialty"
                      value={form.specialty}
                      onChange={handleChange}
                      placeholder="Cardiology"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-800">Profile Highlights</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Current Position
                    <input
                      name="current_position"
                      value={form.current_position}
                      onChange={handleChange}
                      placeholder="Senior Resident"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Organization
                    <input
                      name="organization"
                      value={form.organization}
                      onChange={handleChange}
                      placeholder="Mulago National Referral Hospital"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                </div>
                <label className="mt-4 block text-sm font-medium text-gray-700">
                  Key Achievements
                  <textarea
                    name="achievements"
                    value={form.achievements}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Highlight awards, recognitions, or impact…"
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-800">
                  Biography<span className="text-emerald-600">*</span>
                </h3>
                <textarea
                  name="biography"
                  value={form.biography}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Share the story behind this alum’s journey, contributions, and impact on the community…"
                  className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-800">Profile Image</h3>
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Upload from device</p>
                    <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-6 text-center text-sm text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50/60">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <svg className="mb-2 h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 12l-3-3m3 3l3-3M6 20h12" />
                      </svg>
                      <span className="font-semibold">Click to upload</span>
                      <span className="mt-1 text-xs text-emerald-700/70">JPG or PNG, up to 5MB</span>
                    </label>
                  </div>

                  {imagePreview ? (
                    <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
                      <img src={imagePreview} alt="Uploaded preview" className="h-48 w-full object-cover" />
                      <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-xs text-gray-500">Preview</span>
                        <button
                          type="button"
                          onClick={clearUploadedImage}
                          className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-xs text-gray-500">
                      No image selected yet.
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Or use hosted image URL</p>
                    <input
                      name="image_url"
                      value={form.image_url}
                      onChange={handleChange}
                      placeholder="https://example.com/photo.jpg"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>

                  {imageUploadError && <p className="text-xs text-red-600">{imageUploadError}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-800">Profile Links</h3>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-medium text-gray-700">
                    LinkedIn
                    <input
                      name="linkedin"
                      value={form.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="block text-xs font-medium text-gray-700">
                    Twitter / X
                    <input
                      name="twitter"
                      value={form.twitter}
                      onChange={handleChange}
                      placeholder="https://twitter.com/username"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="block text-xs font-medium text-gray-700">
                    Personal Website
                    <input
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-800">Display Settings</h3>
                <div className="mt-4 space-y-4">
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={form.featured}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Mark as featured alumni
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Display Order
                    <input
                      type="number"
                      name="order_position"
                      value={form.order_position}
                      onChange={handleChange}
                      min={0}
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <span className="mt-1 block text-xs text-gray-500">Lower numbers appear first.</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.full_name || !form.biography}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {saving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx={12} cy={12} r={10} strokeWidth={4} />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeWidth={4} strokeLinecap="round" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {editingItem ? 'Update Alumni' : 'Add Alumni'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

