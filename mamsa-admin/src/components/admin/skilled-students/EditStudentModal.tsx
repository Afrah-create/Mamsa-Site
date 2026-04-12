'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/admin-api';
import { optimizeImageForUpload } from '@/lib/image-client';
import {
  parseSocialLinksInput,
  resolveStudentImagePreview,
  socialLinksToText,
  type SkilledStudentRecord,
} from './student-form-utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  student: SkilledStudentRecord | null;
  onSuccess: () => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function EditStudentModal({ isOpen, onClose, student, onSuccess }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState<'skill' | 'business'>('skill');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialText, setSocialText] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !student) return;
    setFullName(student.full_name);
    setEmail(student.email);
    setPhone(student.phone ?? '');
    setBio(student.bio ?? '');
    setCategory(student.category);
    setTitle(student.title);
    setDescription(student.description ?? '');
    setLocation(student.location ?? '');
    setWebsiteUrl(student.website_url ?? '');
    setSocialText(socialLinksToText(student.social_links));
    setIsFeatured(Boolean(student.is_featured));
    setIsActive(Boolean(student.is_active));
    setImageBase64(null);
    setImagePreview(resolveStudentImagePreview(student.profile_image));
    setFormError('');
    setLoading(false);
  }, [isOpen, student]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await optimizeImageForUpload(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.78,
    });
    setImageBase64(dataUrl);
    setImagePreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setFormError('');
    if (!fullName.trim() || !email.trim() || !title.trim()) {
      setFormError('Full name, email, and title are required.');
      return;
    }
    let socialLinks: unknown = null;
    try {
      socialLinks = parseSocialLinksInput(socialText);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invalid social links JSON');
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        category,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        website_url: websiteUrl.trim() || null,
        social_links: socialLinks,
        is_featured: isFeatured ? 1 : 0,
        is_active: isActive ? 1 : 0,
      };
      if (imageBase64) body.profile_image = imageBase64;

      await adminRequest<unknown>(`/api/admin/skilled-students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="relative my-4 w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Edit student</h3>
            <p className="text-sm text-gray-500">Update listing details. New image replaces the previous one on Cloudinary.</p>
          </div>
          <button type="button" onClick={handleClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-gray-600" aria-label="Close">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>
          ) : null}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-sm font-semibold text-gray-800">Profile image</label>
            {imagePreview ? (
              <div className="space-y-2">
                <div className="relative h-48 w-full overflow-hidden rounded-lg border border-gray-200">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setImageBase64(null);
                      setImagePreview(resolveStudentImagePreview(student.profile_image));
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Revert to current
                  </button>
                  <input type="file" accept="image/*" onChange={handleImage} className="text-sm text-gray-600" />
                </div>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleImage} className="block w-full text-sm text-gray-600" />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Full name *</label>
              <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as 'skill' | 'business')}>
                <option value="skill">Skill</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Title / headline *</label>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
              <textarea className={inputClass} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Website URL</label>
              <input type="url" className={inputClass} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Social links (JSON object)</label>
              <textarea className={inputClass} rows={4} value={socialText} onChange={(e) => setSocialText(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input id="edit-featured" type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <label htmlFor="edit-featured" className="text-sm text-gray-700">
                Featured listing
              </label>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input id="edit-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <label htmlFor="edit-active" className="text-sm text-gray-700">
                Listing visible (is_active)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={handleClose} disabled={loading} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
