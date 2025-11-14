'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AdminUser {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  department?: string;
  position?: string;
  permissions: {
    news: boolean;
    events: boolean;
    leadership: boolean;
    gallery: boolean;
    users: boolean;
    reports: boolean;
  };
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
  created_by?: string;
}

type SavePayload = {
  user: Omit<AdminUser, 'id' | 'created_at' | 'user_id'>;
  password?: string;
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: SavePayload) => Promise<{ success: boolean; error?: unknown } | void>;
  editingItem?: AdminUser | null;
}

export default function UserModal({ isOpen, onClose, onSave, editingItem }: UserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    phone: '',
    bio: '',
    role: 'admin' as 'super_admin' | 'admin' | 'moderator',
    department: '',
    position: '',
    permissions: {
      news: true,
      events: true,
      leadership: true,
      gallery: true,
      users: false,
      reports: false
    },
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        full_name: editingItem.full_name,
        email: editingItem.email,
        avatar_url: editingItem.avatar_url || '',
        phone: editingItem.phone || '',
        bio: editingItem.bio || '',
        role: editingItem.role,
        department: editingItem.department || '',
        position: editingItem.position || '',
        permissions: editingItem.permissions,
        status: editingItem.status
      });
      setPassword('');
      setConfirmPassword('');
    } else {
      setFormData({
        full_name: '',
        email: '',
        avatar_url: '',
        phone: '',
        bio: '',
        role: 'admin',
        department: '',
        position: '',
        permissions: {
          news: true,
          events: true,
          leadership: true,
          gallery: true,
          users: false,
          reports: false
        },
        status: 'active'
      });
      setPassword('');
      setConfirmPassword('');
    }
  }, [editingItem, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'role') {
      const nextRole = value as 'super_admin' | 'admin' | 'moderator';
      setFormData((prev) => ({
        ...prev,
        role: nextRole,
        permissions:
          nextRole === 'super_admin'
            ? {
                news: true,
                events: true,
                leadership: true,
                gallery: true,
                users: true,
                reports: true,
              }
            : prev.permissions,
      }));
      return;
    }
    
    if (name.startsWith('permissions.')) {
      const permissionKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionKey]: (e.target as HTMLInputElement).checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          avatar_url: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem && (!password || password !== confirmPassword)) {
      alert('Please enter matching passwords for new users');
      return;
    }

    setLoading(true);

    try {
      const result = await onSave({
        user: formData,
        password: editingItem ? undefined : password,
      });

      if (result?.success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(error instanceof Error ? error.message : 'Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      full_name: '',
      email: '',
      avatar_url: '',
      phone: '',
      bio: '',
      role: 'admin',
      department: '',
      position: '',
      permissions: {
        news: true,
        events: true,
        leadership: true,
        gallery: true,
        users: false,
        reports: false
      },
      status: 'active'
    });
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'moderator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 pt-8">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Admin User' : 'Add New Admin User'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingItem ? 'Update user information and permissions' : 'Create a new admin user account'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Enter full name..."
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      id="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="IT, Admin, Academic..."
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                    Position/Title
                  </label>
                  <input
                    type="text"
                    name="position"
                    id="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="System Administrator, Content Manager..."
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-800 mb-3">
                  Bio/Description
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Brief description of the user's role and responsibilities..."
                />
              </div>

              {/* Profile Image */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="avatar_url" className="block text-sm font-semibold text-gray-800 mb-3">
                  Profile Image
                </label>
                
                {formData.avatar_url ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <Image 
                        src={formData.avatar_url} 
                        alt="Profile preview" 
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover rounded-full border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="file"
                      name="avatar_url"
                      id="avatar_url"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-600 border border-dashed border-gray-300 rounded-md p-2 hover:border-indigo-400 transition-colors cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center hover:border-indigo-400 transition-colors">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div className="mt-2">
                      <label htmlFor="avatar_url" className="cursor-pointer">
                        <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                          Upload profile photo
                        </span>
                      </label>
                      <input
                        type="file"
                        name="avatar_url"
                        id="avatar_url"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>

              {/* Password Section for New Users */}
              {!editingItem && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Account Setup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="Enter password..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {showPassword ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Confirm password..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Role and Status */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="text-sm font-semibold text-indigo-900 mb-3">Role & Status</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-indigo-800 mb-2">
                      User Role
                    </label>
                    <select
                      name="role"
                      id="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="block w-full border border-indigo-200 rounded-md px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="moderator">🟢 Moderator</option>
                      <option value="admin">🔵 Admin</option>
                      <option value="super_admin">🔴 Super Admin</option>
                    </select>
                    <p className="mt-1 text-xs text-indigo-700">
                      {formData.role === 'moderator' && 'Limited access to content management'}
                      {formData.role === 'admin' && 'Full access to all features except user management'}
                      {formData.role === 'super_admin' && 'Complete system access including user management'}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-indigo-800 mb-2">
                      Account Status
                    </label>
                    <select
                      name="status"
                      id="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="block w-full border border-indigo-200 rounded-md px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="active">🟢 Active</option>
                      <option value="inactive">⏸️ Inactive</option>
                      <option value="suspended">🔴 Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Permissions</h4>
                <div className="space-y-3">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key === 'users' ? 'User Management' : key}
                      </label>
                      <input
                        type="checkbox"
                        name={`permissions.${key}`}
                        checked={value}
                        onChange={handleInputChange}
                        disabled={formData.role === 'super_admin' && key === 'users'}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Super Admins automatically have all permissions
                </p>
              </div>

              {/* User Preview */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Preview</h4>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    {formData.avatar_url ? (
                      <Image 
                        src={formData.avatar_url} 
                        alt="Preview" 
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {formData.full_name.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h5 className="font-medium text-sm text-gray-900">
                        {formData.full_name || 'User Name'}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {formData.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Role:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(formData.role)}`}>
                        {formData.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                        {formData.status}
                      </span>
                    </div>
                    {formData.department && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Department:</span>
                        <span className="text-xs text-gray-900">{formData.department}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 rounded-b-xl">
            <div className="text-sm text-gray-500">
              {formData.full_name && formData.email ? (
                <span className="text-indigo-600 font-medium">✓ Ready to save</span>
              ) : (
                <span>Complete required fields</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.full_name || !formData.email || (!editingItem && (!password || password !== confirmPassword))}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingItem ? 'Update User' : 'Create User'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
