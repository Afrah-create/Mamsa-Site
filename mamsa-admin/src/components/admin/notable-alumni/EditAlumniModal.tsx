'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/admin-api';
import { optimizeImageForUpload } from '@/lib/image-client';
import { resolveImageSrc } from '@/lib/image-utils';
import { pairsToProfileLinks, profileLinksToPairs, type LinkPair } from './profile-links-utils';

type Props = {
  isOpen: boolean;
  item: Record<string, unknown> | null;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function EditAlumniModal({ isOpen, item, onClose, onSuccess }: Props) {
  const [fullName, setFullName] = useState('');
  const [graduationYear, setGraduationYear] = useState<string>('');
  const [profession, setProfession] = useState('');
  const [achievement, setAchievement] = useState('');
  const [bio, setBio] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState('draft');
  const [linkPairs, setLinkPairs] = useState<LinkPair[]>([{ key: '', value: '' }]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    setFullName(String(item.full_name ?? ''));
    setGraduationYear(item.graduation_year != null ? String(item.graduation_year) : '');
    setProfession(String(item.current_position ?? ''));
    setAchievement(String(item.achievements ?? ''));
    setBio(String(item.biography ?? ''));
    setIsFeatured(Number(item.featured) === 1);
    setStatus(String(item.status ?? 'draft'));
    setLinkPairs(profileLinksToPairs(item.profile_links));
    setImageBase64(null);
    const u = item.image_url != null ? resolveImageSrc(String(item.image_url)) : '';
    setImagePreview(u || null);
    setFormError('');
    setLoading(false);
  }, [isOpen, item]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await optimizeImageForUpload(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
    setImageBase64(dataUrl);
    setImagePreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFormError('');
    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    const gy = graduationYear.trim() ? Number(graduationYear) : null;
    if (graduationYear.trim() && !Number.isFinite(gy)) {
      setFormError('Graduation year must be a number.');
      return;
    }
    const id = Number(item.id);
    setLoading(true);
    try {
      const profile_links = pairsToProfileLinks(linkPairs);
      const body: Record<string, unknown> = {
        full_name: fullName.trim(),
        graduation_year: gy,
        profession: profession.trim() || null,
        achievement: achievement.trim() || null,
        bio: bio.trim() || null,
        is_featured: isFeatured ? 1 : 0,
        status,
        profile_links: Object.keys(profile_links).length ? profile_links : null,
      };
      if (imageBase64) body.image_url = imageBase64;
      await adminRequest(`/api/admin/notable-alumni/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="relative my-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Edit alumni</h2>
        <form onSubmit={handleSubmit} className="mt-4 max-h-[80vh] space-y-3 overflow-y-auto pr-1">
          <label className="block text-sm font-medium text-gray-700">
            Full name
            <input className={`${inputClass} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Graduation year
            <input className={`${inputClass} mt-1`} value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Profession
            <input className={`${inputClass} mt-1`} value={profession} onChange={(e) => setProfession(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Achievement
            <textarea className={`${inputClass} mt-1`} rows={2} value={achievement} onChange={(e) => setAchievement(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Bio
            <textarea className={`${inputClass} mt-1`} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Status
            <select className={`${inputClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile links</p>
            <div className="mt-2 space-y-2">
              {linkPairs.map((pair, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="Label"
                    value={pair.key}
                    onChange={(e) => {
                      const next = [...linkPairs];
                      next[i] = { ...next[i], key: e.target.value };
                      setLinkPairs(next);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="URL"
                    value={pair.value}
                    onChange={(e) => {
                      const next = [...linkPairs];
                      next[i] = { ...next[i], value: e.target.value };
                      setLinkPairs(next);
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-emerald-600 hover:underline"
                onClick={() => setLinkPairs([...linkPairs, { key: '', value: '' }])}
              >
                + Add link
              </button>
            </div>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Replace image
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={handleImage} />
          </label>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="h-28 max-w-full rounded border object-contain" />
          ) : null}
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => !loading && onClose()}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
