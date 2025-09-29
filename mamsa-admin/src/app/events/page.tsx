'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import EventModal from '@/components/EventModal';
import ConfirmModal from '@/components/ConfirmModal';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured_image?: string;
  capacity?: number;
  registration_required: boolean;
  registration_deadline?: string;
  organizer: string;
  contact_email?: string;
  contact_phone?: string;
  tags?: string[];
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const supabase = createClient();

  // Static data for demonstration
  const staticEvents: Event[] = [
    {
      id: 1,
      title: 'MAMSA Annual Conference 2024',
      description: 'Join us for the biggest medical student conference of the year featuring keynote speakers, workshops, and networking opportunities.',
      date: '2024-03-15',
      time: '09:00',
      location: 'University Medical Center, Lecture Hall A',
      status: 'upcoming',
      featured_image: '',
      capacity: 500,
      registration_required: true,
      registration_deadline: '2024-03-10T23:59:59',
      organizer: 'MAMSA Executive Committee',
      contact_email: 'conference@mamsa.org',
      contact_phone: '+1-555-0123',
      tags: ['conference', 'networking', 'professional development'],
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      title: 'Medical Research Symposium',
      description: 'Present your research and learn from peers in this comprehensive symposium covering various medical specialties.',
      date: '2024-02-28',
      time: '14:00',
      location: 'Research Center, Room 101',
      status: 'upcoming',
      featured_image: '',
      capacity: 100,
      registration_required: true,
      registration_deadline: '2024-02-25T23:59:59',
      organizer: 'Dr. Sarah Johnson',
      contact_email: 'research@mamsa.org',
      contact_phone: '+1-555-0456',
      tags: ['research', 'presentation', 'academic'],
      created_at: '2024-01-10T14:30:00Z'
    },
    {
      id: 3,
      title: 'Community Health Outreach',
      description: 'Volunteer event to provide free health screenings and education to underserved communities.',
      date: '2024-01-20',
      time: '08:00',
      location: 'Downtown Community Center',
      status: 'completed',
      featured_image: '',
      capacity: 50,
      registration_required: false,
      organizer: 'MAMSA Outreach Committee',
      contact_email: 'outreach@mamsa.org',
      contact_phone: '+1-555-0789',
      tags: ['volunteer', 'community service', 'health screening'],
      created_at: '2024-01-05T09:15:00Z'
    },
    {
      id: 4,
      title: 'Study Group: Cardiology Review',
      description: 'Join fellow students for an intensive review session covering key cardiology topics and case studies.',
      date: '2024-02-10',
      time: '18:00',
      location: 'Library Study Room 3',
      status: 'ongoing',
      featured_image: '',
      capacity: 25,
      registration_required: false,
      organizer: 'Cardiology Study Group',
      contact_email: 'study@mamsa.org',
      tags: ['study group', 'cardiology', 'exam prep'],
      created_at: '2024-01-08T16:45:00Z'
    },
    {
      id: 5,
      title: 'MAMSA Sports Day',
      description: 'Annual sports competition featuring basketball, soccer, and volleyball tournaments for medical students.',
      date: '2024-04-20',
      time: '10:00',
      location: 'University Sports Complex',
      status: 'upcoming',
      featured_image: '',
      capacity: 200,
      registration_required: true,
      registration_deadline: '2024-04-15T23:59:59',
      organizer: 'MAMSA Sports Committee',
      contact_email: 'sports@mamsa.org',
      contact_phone: '+1-555-0321',
      tags: ['sports', 'competition', 'team building'],
      created_at: '2024-01-12T11:20:00Z'
    }
  ];

  useEffect(() => {
    checkAuth();
    loadEvents();
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

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Use static data for demonstration
      setEvents(staticEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleCreateEvent = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingItem(event);
    setShowModal(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setItemToDelete(event);
    setShowConfirm(true);
  };

  const handleSaveEvent = (eventData: Omit<Event, 'id' | 'created_at'>) => {
    if (editingItem) {
      // Update existing event
      setEvents(prev => prev.map(event => 
        event.id === editingItem.id 
          ? { ...eventData, id: editingItem.id, created_at: editingItem.created_at }
          : event
      ));
    } else {
      // Create new event
      const newEvent: Event = {
        ...eventData,
        id: Math.max(...events.map(e => e.id), 0) + 1,
        created_at: new Date().toISOString()
      };
      setEvents(prev => [...prev, newEvent]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setEvents(prev => prev.filter(event => event.id !== itemToDelete.id));
      setShowConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setEvents(prev => prev.filter(event => !selectedItems.includes(event.id)));
    setSelectedItems([]);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredEvents.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredEvents.map(event => event.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Filter events based on search and status
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  return (
    <AdminLayout user={user}>
      <div className="w-full">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Events Management</h2>
                <p className="text-sm text-gray-500 mt-1">Manage MAMSA events, conferences, and activities</p>
              </div>
              <button 
                onClick={handleCreateEvent}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Event
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
                    placeholder="Search events by title, description, location, or organizer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">📅 Upcoming</option>
                  <option value="ongoing">🟢 Ongoing</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedItems.length} event{selectedItems.length !== 1 ? 's' : ''} selected
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

            {/* Events List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {events.length === 0 ? 'No events' : 'No events match your search'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {events.length === 0 ? 'Get started by creating a new event.' : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredEvents.length && filteredEvents.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Select All</label>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Event Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(event.id)}
                              onChange={() => handleSelectItem(event.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                              {event.title}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            event.status === 'ongoing' ? 'bg-green-100 text-green-800 border border-green-200' :
                            event.status === 'completed' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {event.status === 'upcoming' && '📅 Upcoming'}
                            {event.status === 'ongoing' && '🟢 Ongoing'}
                            {event.status === 'completed' && '✅ Completed'}
                            {event.status === 'cancelled' && '❌ Cancelled'}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditEvent(event)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(event)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">{event.description}</p>
                    </div>

                    {/* Event Details Grid */}
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{event.time}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <svg className="h-4 w-4 mr-3 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Location</span>
                            <p className="text-sm font-medium text-gray-900">{event.location}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <svg className="h-4 w-4 mr-3 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Organizer</span>
                            <p className="text-sm font-medium text-gray-900">{event.organizer}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Event Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {event.capacity && event.capacity > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {event.capacity} spots
                            </span>
                          )}
                          {event.registration_required && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Registration Required
                            </span>
                          )}
                        </div>
                        
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700">
                                #{tag}
                              </span>
                            ))}
                            {event.tags.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700">
                                +{event.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {filteredEvents.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-700">
                          {filteredEvents.filter(e => e.status === 'upcoming').length}
                        </div>
                        <div className="text-sm font-medium text-blue-600">Upcoming</div>
                      </div>
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-700">
                          {filteredEvents.filter(e => e.status === 'ongoing').length}
                        </div>
                        <div className="text-sm font-medium text-green-600">Ongoing</div>
                      </div>
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-700">
                          {filteredEvents.filter(e => e.status === 'completed').length}
                        </div>
                        <div className="text-sm font-medium text-gray-600">Completed</div>
                      </div>
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-red-700">
                          {filteredEvents.filter(e => e.status === 'cancelled').length}
                        </div>
                        <div className="text-sm font-medium text-red-600">Cancelled</div>
                      </div>
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <EventModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
          editingItem={editingItem}
        />
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Event"
          message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </AdminLayout>
  );
}
