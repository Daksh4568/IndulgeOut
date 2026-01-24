import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { 
  BarChart3, Users, CheckCircle, XCircle, Clock, Search,
  Download, ArrowLeft, QrCode, Calendar, MapPin, TrendingUp,
  UserCheck, UserX, Filter, RefreshCw, Mail, Phone, Award
} from 'lucide-react';

const EventAnalytics = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, checked_in, active
  const [sortBy, setSortBy] = useState('name'); // name, checkInTime, purchaseDate

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [eventResponse, analyticsResponse] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/analytics`)
      ]);

      setEventData(eventResponse.data);
      setAnalytics(analyticsResponse.data);
      
      console.log('📊 Analytics data:', analyticsResponse.data);
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      if (error.response?.status === 403) {
        alert('You are not authorized to view analytics for this event');
        navigate('/organizer/dashboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter and sort attendees
  const getFilteredAttendees = () => {
    if (!analytics?.attendees) return [];

    let filtered = analytics.attendees;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.ticketNumber.toLowerCase().includes(query) ||
        (a.phoneNumber && a.phoneNumber.includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'checkInTime':
          if (!a.checkInTime && !b.checkInTime) return 0;
          if (!a.checkInTime) return 1;
          if (!b.checkInTime) return -1;
          return new Date(b.checkInTime) - new Date(a.checkInTime);
        case 'purchaseDate':
          return new Date(b.purchaseDate) - new Date(a.purchaseDate);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!analytics?.attendees) return;

    const headers = ['Name', 'Email', 'Phone', 'Ticket Number', 'Quantity', 'Ticket Type', 'Status', 'Purchase Date', 'Check-in Time', 'Checked In By'];
    const rows = analytics.attendees.map(a => [
      a.name,
      a.email,
      a.phoneNumber || '',
      a.ticketNumber,
      a.quantity || 1,
      a.ticketType,
      a.status,
      formatDate(a.purchaseDate),
      a.checkInTime ? formatDateTime(a.checkInTime) : '',
      a.checkInBy || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventData?.title || 'event'}_attendees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredAttendees = getFilteredAttendees();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="h-8 w-8 mr-3 text-indigo-600" />
                Event Analytics
              </h1>
              {analytics && (
                <div className="mt-3 space-y-1">
                  <h2 className="text-xl text-gray-700 dark:text-gray-300 font-semibold">
                    {analytics.eventTitle}
                  </h2>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 space-x-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {analytics.eventDate && formatDate(analytics.eventDate)} {analytics.eventTime && `at ${analytics.eventTime}`}
                    </div>
                    {analytics.eventLocation?.city && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {analytics.eventLocation.city}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/scan-tickets?eventId=${eventId}`)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Scan Tickets
              </button>
              
              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Tickets
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.statistics.totalTickets || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Slots Booked
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {analytics?.statistics.totalSlots || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Checked In
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {analytics?.statistics.checkedIn || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {analytics?.statistics.attendanceRate || 0}% attendance
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Not Checked In
              </div>
              <UserX className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {analytics?.statistics.notCheckedIn || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Cancelled
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {analytics?.statistics.cancelled || 0}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or ticket number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="checked_in">Checked In</option>
                <option value="active">Not Checked In</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="checkInTime">Sort by Check-in Time</option>
                <option value="purchaseDate">Sort by Purchase Date</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{filteredAttendees.length}</span> of{' '}
            <span className="font-semibold">{analytics?.attendees.length || 0}</span> attendees
          </div>
        </div>

        {/* Attendees List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {filteredAttendees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No attendees match your search' : 'No attendees registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ticket Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Check-in Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAttendees.map((attendee) => (
                    <tr key={attendee.ticketId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {attendee.profilePicture ? (
                              <img
                                src={attendee.profilePicture}
                                alt={attendee.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                                {attendee.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {attendee.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {attendee.email}
                            </div>
                            {attendee.phoneNumber && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {attendee.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900 dark:text-white">
                          {attendee.ticketNumber}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {attendee.ticketType}
                          {attendee.quantity > 1 && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                              × {attendee.quantity} Spots
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(attendee.status)}`}>
                          {attendee.status === 'checked_in' ? '✅ Checked In' : 
                           attendee.status === 'active' ? '⏳ Not Checked In' : 
                           '❌ Cancelled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(attendee.purchaseDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {attendee.checkInTime ? (
                          <div>
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDateTime(attendee.checkInTime)}
                            </div>
                            {attendee.checkInBy && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                by {attendee.checkInBy}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics;
