'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import LeadershipModal from '@/components/LeadershipModal';
import ConfirmModal from '@/components/ConfirmModal';
import Image from 'next/image';

interface LeadershipMember {
  id: number;
  name: string;
  position: string;
  bio: string;
  image_url: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  status: 'active' | 'inactive' | 'alumni';
  order: number;
  created_at: string;
}

export default function LeadershipPage() {
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadershipMember | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LeadershipMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'alumni'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const supabase = createClient();

  // Static data for demonstration
  const staticLeadership: LeadershipMember[] = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      position: 'President',
      bio: 'Dr. Sarah Johnson is a fourth-year medical student with a passion for community health and medical education. She has been actively involved in MAMSA for three years and has led several successful initiatives to improve student wellness and academic support.',
      image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
      email: 'sarah.johnson@mamsa.org',
      phone: '+1-555-0101',
      department: 'Medicine',
      year: 'Class of 2025',
      social_links: {
        linkedin: 'https://linkedin.com/in/sarahjohnson',
        twitter: 'https://twitter.com/sarahjohnson'
      },
      status: 'active',
      order: 1,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'Michael Chen',
      position: 'Vice President',
      bio: 'Michael Chen is a dedicated medical student specializing in public health. He has organized multiple health awareness campaigns and serves as a mentor to junior students. His leadership has been instrumental in expanding MAMSA\'s community outreach programs.',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      email: 'michael.chen@mamsa.org',
      phone: '+1-555-0102',
      department: 'Public Health',
      year: 'Class of 2025',
      social_links: {
        linkedin: 'https://linkedin.com/in/michaelchen',
        instagram: 'https://instagram.com/michaelchen'
      },
      status: 'active',
      order: 2,
      created_at: '2024-01-10T14:30:00Z'
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      position: 'Secretary',
      bio: 'Emily Rodriguez brings exceptional organizational skills and attention to detail to her role as Secretary. She has streamlined MAMSA\'s administrative processes and maintains excellent communication with all members and stakeholders.',
      image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      email: 'emily.rodriguez@mamsa.org',
      phone: '+1-555-0103',
      department: 'Medicine',
      year: 'Class of 2026',
      social_links: {
        linkedin: 'https://linkedin.com/in/emilyrodriguez'
      },
      status: 'active',
      order: 3,
      created_at: '2024-01-08T16:45:00Z'
    },
    {
      id: 4,
      name: 'James Wilson',
      position: 'Treasurer',
      bio: 'James Wilson manages MAMSA\'s finances with precision and transparency. His background in business administration has helped optimize the organization\'s budget and funding strategies, ensuring sustainable growth.',
      image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      email: 'james.wilson@mamsa.org',
      phone: '+1-555-0104',
      department: 'Medicine',
      year: 'Class of 2025',
      social_links: {
        linkedin: 'https://linkedin.com/in/jameswilson',
        twitter: 'https://twitter.com/jameswilson'
      },
      status: 'active',
      order: 4,
      created_at: '2024-01-05T09:15:00Z'
    },
    {
      id: 5,
      name: 'Dr. Lisa Park',
      position: 'Events Coordinator',
      bio: 'Lisa Park is the creative force behind MAMSA\'s most successful events. Her innovative approach to event planning and her ability to bring people together has made MAMSA events highly anticipated by the medical student community.',
      image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      email: 'lisa.park@mamsa.org',
      phone: '+1-555-0105',
      department: 'Medicine',
      year: 'Class of 2026',
      social_links: {
        linkedin: 'https://linkedin.com/in/lisapark',
        instagram: 'https://instagram.com/lisapark'
      },
      status: 'active',
      order: 5,
      created_at: '2024-01-12T11:20:00Z'
    },
    {
      id: 6,
      name: 'Dr. Robert Thompson',
      position: 'Alumni Relations',
      bio: 'Dr. Robert Thompson graduated from our medical program last year and now serves as our Alumni Relations coordinator. He maintains strong connections with MAMSA alumni and helps current students network with established medical professionals.',
      image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
      email: 'robert.thompson@mamsa.org',
      phone: '+1-555-0106',
      department: 'Medicine',
      year: 'Class of 2024',
      social_links: {
        linkedin: 'https://linkedin.com/in/robertthompson'
      },
      status: 'alumni',
      order: 6,
      created_at: '2023-12-20T13:45:00Z'
    }
  ];

  useEffect(() => {
    checkAuth();
    loadLeadership();
  }, []);

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

  const loadLeadership = async () => {
    try {
      setLoading(true);
      // Use static data for demonstration
      setLeadership(staticLeadership);
    } catch (error) {
      console.error('Failed to load leadership:', error);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleCreateMember = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditMember = (member: LeadershipMember) => {
    setEditingItem(member);
    setShowModal(true);
  };

  const handleDeleteMember = (member: LeadershipMember) => {
    setItemToDelete(member);
    setShowConfirm(true);
  };

  const handleSaveMember = (memberData: Omit<LeadershipMember, 'id' | 'created_at'>) => {
    if (editingItem) {
      // Update existing member
      setLeadership(prev => prev.map(member => 
        member.id === editingItem.id 
          ? { ...memberData, id: editingItem.id, created_at: editingItem.created_at }
          : member
      ));
    } else {
      // Create new member
      const newMember: LeadershipMember = {
        ...memberData,
        id: Math.max(...leadership.map(m => m.id), 0) + 1,
        created_at: new Date().toISOString()
      };
      setLeadership(prev => [...prev, newMember]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setLeadership(prev => prev.filter(member => member.id !== itemToDelete.id));
      setShowConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setLeadership(prev => prev.filter(member => !selectedItems.includes(member.id)));
    setSelectedItems([]);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredLeadership.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredLeadership.map(member => member.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Filter leadership based on search and status
  const filteredLeadership = leadership.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.year?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.order - b.order);

  return (
    <AdminLayout user={user}>
      <div className="w-full">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Leadership Team Management</h2>
                <p className="text-sm text-gray-500 mt-1">Manage MAMSA leadership members and their information</p>
              </div>
              <button 
                onClick={handleCreateMember}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Member
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
                    placeholder="Search members by name, position, department, or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'alumni')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Members</option>
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="alumni">🎓 Alumni</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedItems.length} member{selectedItems.length !== 1 ? 's' : ''} selected
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

            {/* Leadership Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading leadership team...</p>
              </div>
            ) : filteredLeadership.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {leadership.length === 0 ? 'No leadership members' : 'No members match your search'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {leadership.length === 0 ? 'Get started by adding a new leadership member.' : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select All */}
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredLeadership.length && filteredLeadership.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Select All</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLeadership.map((member) => (
                    <div key={member.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1">
                      {/* Checkbox overlay */}
                      <div className="relative p-1">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(member.id)}
                          onChange={() => handleSelectItem(member.id)}
                          className="absolute top-3 left-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        />
                      </div>

                      {/* Header with Avatar */}
                      <div className="relative px-6 pt-4 pb-2">
                        <div className="flex flex-col items-center text-center space-y-3">
                          {/* Avatar */}
                          <div className="h-20 w-20 bg-gray-100 flex items-center justify-center overflow-hidden">
                            {member.image_url ? (
                              <Image 
                                src={member.image_url} 
                                alt={member.name} 
                                width={80}
                                height={80}
                                className="h-20 w-20 object-cover" 
                              />
                            ) : (
                              <span className="text-2xl font-bold text-gray-600">{member.name.charAt(0)}</span>
                            )}
                          </div>

                          {/* Name and Position */}
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{member.name}</h3>
                            <p className="text-sm font-semibold text-purple-600">{member.position}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-6 pb-6">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditMember(member)}
                            className="flex-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-sm font-medium px-3 py-2 rounded-lg border border-purple-200 hover:border-purple-300 transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteMember(member)}
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
            {filteredLeadership.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-green-600">
                      {filteredLeadership.filter(m => m.status === 'active').length}
                    </div>
                    <div className="text-xs text-green-600">Active Members</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-yellow-600">
                      {filteredLeadership.filter(m => m.status === 'inactive').length}
                    </div>
                    <div className="text-xs text-yellow-600">Inactive</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-gray-600">
                      {filteredLeadership.filter(m => m.status === 'alumni').length}
                    </div>
                    <div className="text-xs text-gray-600">Alumni</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <LeadershipModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveMember}
          editingItem={editingItem}
        />
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Leadership Member"
          message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </AdminLayout>
  );
}
