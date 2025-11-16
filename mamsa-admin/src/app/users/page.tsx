'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import UserModal from '@/components/UserModal';
import ConfirmModal from '@/components/ConfirmModal';
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

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: AdminUser;
  old?: { id: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminUser | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'moderator'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const supabase = createClient();

  // Static data for demonstration
  const staticUsers: AdminUser[] = [
    {
      id: 1,
      user_id: 'user-1',
      full_name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@mamsa.org',
      avatar_url: '',
      phone: '+1-555-0101',
      bio: 'System administrator with 5+ years of experience in educational technology and student management systems.',
      role: 'super_admin',
      department: 'IT',
      position: 'System Administrator',
      permissions: {
        news: true,
        events: true,
        leadership: true,
        gallery: true,
        users: true,
        reports: true
      },
      status: 'active',
      last_login: '2024-01-20T09:30:00Z',
      created_at: '2023-08-15T10:00:00Z',
      created_by: 'system'
    },
    {
      id: 2,
      user_id: 'user-2',
      full_name: 'Michael Chen',
      email: 'michael.chen@mamsa.org',
      avatar_url: '',
      phone: '+1-555-0102',
      bio: 'Content manager responsible for news articles, events, and social media coordination.',
      role: 'admin',
      department: 'Communications',
      position: 'Content Manager',
      permissions: {
        news: true,
        events: true,
        leadership: true,
        gallery: true,
        users: false,
        reports: true
      },
      status: 'active',
      last_login: '2024-01-19T14:20:00Z',
      created_at: '2023-09-10T14:30:00Z',
      created_by: 'Dr. Sarah Johnson'
    },
    {
      id: 3,
      user_id: 'user-3',
      full_name: 'Emily Rodriguez',
      email: 'emily.rodriguez@mamsa.org',
      avatar_url: '',
      phone: '+1-555-0103',
      bio: 'Event coordinator with expertise in organizing academic conferences and student activities.',
      role: 'admin',
      department: 'Events',
      position: 'Event Coordinator',
      permissions: {
        news: false,
        events: true,
        leadership: false,
        gallery: true,
        users: false,
        reports: false
      },
      status: 'active',
      last_login: '2024-01-18T16:45:00Z',
      created_at: '2023-10-05T09:15:00Z',
      created_by: 'Dr. Sarah Johnson'
    },
    {
      id: 4,
      user_id: 'user-4',
      full_name: 'James Wilson',
      email: 'james.wilson@mamsa.org',
      avatar_url: '',
      phone: '+1-555-0104',
      bio: 'Database administrator and technical support specialist for MAMSA systems.',
      role: 'admin',
      department: 'IT',
      position: 'Database Administrator',
      permissions: {
        news: true,
        events: true,
        leadership: true,
        gallery: true,
        users: false,
        reports: true
      },
      status: 'active',
      last_login: '2024-01-17T11:20:00Z',
      created_at: '2023-11-20T13:45:00Z',
      created_by: 'Dr. Sarah Johnson'
    },
    {
      id: 5,
      user_id: 'user-5',
      full_name: 'Lisa Park',
      email: 'lisa.park@mamsa.org',
      avatar_url: '',
      phone: '+1-555-0105',
      bio: 'Social media moderator and content reviewer for MAMSA platforms.',
      role: 'moderator',
      department: 'Communications',
      position: 'Social Media Moderator',
      permissions: {
        news: true,
        events: false,
        leadership: false,
        gallery: true,
        users: false,
        reports: false
      },
      status: 'active',
      last_login: '2024-01-16T08:30:00Z',
      created_at: '2023-12-01T11:20:00Z',
      created_by: 'Michael Chen'
    },
    {
      id: 6,
      user_id: 'user-6',
      full_name: 'Robert Thompson',
      email: 'robert.thompson@mamsa.org',
      avatar_url: '',
      phone: '+1-555-0106',
      bio: 'Former admin user who has been suspended due to policy violations.',
      role: 'admin',
      department: 'Academic',
      position: 'Academic Coordinator',
      permissions: {
        news: false,
        events: false,
        leadership: false,
        gallery: false,
        users: false,
        reports: false
      },
      status: 'suspended',
      last_login: '2024-01-05T10:15:00Z',
      created_at: '2023-07-10T16:30:00Z',
      created_by: 'Dr. Sarah Johnson'
    }
  ];

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, []);

  // Real-time subscription for user changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin_users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_users'
        },
        (payload: RealtimePayload) => {
          console.log('Admin users change received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setUsers(prev => {
              // Check if item already exists to prevent duplicates
              const exists = prev.some(item => item.id === payload.new!.id);
              if (!exists) {
                return [payload.new as AdminUser, ...prev];
              }
              return prev;
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setUsers(prev => prev.map(item => 
              item.id === payload.new!.id ? payload.new as AdminUser : item
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setUsers(prev => prev.filter(item => item.id !== payload.old!.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/login';
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
        window.location.href = '/login';
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/login';
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users from database...');
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        throw error;
      }

      console.log('Successfully loaded users:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback to static data if database fails
      setUsers(staticUsers);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleCreateUser = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingItem(user);
    setShowModal(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setItemToDelete(user);
    setShowConfirm(true);
  };

  const handleSaveUser = async ({ user: userData, password }: { user: Omit<AdminUser, 'id' | 'created_at' | 'user_id'>; password?: string }) => {
    try {
      console.log('Saving user:', userData);
      
      if (editingItem) {
        // Update existing user
        console.log('Updating existing user with ID:', editingItem.id);
        
        const updateData = {
          full_name: userData.full_name,
          email: userData.email,
          avatar_url: userData.avatar_url,
          phone: userData.phone,
          bio: userData.bio,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          permissions: userData.permissions,
          status: userData.status,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('admin_users')
          .update(updateData)
          .eq('id', editingItem.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating user:', error);
          alert(`Failed to update user: ${error.message}`);
          return;
        }

        if (!data) {
          console.error('No data returned from update operation');
          alert('Failed to update user: No data returned');
          return;
        }

        console.log('Successfully updated user:', data);
        
        setUsers(prev => prev.map(u => u.id === editingItem.id ? data : u));
      } else {
        // For super_admin, use default password if not provided
        const finalPassword = password || (userData.role === 'super_admin' ? 'adminmamsa' : null);
        
        if (!finalPassword) {
          alert('A password is required when creating a new user.');
          return { success: false };
        }

        console.log('Creating new user via API...');

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: userData,
            password: finalPassword,
            createdBy: user?.id ?? null,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          console.error('API error creating user:', payload);
          const errorMessage = payload?.message 
            ? `${payload.error}\n\n${payload.message}` 
            : payload?.error ?? 'Unknown error';
          alert(`Failed to create user: ${errorMessage}`);
          return { success: false, error: payload?.error };
        }

        if (!payload?.data) {
          alert('Failed to create user: invalid response');
          return { success: false };
        }

        setUsers((prev) => [payload.data, ...prev]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save user:', error);
      if (error instanceof Error) {
        alert(`Failed to save user: ${error.message}`);
      } else {
        alert('Failed to save user. Please try again.');
      }
      return { success: false, error };
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        console.log('Deleting user with ID:', itemToDelete.id);
        
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) {
          console.error('Error deleting user:', error);
          throw error;
        }

        console.log('Successfully deleted user');
        
        // Update local state
        setUsers(prev => prev.filter(u => u.id !== itemToDelete.id));
        setShowConfirm(false);
        setItemToDelete(null);
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      console.log('Bulk deleting users:', selectedItems);
      
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .in('id', selectedItems);

      if (error) {
        console.error('Error bulk deleting users:', error);
        throw error;
      }

      console.log('Successfully bulk deleted users');
      
      // Update local state
      setUsers(prev => prev.filter(u => !selectedItems.includes(u.id)));
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to delete selected users:', error);
      alert('Failed to delete selected users. Please try again.');
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredUsers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredUsers.map(u => u.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Filter users based on search, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    // Sort by role priority, then by name
    const roleOrder = { 'super_admin': 0, 'admin': 1, 'moderator': 2 };
    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role];
    }
    return a.full_name.localeCompare(b.full_name);
  });

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

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout user={user}>
      <div className="w-full">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                <p className="text-sm text-gray-500 mt-1">Manage admin users, roles, and permissions</p>
              </div>
              <button 
                onClick={handleCreateUser}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New User
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users by name, email, department, or position..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'super_admin' | 'admin' | 'moderator')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">🔴 Super Admin</option>
                  <option value="admin">🔵 Admin</option>
                  <option value="moderator">🟢 Moderator</option>
                </select>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'suspended')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="suspended">🔴 Suspended</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedItems.length} user{selectedItems.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkDelete}
                      className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {users.length === 0 ? 'No admin users' : 'No users match your search'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {users.length === 0 ? 'Get started by adding your first admin user.' : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select All */}
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Select All</label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1">
                      {/* Header with Avatar and User Info */}
                      <div className="relative p-4 lg:p-5">
                        <div className="flex items-center space-x-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(user.id)}
                            onChange={() => handleSelectItem(user.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                          />
                          
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {user.avatar_url ? (
                              <Image 
                                src={user.avatar_url} 
                                alt={user.full_name} 
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-100" 
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border-2 border-gray-100">
                                <span className="text-lg font-semibold text-indigo-700">{user.full_name.charAt(0)}</span>
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">{user.full_name}</h3>
                              <p className="text-sm text-gray-500 truncate">{user.email}</p>
                              {user.department && (
                                <p className="text-xs text-gray-400 truncate">{user.department} • {user.position}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Role and Status Badges */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role === 'super_admin' && '🔴'}
                            {user.role === 'admin' && '🔵'}
                            {user.role === 'moderator' && '🟢'}
                            {user.role.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status === 'active' && '🟢'}
                            {user.status === 'inactive' && '⏸️'}
                            {user.status === 'suspended' && '🔴'}
                            {user.status}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-4 lg:px-5 pb-4 lg:pb-5">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="flex-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-3 py-2 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-red-600">
                      {filteredUsers.filter(u => u.role === 'super_admin').length}
                    </div>
                    <div className="text-xs text-red-600">Super Admins</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-blue-600">
                      {filteredUsers.filter(u => u.role === 'admin').length}
                    </div>
                    <div className="text-xs text-blue-600">Admins</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-green-600">
                      {filteredUsers.filter(u => u.role === 'moderator').length}
                    </div>
                    <div className="text-xs text-green-600">Moderators</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-gray-600">
                      {filteredUsers.filter(u => u.status === 'active').length}
                    </div>
                    <div className="text-xs text-gray-600">Active Users</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <UserModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
          editingItem={editingItem}
        />
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Admin User"
          message={`Are you sure you want to delete "${itemToDelete?.full_name}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </AdminLayout>
  );
}
