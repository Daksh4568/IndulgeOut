import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, proposals, counters, flagged, analytics, all-collaborations
  const [stats, setStats] = useState(null);
  const [collabAnalytics, setCollabAnalytics] = useState(null);
  
  // Proposals state
  const [pendingProposals, setPendingProposals] = useState([]);
  const [flaggedProposals, setFlaggedProposals] = useState([]);
  const [allCollaborations, setAllCollaborations] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalFilters, setProposalFilters] = useState({ type: '', status: '' });
  
  // Counters state
  const [pendingCounters, setPendingCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(null);
  
  // Modals state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  
  // Form state
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (user && user.role === 'admin') {
      switch (activeTab) {
        case 'proposals':
          fetchPendingProposals();
          break;
        case 'counters':
          fetchPendingCounters();
          break;
        case 'flagged':
          fetchFlaggedProposals();
          break;
        case 'analytics':
          fetchCollabAnalytics();
          break;
        case 'all-collaborations':
          fetchAllCollaborations();
          break;
        default:
          break;
      }
    }
  }, [activeTab, user]);

  // Fetch Functions
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, proposalsRes, countersRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/collaborations/pending'),
        api.get('/admin/collaborations/counters/pending'),
        api.get('/admin/collaborations/analytics')
      ]);

      setStats(statsRes.data);
      setPendingProposals(proposalsRes.data);
      setPendingCounters(countersRes.data);
      setCollabAnalytics(analyticsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProposals = async () => {
    try {
      const res = await api.get('/admin/collaborations/pending');
      setPendingProposals(res.data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    }
  };

  const fetchPendingCounters = async () => {
    try {
      const res = await api.get('/admin/collaborations/counters/pending');
      setPendingCounters(res.data);
    } catch (err) {
      console.error('Error fetching counters:', err);
    }
  };

  const fetchFlaggedProposals = async () => {
    try {
      const res = await api.get('/admin/collaborations/flagged');
      setFlaggedProposals(res.data);
    } catch (err) {
      console.error('Error fetching flagged proposals:', err);
    }
  };

  const fetchCollabAnalytics = async () => {
    try {
      const res = await api.get('/admin/collaborations/analytics');
      setCollabAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchAllCollaborations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/collaborations/all', {
        params: {
          page: 1,
          limit: 100,
          status: proposalFilters.status || undefined,
          type: proposalFilters.type || undefined
        }
      });
      setAllCollaborations(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching all collaborations:', err);
      setError('Failed to load collaborations');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalDetails = async (id) => {
    try {
      const res = await api.get(`/admin/collaborations/${id}`);
      setSelectedProposal(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching proposal details:', err);
      alert('Failed to load proposal details');
    }
  };

  const fetchCounterDetails = async (id) => {
    try {
      const res = await api.get(`/admin/collaborations/counters/${id}`);
      setSelectedCounter(res.data);
      setShowCounterModal(true);
    } catch (err) {
      console.error('Error fetching counter details:', err);
      alert('Failed to load counter details');
    }
  };

  // Action Handlers
  const handleApproveProposal = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/${selectedProposal._id}/approve`, {
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowApproveModal(false);
      setShowDetailsModal(false);
      setAdminNotes('');
      setSelectedProposal(null);
      
      alert('Proposal approved successfully!');
    } catch (err) {
      console.error('Error approving proposal:', err);
      alert(err.response?.data?.message || 'Failed to approve proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (rejectionReason.length < 10) {
      alert('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/${selectedProposal._id}/reject`, {
        rejectionReason,
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedProposal(null);
      
      alert('Proposal rejected successfully!');
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      alert(err.response?.data?.message || 'Failed to reject proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagProposal = async () => {
    if (flagReason.length < 5) {
      alert('Please provide a reason for flagging');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/${selectedProposal._id}/flag`, {
        flagReason,
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      await fetchFlaggedProposals();
      
      setShowFlagModal(false);
      setShowDetailsModal(false);
      setFlagReason('');
      setAdminNotes('');
      setSelectedProposal(null);
      
      alert('Proposal flagged successfully!');
    } catch (err) {
      console.error('Error flagging proposal:', err);
      alert(err.response?.data?.message || 'Failed to flag proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCounter = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/counters/${selectedCounter._id}/approve`, {
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowApproveModal(false);
      setShowCounterModal(false);
      setAdminNotes('');
      setSelectedCounter(null);
      
      alert('Counter-proposal approved successfully!');
    } catch (err) {
      console.error('Error approving counter:', err);
      alert(err.response?.data?.message || 'Failed to approve counter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCounter = async () => {
    if (rejectionReason.length < 10) {
      alert('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/counters/${selectedCounter._id}/reject`, {
        rejectionReason,
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowRejectModal(false);
      setShowCounterModal(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedCounter(null);
      
      alert('Counter-proposal rejected successfully!');
    } catch (err) {
      console.error('Error rejecting counter:', err);
      alert(err.response?.data?.message || 'Failed to reject counter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper Functions
  const getCollabTypeLabel = (type) => {
    const labels = {
      communityToVenue: 'Community → Venue',
      communityToBrand: 'Community → Brand',
      brandToCommunity: 'Brand → Community',
      venueToCommunity: 'Venue → Community',
      // Legacy types
      venue_request: 'Venue Request',
      brand_sponsorship: 'Brand Sponsorship',
      community_partnership: 'Community Partnership'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { color: 'bg-gray-500', text: 'Draft' },
      pending_admin_review: { color: 'bg-yellow-500', text: 'Pending Review' },
      approved_delivered: { color: 'bg-green-500', text: 'Approved' },
      rejected: { color: 'bg-red-500', text: 'Rejected' },
      counter_pending_review: { color: 'bg-blue-500', text: 'Counter Pending' },
      counter_delivered: { color: 'bg-purple-500', text: 'Counter Delivered' },
      confirmed: { color: 'bg-emerald-500', text: 'Confirmed' },
      declined: { color: 'bg-orange-500', text: 'Declined' },
      flagged: { color: 'bg-red-600 animate-pulse', text: 'Flagged' }
    };
    const { color, text } = config[status] || { color: 'bg-gray-500', text: status };
    return (
      <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${color}`}>
        {text}
      </span>
    );
  };

  const getComplianceRiskBadge = (flags) => {
    if (!flags || flags.length === 0) {
      return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">Clean</span>;
    }
    
    const highRisk = flags.some(f => f.includes('auto_reject') || f.includes('phone') || f.includes('email'));
    if (highRisk) {
      return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded animate-pulse">High Risk</span>;
    }
    
    return <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded">Review</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Collaboration Management Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome, {user?.name || 'Admin'} • {user?.adminProfile?.accessLevel?.replace('_', ' ').toUpperCase() || 'FULL ACCESS'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[
                { id: 'dashboard', label: 'Overview', badge: null },
                { id: 'proposals', label: 'Pending Proposals', badge: pendingProposals.length || null },
                { id: 'counters', label: 'Pending Counters', badge: pendingCounters.length || null },
                { id: 'all-collaborations', label: 'All Collaborations', badge: null },
                { id: 'flagged', label: 'Flagged Items', badge: flaggedProposals.length || null },
                { id: 'analytics', label: 'Analytics', badge: null }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Platform Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalUsers || 0}
                    </p>
                    {stats?.growth?.users?.growthPercentage !== undefined && (
                      <p className={`text-sm mt-2 ${stats.growth.users.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.growth.users.growthPercentage >= 0 ? '+' : ''}{stats.growth.users.growthPercentage}% from last month
                      </p>
                    )}
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Communities */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Communities</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalCommunities || 0}
                    </p>
                    {stats?.growth?.communities?.growthPercentage !== undefined && (
                      <p className={`text-sm mt-2 ${stats.growth.communities.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.growth.communities.growthPercentage >= 0 ? '+' : ''}{stats.growth.communities.growthPercentage}% from last month
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Venues */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Venues</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalVenues || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Brands */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brands</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalBrands || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Collaboration Stats */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collaboration Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                      {collabAnalytics?.pendingReview || 0}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Needs your action
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Proposals</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {collabAnalytics?.totalProposals || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Rate</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {collabAnalytics?.approvalRate ? `${Math.round(collabAnalytics.approvalRate)}%` : '0%'}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Review Time</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {collabAnalytics?.avgReviewTime ? `${Math.round(collabAnalytics.avgReviewTime)}h` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flagged Items</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                      {collabAnalytics?.flagged || 0}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Compliance issues
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmed</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    {collabAnalytics?.confirmed || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {collabAnalytics?.rejected || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Counters</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {pendingCounters.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('proposals')}
                  className="p-4 border-2 border-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">Review Proposals</span>
                    {pendingProposals.length > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pendingProposals.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and approve pending collaboration proposals
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('counters')}
                  className="p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Review Counters</span>
                    {pendingCounters.length > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pendingCounters.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review counter-proposals from recipients
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('flagged')}
                  className="p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-600 dark:text-red-400 font-semibold">Check Flagged</span>
                    {flaggedProposals.length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        {flaggedProposals.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review compliance violations and flagged items
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Proposals Tab */}
        {activeTab === 'proposals' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pending Proposals</h2>
              <p className="text-gray-600 dark:text-gray-400">Review and approve collaboration proposals submitted by users</p>
            </div>

            {pendingProposals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No pending proposals to review</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">All caught up! 🎉</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProposals.map((proposal) => (
                  <div key={proposal._id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {getStatusBadge(proposal.status)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {getCollabTypeLabel(proposal.type)}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Submitted {getTimeSince(proposal.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {proposal.complianceFlags && proposal.complianceFlags.length > 0 && (
                            <>
                              {getComplianceRiskBadge(proposal.complianceFlags)}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* Proposer */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.proposerId?.profileImage || '/default-avatar.png'}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.proposerId?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {proposal.proposerType}
                            </p>
                          </div>
                        </div>

                        {/* Recipient */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.recipientId?.profileImage || '/default-avatar.png'}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.recipientId?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {proposal.recipientType}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Compliance Flags Alert */}
                      {proposal.complianceFlags && proposal.complianceFlags.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Compliance Issues Detected</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {proposal.complianceFlags.map((flag, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded">
                                    {flag.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => fetchProposalDetails(proposal._id)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          View Full Details →
                        </button>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowFlagModal(true);
                            }}
                            className="px-4 py-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 border border-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                          >
                            Flag
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Counters Tab */}
        {activeTab === 'counters' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pending Counter-Proposals</h2>
              <p className="text-gray-600 dark:text-gray-400">Review counter-proposals submitted in response to collaborations</p>
            </div>

            {pendingCounters.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No pending counters to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCounters.map((counter) => (
                  <div key={counter._id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Counter-Proposal Response
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Original: {getCollabTypeLabel(counter.collaborationId?.type)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Submitted {getTimeSince(counter.createdAt)}
                          </p>
                        </div>
                        {getStatusBadge(counter.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* Original Proposer */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={counter.collaborationId?.proposerId?.profileImage || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Original Proposer</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {counter.collaborationId?.proposerId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        {/* Counter Responder */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={counter.responderId?.profileImage || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Counter by</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {counter.responderId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Counter Summary */}
                      {counter.counterData && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-900 dark:text-blue-300">
                            <strong>Modifications:</strong> {Object.keys(counter.counterData.fieldResponses || {}).filter(key => 
                              counter.counterData.fieldResponses[key]?.action === 'modify'
                            ).length} fields modified
                          </p>
                          {counter.counterData.generalNotes && (
                            <p className="text-sm text-blue-900 dark:text-blue-300 mt-1">
                              <strong>Note:</strong> {counter.counterData.generalNotes.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => fetchCounterDetails(counter._id)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          View Full Counter →
                        </button>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedCounter(counter);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCounter(counter);
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flagged Items Tab */}
        {activeTab === 'flagged' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Flagged Items</h2>
              <p className="text-gray-600 dark:text-gray-400">Review proposals with compliance violations or manual flags</p>
            </div>

            {flaggedProposals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No flagged items</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">All submissions are compliant! ✨</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedProposals.map((proposal) => (
                  <div key={proposal._id} className="bg-white dark:bg-gray-800 rounded-lg shadow border-2 border-red-300 hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusBadge(proposal.status)}
                            {getComplianceRiskBadge(proposal.complianceFlags)}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {getCollabTypeLabel(proposal.type)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Flagged {getTimeSince(proposal.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.proposerId?.profileImage || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.proposerId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.recipientId?.profileImage || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.recipientId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Compliance Flags */}
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Violation Details:</p>
                            <div className="flex flex-wrap gap-2">
                              {proposal.complianceFlags && proposal.complianceFlags.map((flag, idx) => (
                                <span key={idx} className="inline-block text-xs px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-full font-medium">
                                  {flag.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => fetchProposalDetails(proposal._id)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          Investigate Details →
                        </button>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 border border-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            Approve Anyway
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && collabAnalytics && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Collaboration Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400">Insights and metrics for collaboration workflow</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Total Proposals</p>
                <p className="text-4xl font-bold mt-2">{collabAnalytics.totalProposals || 0}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Approval Rate</p>
                <p className="text-4xl font-bold mt-2">{collabAnalytics.approvalRate ? `${Math.round(collabAnalytics.approvalRate)}%` : '0%'}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Avg Review Time</p>
                <p className="text-4xl font-bold mt-2">{collabAnalytics.avgReviewTime ? `${Math.round(collabAnalytics.avgReviewTime)}h` : 'N/A'}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Success Rate</p>
                <p className="text-4xl font-bold mt-2">
                  {collabAnalytics.totalProposals > 0 
                    ? `${Math.round((collabAnalytics.confirmed / collabAnalytics.totalProposals) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>

            {/* Breakdown by Type */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Proposals by Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {collabAnalytics.byType && Object.entries(collabAnalytics.byType).map(([type, count]) => (
                  <div key={type} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{getCollabTypeLabel(type)}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {collabAnalytics.totalProposals > 0 
                        ? `${Math.round((count / collabAnalytics.totalProposals) * 100)}%`
                        : '0%'
                      } of total
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{collabAnalytics.pendingReview || 0}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{collabAnalytics.approved || 0}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{collabAnalytics.rejected || 0}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Confirmed</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{collabAnalytics.confirmed || 0}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              {collabAnalytics.recentActivity && collabAnalytics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {collabAnalytics.recentActivity.map((activity) => (
                    <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(activity.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getCollabTypeLabel(activity.type)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.proposerId?.name} → {activity.recipientId?.name}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(activity.updatedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Proposal Details Modal */}
      {showDetailsModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Proposal Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedProposal._id}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProposal(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Status and Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusBadge(selectedProposal.status)}
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getCollabTypeLabel(selectedProposal.type)}
                  </span>
                </div>
                {selectedProposal.complianceFlags && selectedProposal.complianceFlags.length > 0 && (
                  <>
                    {getComplianceRiskBadge(selectedProposal.complianceFlags)}
                  </>
                )}
              </div>

              {/* Compliance Flags */}
              {selectedProposal.complianceFlags && selectedProposal.complianceFlags.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">⚠️ COMPLIANCE VIOLATIONS DETECTED</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProposal.complianceFlags.map((flag, idx) => (
                          <span key={idx} className="inline-block text-xs px-3 py-1.5 bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded-full font-semibold">
                            {flag.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proposer */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">PROPOSER</p>
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={selectedProposal.proposerId?.profileImage || '/default-avatar.png'}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {selectedProposal.proposerId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProposal.proposerType}</p>
                    </div>
                  </div>
                  {selectedProposal.proposerId?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📧 {selectedProposal.proposerId.email}
                    </p>
                  )}
                  {selectedProposal.proposerId?.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📱 {selectedProposal.proposerId.phone}
                    </p>
                  )}
                </div>

                {/* Recipient */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">RECIPIENT</p>
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={selectedProposal.recipientId?.profileImage || '/default-avatar.png'}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {selectedProposal.recipientId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProposal.recipientType}</p>
                    </div>
                  </div>
                  {selectedProposal.recipientId?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📧 {selectedProposal.recipientId.email}
                    </p>
                  )}
                  {selectedProposal.recipientId?.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📱 {selectedProposal.recipientId.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Data */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Proposal Details</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedProposal.formData && Object.entries(selectedProposal.formData).map(([key, value]) => {
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                      return (
                        <div key={key} className="pl-4 border-l-2 border-purple-300 dark:border-purple-700">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </p>
                          <div className="pl-3 space-y-1">
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <p key={subKey} className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{subKey}:</span> {String(subValue)}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 text-right max-w-md break-words">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedProposal.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedProposal.updatedAt)}</p>
                  </div>
                  {selectedProposal.adminReviewedAt && (
                    <>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Reviewed:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedProposal.adminReviewedAt)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Reviewed By:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {selectedProposal.adminReviewedBy?.name || 'Unknown Admin'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Admin Notes (if any) */}
              {selectedProposal.adminNotes && (
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Admin Notes (Private)</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{selectedProposal.adminNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedProposal.status === 'pending_admin_review' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowFlagModal(true)}
                    className="px-6 py-3 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 border border-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors font-medium"
                  >
                    🚩 Flag for Review
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ✖ Reject
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✓ Approve & Deliver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Counter Details Modal */}
      {showCounterModal && selectedCounter && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Counter-Proposal Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedCounter._id}</p>
              </div>
              <button
                onClick={() => {
                  setShowCounterModal(false);
                  setSelectedCounter(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Original Proposal Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Original Proposal</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Type:</strong> {getCollabTypeLabel(selectedCounter.collaborationId?.type)}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>From:</strong> {selectedCounter.collaborationId?.proposerId?.name} ({selectedCounter.collaborationId?.proposerType})
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>To:</strong> {selectedCounter.collaborationId?.recipientId?.name} ({selectedCounter.collaborationId?.recipientType})
                </p>
              </div>

              {/* Counter Responder */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">COUNTER SUBMITTED BY</p>
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedCounter.responderId?.profileImage || '/default-avatar.png'}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">
                      {selectedCounter.responderId?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCounter.responderType}</p>
                  </div>
                </div>
              </div>

              {/* Field Responses */}
              {selectedCounter.counterData?.fieldResponses && Object.keys(selectedCounter.counterData.fieldResponses).length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Field-by-Field Responses</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(selectedCounter.counterData.fieldResponses).map(([field, response]) => (
                      <div key={field} className={`p-3 rounded-lg border-2 ${
                        response.action === 'accept' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                        response.action === 'modify' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' :
                        'border-red-300 bg-red-50 dark:bg-red-900/20'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            response.action === 'accept' ? 'bg-green-500 text-white' :
                            response.action === 'modify' ? 'bg-blue-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {response.action.toUpperCase()}
                          </span>
                        </div>
                        {response.action === 'modify' && response.modifiedValue && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            <strong>New Value:</strong> {String(response.modifiedValue)}
                          </p>
                        )}
                        {response.note && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            💬 "{response.note}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* House Rules (if applicable) */}
              {selectedCounter.counterData?.houseRules && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">House Rules</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(selectedCounter.counterData.houseRules).map(([rule, value]) => (
                      <div key={rule}>
                        <span className="text-gray-500 dark:text-gray-400">{rule}:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commercial Counter (if applicable) */}
              {selectedCounter.counterData?.commercialCounter && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">💰 Commercial Counter-Offer</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Model:</strong> {selectedCounter.counterData.commercialCounter.model}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Value:</strong> {selectedCounter.counterData.commercialCounter.value}
                    </p>
                    {selectedCounter.counterData.commercialCounter.note && (
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        💬 "{selectedCounter.counterData.commercialCounter.note}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* General Notes */}
              {selectedCounter.counterData?.generalNotes && (
                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">General Notes</h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">{selectedCounter.counterData.generalNotes}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedCounter.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedCounter.status)}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedCounter.status === 'pending_admin_review' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ✖ Reject Counter
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✓ Approve & Deliver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (selectedProposal || selectedCounter) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedCounter ? 'Approve Counter-Proposal' : 'Approve Proposal'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCounter 
                ? `Approve this counter-proposal? It will be delivered to the original proposer.`
                : `Approve this proposal? It will be delivered to ${selectedProposal?.recipientId?.name}.`
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Notes (Optional - Private)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Add any internal notes for admin records..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setAdminNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={selectedCounter ? handleApproveCounter : handleApproveProposal}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Approve & Deliver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (selectedProposal || selectedCounter) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedCounter ? 'Reject Counter-Proposal' : 'Reject Proposal'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCounter
                ? "The counter will be rejected and the collaboration will reopen for the recipient to respond again."
                : "The user will be notified with a generic rejection message. The specific reason is for admin logs only."
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Provide a detailed reason (min 10 characters) - shown to user as generic message"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {rejectionReason.length}/10 minimum characters
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Internal Notes (Optional - Private)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                rows="2"
                placeholder="Add internal notes (not shown to users)..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setAdminNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={selectedCounter ? handleRejectCounter : handleRejectProposal}
                disabled={actionLoading || rejectionReason.length < 10}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🚩 Flag Proposal for Review
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Flagging will mark this proposal for additional review. It will not be delivered until unflagged and approved.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Flag Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Why is this being flagged? (min 5 characters)"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {flagReason.length}/5 minimum characters
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Internal Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                rows="2"
                placeholder="Additional context..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                  setAdminNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagProposal}
                disabled={actionLoading || flagReason.length < 5}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? 'Flagging...' : 'Flag for Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
