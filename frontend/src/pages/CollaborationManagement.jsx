import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  ArrowLeft, MessageCircle, Check, X, Clock, AlertCircle,
  User, Calendar, Users, DollarSign, Send, Building2, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import API_URL from '../config/api';

const CollaborationManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [collaborations, setCollaborations] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [filterStatus, setFilterStatus] = useState('pending'); // 'all', 'pending', 'accepted', 'rejected'
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAction, setResponseAction] = useState(''); // 'accept' or 'reject'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCollaborations();
  }, [user, activeTab]);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'received' 
        ? '/collaborations/received'
        : '/collaborations/sent';
      
      const response = await api.get(endpoint);
      
      setCollaborations(response.data);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
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
      const endpoint = `${API_URL}/api/collaborations/${selectedCollaboration._id}/${responseAction}`;
      
      await axios.post(endpoint, {
        responseMessage: responseMessage
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
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

  const getStatusBadge = (status) => {
    const badges = {
      submitted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Awaiting Admin Review' },
      admin_approved: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Admin Approved' },
      admin_rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Admin Rejected' },
      vendor_accepted: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Accepted' },
      vendor_rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Rejected' },
      completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Completed' },
      cancelled: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Cancelled' },
      expired: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Expired' },
      // Legacy support
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Pending' },
      accepted: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Accepted' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Rejected' }
    };
    const badge = badges[status] || badges.submitted;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilEvent = (eventDate) => {
    if (!eventDate) return null;
    const days = Math.ceil((new Date(eventDate) - new Date()) / (1000 * 60 * 60 * 24));
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
                {['all', 'submitted', 'admin_approved', 'admin_rejected', 'vendor_accepted', 'vendor_rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      filterStatus === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                : `No ${filterStatus.replace(/_/g, ' ')} requests to show.`}
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
              const partner = isReceived ? collab.initiator : collab.recipient;
              const eventDays = getDaysUntilEvent(collab.requestDetails?.eventDate);
              
              return (
                <div
                  key={collab._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Partner Info */}
                      <div className="flex-shrink-0">
                        {partner.profileImage ? (
                          <img
                            src={partner.profileImage}
                            alt={partner.name}
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
                            {partner.name}
                          </h3>
                          {getStatusBadge(collab.status)}
                          {getPriorityBadge(collab.priority)}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 capitalize">
                          {collab.type.replace('_', ' ')} • {isReceived ? 'From' : 'To'} {partner.name}
                        </p>

                        {/* Event Details */}
                        {collab.requestDetails && (
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {collab.requestDetails.eventName && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {collab.requestDetails.eventName}
                                </span>
                              </div>
                            )}
                            {collab.requestDetails.eventDate && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {formatDate(collab.requestDetails.eventDate)}
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
                          {collab.requestDetails?.message}
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

                    {/* Actions - Only show for vendors when admin has approved */}
                    {isReceived && collab.status === 'admin_approved' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleOpenResponse(collab, 'reject')}
                          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenResponse(collab, 'accept')}
                          className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg transition-colors"
                          title="Accept"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    
                    {/* Show info message for submitted/rejected requests */}
                    {isReceived && collab.status === 'submitted' && (
                      <div className="ml-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Awaiting admin review</span>
                      </div>
                    )}
                    
                    {collab.status === 'admin_rejected' && collab.adminReview?.notes && (
                      <div className="ml-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-xs max-w-xs">
                        <p className="font-medium mb-1">Admin: Request not approved</p>
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
                  {selectedCollaboration.initiator.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {selectedCollaboration.requestDetails?.message}
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

