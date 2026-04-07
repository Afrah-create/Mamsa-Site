'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { adminRequest } from '@/lib/admin-api';
import { getPublicUrl } from '@/lib/cloudinary';
import { optimizeImageForUpload } from '@/lib/image-client';
import { requireAuth, type SessionUser } from '@/lib/session-manager';

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  phone: string;
  bio: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    email: ''
  });

  const resolveImageUrl = (value?: string | null) => {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value;
    return getPublicUrl(value) || '';
  };

  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        const session = await requireAuth();
        if (!session) return;
        setUser(session.user);
        await loadProfile(session.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      }
    };

    void verifyAndLoad();
  }, []);

  const loadProfile = async (sessionUser: SessionUser) => {
    try {
      console.log('Loading profile for user:', sessionUser.id);

      const data = await adminRequest<ProfileData | null>('/api/admin/profile');

      console.log('Profile query result:', { data });

      if (!data) {
        const fallbackProfile = {
          id: String(sessionUser.id),
          email: sessionUser.email || '',
          full_name: sessionUser.name || sessionUser.email?.split('@')[0] || '',
          avatar_url: '',
          phone: '',
          bio: '',
          role: sessionUser.role || 'admin',
          created_at: new Date().toISOString()
        };
        setProfile(fallbackProfile);
        setFormData({
          full_name: fallbackProfile.full_name,
          phone: '',
          bio: '',
          email: fallbackProfile.email || sessionUser.email || ''
        });
        setLoading(false);
        return;
      }

      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        email: data.email || sessionUser.email || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      const fallbackProfile = {
        id: String(sessionUser.id),
        email: sessionUser.email || '',
        full_name: sessionUser.name || sessionUser.email?.split('@')[0] || '',
        avatar_url: '',
        phone: '',
        bio: '',
        role: sessionUser.role || 'admin',
        created_at: new Date().toISOString()
      };
      setProfile(fallbackProfile);
      setFormData({
        full_name: fallbackProfile.full_name,
        phone: '',
        bio: '',
        email: fallbackProfile.email || sessionUser.email || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const base64String = await optimizeImageForUpload(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      });

      try {
        // Update profile with optimized base64 image data
        const updated = await adminRequest<ProfileData>('/api/admin/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: formData.full_name,
            phone: formData.phone,
            bio: formData.bio,
            email: formData.email,
            image: base64String,
          }),
        });

        // Update local state
        setProfile(updated ?? null);
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      } catch (error) {
        console.error('Update failed:', error);
        setMessage({ type: 'error', text: 'Failed to update profile picture. Please try again.' });
      } finally {
        setUploading(false);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: 'Failed to upload profile picture. Please try again.' });
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      console.log('Attempting to update profile for user:', user?.id);
      console.log('Form data:', formData);

      if (!user?.id) {
        throw new Error('User ID is not available');
      }

      // Try to update the profile directly
      const updatePayload = {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
        email: formData.email || null
      };

      console.log('Update payload:', updatePayload);

      const updatedProfile = await adminRequest<ProfileData>('/api/admin/profile', {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
      });

      setProfile(updatedProfile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });

    } catch (error) {
      console.error('Update failed with detailed error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: `Failed to update profile: ${errorMessage}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout user={user}>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and profile information.</p>
          </div>

          {/* Loading skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h2>
                <div className="text-center">
                  <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-medium text-gray-400">A</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and profile information.</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h2>
              
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {profile?.avatar_url ? (
                      <img 
                        src={resolveImageUrl(profile.avatar_url)} 
                        alt="Profile" 
                        className="h-32 w-32 rounded-full object-cover"
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-medium text-gray-600">
                        {(formData.full_name || user?.email || 'Admin').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Uploading...</span>
                    </div>
                  )}
                </div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {uploading ? 'Uploading...' : 'Change Picture'}
                  </span>
                </label>
                
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
              
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        full_name: profile?.full_name || '',
                        phone: profile?.phone || '',
                        bio: profile?.bio || '',
                        email: profile?.email || user?.email || ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{profile?.role || 'Administrator'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-sm text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Today'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 
                 profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Today'}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>
              </div>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Password
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        <ChangePasswordModal 
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      </div>
    </AdminLayout>
  );
}
