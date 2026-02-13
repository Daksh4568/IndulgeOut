import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../config/api';
import {
  ArrowLeft, MessageCircle, Check, X, Clock, AlertCircle,
  User, Calendar, Users, DollarSign, Send, Building2, Sparkles, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';

const CollaborationManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [collaborations, setCollaborations] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [filterStatus, setFilterStatus] = useState('all'); // Default to 'all' to show all requests
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAction, setResponseAction] = useState(''); // 'accept' or 'reject'
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Handle success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.tab) {
        setActiveTab(location.state.tab);
      }
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    fetchCollaborations();
  }, [user, authLoading, activeTab]);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'received' 
        ? '/collaborations/received'
        : '/collaborations/sent';
      
      const response = await api.get(endpoint);
      
      console.log('Collaborations response:', response.data);
      console.log('Collaborations array:', response.data.data);
      
      // Log first collaboration in detail to debug structure
      if (response.data.data && response.data.data.length > 0) {
        console.log('First collaboration details:', {
          id: response.data.data[0]._id,
          proposerId: response.data.data[0].proposerId,
          recipientId: response.data.data[0].recipientId,
          formData: response.data.data[0].formData,
          requestDetails: response.data.data[0].requestDetails,
          type: response.data.data[0].type,
          status: response.data.data[0].status,
          hasCounter: response.data.data[0].hasCounter,
          latestCounterId: response.data.data[0].latestCounterId
        });
      }
      
      setCollaborations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      setCollaborations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollaborations = collaborations.filter(collab => {
    if (filterStatus === 'all') return true;
    return collab.status === filterStatus;
  });

  const handleOpenResponse = (collaboration, action) => {
    setSelectedCollaboration(collaboration);
    setResponseAction(action);
    setShowResponseModal(true);
    setResponseMessage('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedCollaboration || !responseMessage.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      
      await api.post(`/collaborations/${selectedCollaboration._id}/${responseAction}`, {
        responseMessage: responseMessage
      });

      // Refresh collaborations
      await fetchCollaborations();
      
      // Close modal
      setShowResponseModal(false);
      setSelectedCollaboration(null);
      setResponseMessage('');
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending_admin_review: 'Pending',
      approved_delivered: 'Awaiting Response',
      counter_delivered: 'Counter Received',
      confirmed: 'Confirmed',
      declined: 'Declined',
      rejected: 'Not Approved'
    };
    return labels[status] || status.replace(/_/g, ' ');
  };

  const getStatusBadge = (collab, isReceived) => {
    // Use userFacingStatus if available, otherwise fall back to status
    const displayStatus = collab.userFacingStatus || collab.status;
    
    // Map user-facing status to badge styling
    const badges = {
      // User-facing statuses
      'Draft': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
      'Under Review': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      'Sent to Recipient': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
      'New Proposal': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
      'Needs Revision': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
      'Processing Response': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
      'Response Received': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      'Response Sent': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      'Confirmed': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      'Declined': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
      
      // Legacy fallback for internal statuses
      draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
      pending_admin_review: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      approved_delivered: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
      rejected: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
      counter_pending_review: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
      counter_delivered: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      confirmed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      declined: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
      flagged: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
      
      // Legacy support
      submitted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Pending' },
      admin_approved: { 
        bg: 'bg-purple-100 dark:bg-purple-900/30', 
        text: 'text-purple-700 dark:text-purple-300', 
        label: isReceived ? 'Awaiting Your Response' : 'Delivered'
      },
      admin_rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Not Approved' },
      vendor_accepted: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Accepted' },
      vendor_rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Rejected' },
      completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Completed' },
      cancelled: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Cancelled' },
      expired: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
      accepted: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' }
    };
    const badge = badges[displayStatus] || badges[collab.status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {displayStatus}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'High Priority' },
      medium: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Medium' },
      low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Low' }
    };
    const badge = badges[priority] || badges.low;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    if (type === 'venue_request') return <Building2 className="h-5 w-5" />;
    if (type === 'brand_sponsorship') return <Sparkles className="h-5 w-5" />;
    return <Users className="h-5 w-5" />;
  };

  const formatCollaborationType = (type) => {
    if (!type) return 'Collaboration';
    const typeMap = {
      'communityToVenue': 'Community → Venue',
      'communityToBrand': 'Community → Brand',
      'brandToCommunity': 'Brand → Community',
      'venueToCommunity': 'Venue → Community',
      'venueToBrand': 'Venue → Brand',
      'brandToVenue': 'Brand → Venue'
    };
    return typeMap[type] || type.replace('_', ' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    // Handle object format {date, startTime, endTime}
    if (typeof dateString === 'object' && dateString.date) {
      dateString = dateString.date;
    }
    // If date is empty string, return appropriate message
    if (dateString === '' || !dateString) return 'Date not set';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilEvent = (eventDate) => {
    if (!eventDate) return null;
    // Handle object format {date, startTime, endTime}
    let dateValue = eventDate;
    if (typeof eventDate === 'object' && eventDate.date) {
      dateValue = eventDate.date;
    }
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Collaboration Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your venue and brand partnership requests
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Received Requests
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sent Requests
            </button>
          </div>

          {/* Filter */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Filter by:</span>
              <div className="flex space-x-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'pending_admin_review', label: 'Under Review' },
                  { value: 'approved_delivered', label: activeTab === 'sent' ? 'Sent to Recipient' : 'New Proposal' },
                  { value: 'counter_delivered', label: activeTab === 'sent' ? 'Response Received' : 'Response Sent' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'declined', label: 'Declined' },
                  { value: 'rejected', label: 'Needs Revision' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterStatus(value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      filterStatus === value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Collaborations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredCollaborations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No requests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filterStatus === 'all' 
                ? `You haven't ${activeTab === 'received' ? 'received' : 'sent'} any collaboration requests yet.`
                : `No requests with status "${getStatusLabel(filterStatus)}" to show.`}
            </p>
            {activeTab === 'sent' && (
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => navigate('/browse/venues')}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
                >
                  Browse Venues
                </button>
                <button
                  onClick={() => navigate('/browse/sponsors')}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                  Browse Sponsors
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCollaborations.map((collab) => {
              const isReceived = activeTab === 'received';
              // Use new structure (initiator/recipient) for partner info
              const partner = isReceived ? collab.initiator : collab.recipient;
              const eventDays = getDaysUntilEvent(collab.formData?.eventDate?.date || collab.formData?.eventDate || collab.requestDetails?.eventDate);
              
              // Debug logging
              if (!partner) {
                console.warn('Partner is undefined for collaboration:', {
                  collabId: collab._id,
                  isReceived,
                  initiator: collab.initiator,
                  recipient: collab.recipient
                });
              }
              
              return (
                <div
                  key={collab._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Partner Info */}
                      <div className="flex-shrink-0">
                        {partner?.profileImage ? (
                          <img
                            src={partner.profileImage}
                            alt={partner?.name || 'Partner'}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                            {getTypeIcon(collab.type)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {partner?.name || 'Unknown Partner'}
                          </h3>
                          {getStatusBadge(collab, isReceived)}
                          {getPriorityBadge(collab.priority)}
                          {/* Counter Indicator */}
                          {collab.hasCounter && collab.latestCounterId && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              Has Counter
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 capitalize">
                          {formatCollaborationType(collab.type)} • {isReceived ? 'From' : 'To'} {partner?.name || 'Unknown'}
                        </p>

                        {/* Event Details */}
                        {(collab.formData || collab.requestDetails) && (
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {(collab.formData?.eventName || collab.requestDetails?.eventName) && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {collab.formData?.eventName || collab.requestDetails?.eventName}
                                </span>
                              </div>
                            )}
                            {(collab.formData?.eventDate || collab.requestDetails?.eventDate) && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {formatDate(collab.formData?.eventDate || collab.requestDetails?.eventDate)}
                                  {eventDays !== null && eventDays >= 0 && (
                                    <span className={`ml-1 ${eventDays < 7 ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                                      ({eventDays} days)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Preview */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {collab.formData?.message || collab.requestDetails?.message}
                        </p>

                        {/* Venue/Brand Specific Info */}
                        {collab.venueRequest && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {collab.venueRequest.expectedAttendees && (
                              <span className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                                <Users className="h-3 w-3" />
                                <span>{collab.venueRequest.expectedAttendees} guests</span>
                              </span>
                            )}
                            {collab.venueRequest.timeSlot && (
                              <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded capitalize">
                                {collab.venueRequest.timeSlot.replace('_', ' ')}
                              </span>
                            )}
                            {collab.venueRequest.budgetRange && (
                              <span className="flex items-center space-x-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                                <DollarSign className="h-3 w-3" />
                                <span>{collab.venueRequest.budgetRange}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {collab.brandSponsorship && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {collab.brandSponsorship.expectedReach && (
                              <span className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                                <Users className="h-3 w-3" />
                                <span>{collab.brandSponsorship.expectedReach.toLocaleString()} reach</span>
                              </span>
                            )}
                            {collab.brandSponsorship.budgetProposed && (
                              <span className="flex items-center space-x-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                                <DollarSign className="h-3 w-3" />
                                <span>₹{(collab.brandSponsorship.budgetProposed / 1000).toFixed(0)}K</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Response */}
                        {collab.response && collab.response.message && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Response:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{collab.response.message}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions for RECEIVED proposals */}
                    {isReceived && (collab.status === 'admin_approved' || collab.status === 'approved_delivered' || collab.status === 'accepted') && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            console.log('Opening counter form for collaboration:', {
                              id: collab._id,
                              type: collab.type,
                              status: collab.status
                            });
                            
                            // Navigate to counter form
                            navigate(`/collaborations/${collab._id}/counter`);
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                          title="Respond to proposal"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Respond
                        </button>
                        <button
                          onClick={() => handleOpenResponse(collab, 'reject')}
                          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                          title="Decline proposal"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                    {/* Actions for SENT proposals - Review Counter */}
                    {!isReceived && collab.status === 'counter_delivered' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => navigate(`/collaborations/${collab._id}/counter-review`)}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center font-medium"
                          title="Review counter-proposal"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Review Counter
                        </button>
                      </div>
                    )}

                    {/* Actions for CONFIRMED collaborations */}
                    {collab.status === 'confirmed' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => navigate(`/collaborations/${collab._id}/final-terms`)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                          title="View final confirmed terms"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Final Terms
                        </button>
                      </div>
                    )}
                    
                    {/* Show info message for pending states - hide admin review mention */}
                    {(collab.status === 'pending_admin_review' || collab.status === 'submitted') && (
                      <div className="ml-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{isReceived ? 'Processing' : 'Pending'}</span>
                      </div>
                    )}

                    {/* Show info for counter pending */}
                    {collab.status === 'counter_pending_review' && (
                      <div className="ml-4 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg text-xs flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Processing counter</span>
                      </div>
                    )}
                    
                    {collab.status === 'admin_rejected' && collab.adminReview?.notes && (
                      <div className="ml-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-xs max-w-xs">
                        <p className="font-medium mb-1">Request not approved</p>
                        <p className="text-xs">{collab.adminReview.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span>Sent on {formatDate(collab.createdAt)}</span>
                    {collab.expiresAt && new Date(collab.expiresAt) > new Date() && (
                      <span>Expires on {formatDate(collab.expiresAt)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedCollaboration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {responseAction === 'accept' ? 'Accept' : 'Reject'} Collaboration Request
              </h2>

              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">From:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCollaboration.initiator?.name || 'Unknown Partner'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {selectedCollaboration.formData?.message || selectedCollaboration.requestDetails?.message}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Response Message *
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder={
                    responseAction === 'accept'
                      ? "Great! I'd love to collaborate. Let me know the next steps..."
                      : 'Thank you for your interest, but at this time...'
                  }
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {responseMessage.length} / 1000 characters
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedCollaboration(null);
                    setResponseMessage('');
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={!responseMessage.trim() || submitting}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    responseAction === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>{responseAction === 'accept' ? 'Accept Request' : 'Reject Request'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationManagement;

