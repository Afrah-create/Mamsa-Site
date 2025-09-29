'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import ChangePasswordModal from '@/components/ChangePasswordModal';

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  phone: string;
  bio: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
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

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/login';
        return;
      }

      setUser(user);
      await loadProfile(user.id);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/login';
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Profile query result:', { data, error });

      if (error) {
        console.error('Error loading profile:', error);
        
        // If no profile exists (PGRST116 is the "no rows found" error), create one
        if (error.code === 'PGRST116' || error.message.includes('No rows found') || error.message.includes('No rows returned')) {
          console.log('No profile found, creating new profile...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('admin_users')
            .insert({
              user_id: userId,
              email: user?.email || '',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
              role: 'admin'
            })
            .select()
            .single();

          console.log('Profile creation result:', { newProfile, createError });

          if (createError) {
            console.error('Failed to create profile:', createError);
            // Even if profile creation fails, we'll show the form with user data
            const fallbackProfile = {
              id: userId,
              user_id: userId,
              email: user?.email || '',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
              role: 'admin',
              created_at: new Date().toISOString()
            };
            setProfile(fallbackProfile);
            setFormData({
              full_name: fallbackProfile.full_name,
              phone: '',
              bio: '',
              email: fallbackProfile.email || user?.email || ''
            });
          } else {
            setProfile(newProfile);
            setFormData({
              full_name: newProfile.full_name || '',
              phone: newProfile.phone || '',
              bio: newProfile.bio || '',
              email: newProfile.email || user?.email || ''
            });
          }
        } else {
          // For other errors, show a fallback profile
          console.error('Unexpected error loading profile:', error);
          const fallbackProfile = {
            id: userId,
            user_id: userId,
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
            role: 'admin',
            created_at: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          setFormData({
            full_name: fallbackProfile.full_name,
            phone: '',
            bio: '',
            email: fallbackProfile.email || user?.email || ''
          });
        }
      } else {
        console.log('Profile loaded successfully:', data);
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          email: data.email || user?.email || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Even if everything fails, show a basic profile
      const fallbackProfile = {
        id: userId,
        user_id: userId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
        role: 'admin',
        created_at: new Date().toISOString()
      };
      setProfile(fallbackProfile);
      setFormData({
        full_name: fallbackProfile.full_name,
        phone: '',
        bio: '',
        email: fallbackProfile.email || user?.email || ''
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
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        
        try {
          // Update profile with base64 image data
          const { error: updateError } = await supabase
            .from('admin_users')
            .update({ avatar_url: base64String })
            .eq('user_id', user?.id);

          if (updateError) {
            throw updateError;
          }

          // Update local state
          setProfile(prev => prev ? { ...prev, avatar_url: base64String } : null);
          setMessage({ type: 'success', text: 'Profile picture updated successfully!' });

        } catch (error) {
          console.error('Update failed:', error);
          setMessage({ type: 'error', text: 'Failed to update profile picture. Please try again.' });
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsDataURL(file);

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

      const { data: updateData, error } = await supabase
        .from('admin_users')
        .update(updatePayload)
        .eq('user_id', user.id)
        .select();

      console.log('Update result:', { updateData, error });

      if (error) {
        console.error('Database update error:', error);
        
        // If the profile doesn't exist, try to create it
        if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
          console.log('Profile not found, attempting to create new profile...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('admin_users')
            .insert({
              user_id: user.id,
              full_name: formData.full_name || null,
              phone: formData.phone || null,
              bio: formData.bio || null,
              email: formData.email || user.email,
              role: 'admin'
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError);
            throw new Error(`Failed to create profile: ${createError.message}`);
          }

          console.log('Profile created successfully:', newProfile);
          setProfile(newProfile);
          setMessage({ type: 'success', text: 'Profile created successfully!' });
        } else {
          throw new Error(`Database update failed: ${error.message}`);
        }
      } else {
        if (!updateData || updateData.length === 0) {
          throw new Error('No rows were updated. Profile might not exist.');
        }

        console.log('Profile updated successfully:', updateData[0]);
        setProfile(updateData[0]);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }

      // Update email in auth if it changed
      if (formData.email !== user?.email) {
        console.log('Updating email in auth from', user?.email, 'to', formData.email);
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) {
          console.warn('Email update failed:', emailError);
          setMessage({ type: 'error', text: 'Profile updated but email change failed. Please verify your new email.' });
        }
      }

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
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="h-32 w-32 rounded-full object-cover"
                        onLoad={() => {}} // Remove any loading handlers
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
