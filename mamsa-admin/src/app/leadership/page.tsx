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
      image_url: '',
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
      image_url: '',
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
      image_url: '',
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
      image_url: '',
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
      image_url: '',
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
      image_url: '',
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
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {filteredLeadership.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(member.id)}
                          onChange={() => handleSelectItem(member.id)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                              {member.image_url ? (
                                <Image 
                                  src={member.image_url} 
                                  alt={member.name} 
                                  width={64}
                                  height={64}
                                  className="h-16 w-16 rounded-full object-cover" 
                                />
                              ) : (
                                <span className="text-lg font-medium text-gray-600">{member.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 text-center sm:text-left min-w-0">
                              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
                                <h3 className="text-lg font-medium text-gray-900 truncate">{member.name}</h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  member.status === 'active' ? 'bg-green-100 text-green-800' :
                                  member.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.status === 'active' && '🟢 Active'}
                                  {member.status === 'inactive' && '⏸️ Inactive'}
                                  {member.status === 'alumni' && '🎓 Alumni'}
                                </span>
                              </div>
                              <p className="text-sm text-purple-600 font-medium">{member.position}</p>
                              {member.department && (
                                <p className="text-xs text-gray-500">{member.department}</p>
                              )}
                              {member.year && (
                                <p className="text-xs text-gray-500">{member.year}</p>
                              )}
                            </div>
                          </div>
                          
                          <p className="mt-4 text-sm text-gray-600 line-clamp-3">{member.bio}</p>
                          
                          {/* Contact and Social Links */}
                          <div className="mt-4 space-y-2">
                            {member.email && (
                              <div className="flex items-center text-xs text-gray-500">
                                <svg className="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate">{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center text-xs text-gray-500">
                                <svg className="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{member.phone}</span>
                              </div>
                            )}
                            
                            {/* Social Links */}
                            {member.social_links && (
                              <div className="flex items-center space-x-2 mt-2">
                                {member.social_links.linkedin && (
                                  <a 
                                    href={member.social_links.linkedin} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                  </a>
                                )}
                                {member.social_links.twitter && (
                                  <a 
                                    href={member.social_links.twitter} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-600"
                                  >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                    </svg>
                                  </a>
                                )}
                                {member.social_links.instagram && (
                                  <a 
                                    href={member.social_links.instagram} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-pink-500 hover:text-pink-700"
                                  >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281H8.449c-.49 0-.807.317-.807.807v7.83c0 .49.317.807.807.807h7.83c.49 0 .807-.317.807-.807v-7.83c0-.49-.317-.807-.807-.807z"/>
                                    </svg>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex justify-center sm:justify-start space-x-2">
                            <button 
                              onClick={() => handleEditMember(member)}
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium px-3 py-1 rounded hover:bg-purple-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteMember(member)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
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
