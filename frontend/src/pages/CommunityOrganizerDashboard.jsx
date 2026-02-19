import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, TrendingUp, AlertCircle, DollarSign, Users, 
  Eye, Target, Clock, ChevronRight, Plus, Edit, Copy,
  CheckCircle, XCircle, AlertTriangle, BarChart3, 
  ArrowUpRight, ArrowDownRight, Filter, Download, Bell,
  Building2, Sparkles, QrCode, Grid, Settings, HelpCircle, ChevronLeft, Users2, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import NavigationBar from '../components/NavigationBar';
import { api } from '../config/api';
import { CATEGORY_ICONS } from '../constants/eventConstants';

const CommunityOrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // Changed from 'draft' to 'all'
  const [activeCollabTab, setActiveCollabTab] = useState('all'); // For collaborations
  const [selectedDateRange, setSelectedDateRange] = useState('30days');
  const [activeSidebarItem, setActiveSidebarItem] = useState('all'); // For sidebar navigation
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [collabCarouselIndex, setCollabCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const mobileScrollRef = useRef(null);
  
  // Dashboard Data States
  const [actionItems, setActionItems] = useState([]);
  const [events, setEvents] = useState({ draft: [], live: [], past: [] });
  const [collaborations, setCollaborations] = useState({ all: [], upcoming: [], live: [], completed: [] });
  const [earnings, setEarnings] = useState({
    totalLifetime: 0,
    thisMonth: 0,
    pendingPayout: 0,
    lastPayoutDate: null
  });
  const [analytics, setAnalytics] = useState({});
  const [insights, setInsights] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reset carousel when tab changes
  useEffect(() => {
    setCarouselIndex(0);
  }, [activeTab]);

  // Check if KYC is complete
  const checkKYCComplete = () => {
    if (!user?.payoutDetails?.accountHolderName || 
        !user?.payoutDetails?.accountNumber || 
        !user?.payoutDetails?.ifscCode) {
      toast?.error('Please complete your KYC details before creating an event');
      navigate('/kyc-setup');
      return false;
    }
    return true;
  };

  const handleCreateEvent = () => {
    if (checkKYCComplete()) {
      navigate('/create-event');
    }
  };

  // Reset collaboration carousel when tab changes
  useEffect(() => {
    setCollabCarouselIndex(0);
  }, [activeCollabTab]);

  // Track mobile scroll to update indicator
  const handleMobileScroll = (e) => {
    const width = e.target.clientWidth || 1;
    const idx = Math.round(e.target.scrollLeft / width);
    setCarouselIndex(Math.max(0, idx));
  };

  // Refetch analytics when date range changes
  useEffect(() => {
    if (selectedDateRange) {
      fetchAnalytics();
    }
  }, [selectedDateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [dashboardRes, eventsRes, earningsRes, analyticsRes, insightsRes, sentCollabsRes, receivedCollabsRes] = await Promise.all([
        api.get('/organizer/dashboard'),
        api.get('/organizer/events'),
        api.get('/organizer/earnings'),
        api.get('/organizer/analytics', {
          params: { dateRange: selectedDateRange }
        }),
        api.get('/organizer/insights'),
        api.get('/collaborations/sent'),
        api.get('/collaborations/received')
      ]);

      console.log('🔍 [Frontend] Dashboard response received:', dashboardRes.data);
      console.log('📋 [Frontend] actionsRequired:', dashboardRes.data.actionsRequired);
      console.log('🔢 [Frontend] actionsRequired length:', dashboardRes.data.actionsRequired?.length);

      // Dashboard response includes actionsRequired from notifications
      setActionItems(dashboardRes.data.actionsRequired || []);
      console.log('✅ [Frontend] actionItems state set to:', dashboardRes.data.actionsRequired || []);
      setEvents(eventsRes.data);
      setEarnings(earningsRes.data);
      setAnalytics(analyticsRes.data);
      setInsights(insightsRes.data);

      // Organize collaborations by status
      const allCollabs = [...(sentCollabsRes.data.data || []), ...(receivedCollabsRes.data.data || [])];
      const upcoming = allCollabs.filter(c => ['submitted', 'admin_approved', 'pending', 'vendor_accepted', 'accepted'].includes(c.status));
      const liveCollabs = allCollabs.filter(c => ['confirmed', 'approved_delivered'].includes(c.status));
      const completed = allCollabs.filter(c => ['completed'].includes(c.status));

      setCollaborations({ all: allCollabs, upcoming, live: liveCollabs, completed });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/organizer/analytics', {
        params: {
          dateRange: selectedDateRange
        }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // ==================== ACTION REQUIRED SECTION ====================
  const ActionRequiredSection = () => {
    console.log('🎯 [ActionRequiredSection] Rendering with actionItems:', actionItems);
    console.log('🔢 [ActionRequiredSection] actionItems.length:', actionItems.length);
    
    if (actionItems.length === 0) {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
            All Caught Up! 🎉
          </h3>
          <p className="text-green-700 dark:text-green-300">
            No pending actions required. Your events are running smoothly.
          </p>
        </div>
      );
    }

    const getActionIcon = (type) => {
      switch (type) {
        case 'collaboration_request': return <Users className="h-5 w-5" />;
        case 'draft_event': return <AlertCircle className="h-5 w-5" />;
        case 'missing_kyc': return <AlertTriangle className="h-5 w-5" />;
        case 'low_fill': return <TrendingUp className="h-5 w-5" />;
        default: return <AlertCircle className="h-5 w-5" />;
      }
    };

    const getActionColor = (priority) => {
      switch (priority) {
        case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
        case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
        case 'low': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
        default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
      }
    };

    return (
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {actionItems.map((item) => (
          <div
            key={item.id}
            className={`flex-shrink-0 w-80 border rounded-xl p-5 flex flex-col ${getActionColor(item.priority)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                item.priority === 'high' ? 'text-red-600 bg-red-100 dark:bg-red-900/40' :
                item.priority === 'medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40' :
                'text-blue-600 bg-blue-100 dark:bg-blue-900/40'
              }`}>
                {getActionIcon(item.type)}
              </div>
              {item.priority === 'high' && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                  High Priority
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {item.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {item.description}
            </p>
            {item.metadata && (
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                {item.metadata.eventName && (
                  <div>Event: <span className="font-medium">{item.metadata.eventName}</span></div>
                )}
                {item.metadata.daysUntil && (
                  <div>Time left: <span className="font-medium">{item.metadata.daysUntil} days</span></div>
                )}
              </div>
            )}
            {/* Spacer to push button to bottom */}
            <div className="flex-grow"></div>
            {/* Hide button for low_fill (Promote Event) actions */}
            {item.type !== 'low_fill' && (
              <button
                onClick={() => handleActionClick(item)}
                className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors mt-4 ${
                  item.priority === 'high' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : item.priority === 'medium'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {item.ctaText || 'Fix Now'}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleActionClick = (action) => {
    switch (action.type) {
      case 'collaboration_request':
        navigate(`/organizer/collaborations/${action.requestId}`);
        break;
      case 'draft_event':
        navigate(`/organizer/events/${action.eventId}/edit`);
        break;
      case 'missing_kyc':
      case 'complete_kyc':
        navigate('/kyc-setup');
        break;
      case 'profile_incomplete':
        navigate('/profile');
        break;
      case 'low_fill':
        navigate(`/organizer/events/${action.eventId}/promote`);
        break;
      default:
        break;
    }
  };

  // ==================== MANAGE EVENTS SECTION ====================
  const ManageEventsSection = () => {
    const allEvents = [...(events.draft || []), ...(events.live || []), ...(events.past || [])];
    const currentEvents = activeTab === 'all' ? allEvents : (events[activeTab] || []);

    const cardsPerView = 4;
    const maxIndex = Math.max(0, Math.ceil(currentEvents.length / cardsPerView) - 1);

    const handlePrevious = () => {
      setCarouselIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
      setCarouselIndex(prev => Math.min(maxIndex, prev + 1));
    };

    const getStatusBadge = (eventDate) => {
      // Determine status based purely on date since there's no status field
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const evDate = new Date(eventDate);
      evDate.setHours(0, 0, 0, 0);
      
      let actualStatus = 'draft';
      
      // If event date has passed, it's past
      if (evDate < today) {
        actualStatus = 'past';
      }
      // If event date is today or in future, it's live
      else if (evDate >= today) {
        actualStatus = 'live';
      }
      
      // Map status to badge styles
      const statusMap = {
        'draft': { bg: 'bg-gray-600', text: 'Draft' },
        'live': { bg: 'bg-green-600', text: 'Live' },
        'past': { bg: 'bg-gray-500', text: 'Past' },
        'cancelled': { bg: 'bg-red-600', text: 'Cancelled' }
      };
      return statusMap[actualStatus] || statusMap.draft;
    };

    const getProgressBarColor = (fillPercentage) => {
      if (fillPercentage >= 80) return 'bg-green-500';
      if (fillPercentage >= 50) return 'bg-yellow-500';
      return 'bg-orange-500';
    };

    return (
      <div>
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          {/* Tabs Container with Horizontal Scroll */}
          <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 pb-2 sm:pb-0">
              {[
                { key: 'all', label: 'All' },
                { key: 'live', label: `Live (${events.live?.length || 0})` },
                { key: 'past', label: `Past (${events.past?.length || 0})` },
                { key: 'draft', label: `Draft (${events.draft?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Carousel Navigation - Only show when there are enough events */}
            {currentEvents.length > cardsPerView && (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={carouselIndex === 0}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={carouselIndex === maxIndex}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            )}
            <button
              onClick={handleCreateEvent}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black px-6 py-2 rounded-md font-medium transition-all hover:bg-gray-100"
              style={{ 
                fontFamily: 'Oswald, sans-serif'
              }}
            >
              <Plus className="h-5 w-5" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Events Display - Carousel for All tab, Grid for others */}
        {currentEvents.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No {activeTab} events
            </h3>
            <p className="text-gray-400 mb-4">
              {activeTab === 'draft' 
                ? 'Start by creating your first event'
                : activeTab === 'live'
                ? 'No live events at the moment'
                : activeTab === 'past'
                ? 'No past events to show'
                : 'Start by creating your first event'}
            </p>
            {(activeTab === 'draft' || activeTab === 'all') && (
              <button
                onClick={handleCreateEvent}
                className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-100"
                style={{ 
                  fontFamily: 'Oswald, sans-serif'
                }}
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Event</span>
              </button>
            )}
          </div>
        ) : activeTab === 'all' ? (
          /* Carousel for All Tab */
          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden" ref={carouselRef}>
              {/* Mobile: Horizontal Scroll */}
              <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {currentEvents.map((event) => {
                      const fillPercentage = event.maxParticipants > 0 
                        ? Math.round(((event.currentParticipants || 0) / event.maxParticipants) * 100)
                        : 0;
                      const statusBadge = getStatusBadge(event.date);
                      const revenueValue = event.revenue || 0;

                      return (
                        <div
                          key={event._id}
                          onClick={() => navigate(`/events/${event._id}`)}
                          className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col cursor-pointer"
                        >
                      {/* Event Header */}
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex items-start justify-between mb-3">
                          <h3 
                            className="font-bold text-white text-lg flex-1 line-clamp-2"
                            style={{ fontFamily: 'Oswald, sans-serif' }}
                          >
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium flex-shrink-0`}>
                              {statusBadge.text}
                            </span>
                            {event.status !== 'completed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/edit-event/${event._id}`);
                                }}
                                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                                title="Edit Event"
                              >
                                <Edit className="h-4 w-4 text-gray-400 hover:text-white" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(event.date).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time || '7:00 PM - 10:00 PM'}</span>
                          </div>
                        </div>

                        {/* Bookings & Revenue */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-400">Bookings</span>
                              <span className="text-white font-bold">
                                {event.currentParticipants || 0}/{event.maxParticipants || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                              <div 
                                className={`${getProgressBarColor(fillPercentage)} h-2 rounded-full transition-all`}
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-800">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Revenue</span>
                              <span className="text-lg font-bold text-white">
                                ₹{revenueValue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-4 mt-auto">
                          {/* Scan Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/scan-tickets?eventId=${event._id}`);
                            }}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>Scan</span>
                          </button>

                          {/* Analytics Button - For events with bookings */}
                          {event.currentParticipants > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizer/events/${event._id}/analytics`);
                              }}
                              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span>Analytics</span>
                            </button>
                          )}

                          {/* Copy Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyEvent(event);
                            }}
                            className="p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                            title="Copy Event Details"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Grid with Pagination */}
              <div className="hidden md:block">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ 
                    transform: `translateX(-${carouselIndex * 100}%)`
                  }}
                >
                  {Array.from({ length: Math.ceil(currentEvents.length / cardsPerView) }).map((_, pageIndex) => (
                    <div 
                      key={pageIndex} 
                      className="grid grid-cols-4 gap-4 flex-shrink-0 w-full"
                    >
                      {currentEvents.slice(pageIndex * cardsPerView, (pageIndex + 1) * cardsPerView).map((event) => {
                        const fillPercentage = event.maxParticipants > 0 
                          ? Math.round(((event.currentParticipants || 0) / event.maxParticipants) * 100)
                          : 0;
                        const statusBadge = getStatusBadge(event.date);
                        const revenueValue = event.revenue || 0;

                        return (
                          <div
                            key={event._id}
                            onClick={() => navigate(`/events/${event._id}`)}
                            className="bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col cursor-pointer"
                          >
                      {/* Event Header */}
                      <div className="p-4 flex flex-col flex-grow h-full">
                        <div className="flex items-start justify-between mb-3">
                          <h3 
                            className="font-bold text-white text-lg flex-1 line-clamp-2"
                            style={{ fontFamily: 'Oswald, sans-serif' }}
                          >
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium flex-shrink-0`}>
                              {statusBadge.text}
                            </span>
                            {event.status !== 'completed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/edit-event/${event._id}`);
                                }}
                                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                                title="Edit Event"
                              >
                                <Edit className="h-4 w-4 text-gray-400 hover:text-white" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(event.date).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time || '7:00 PM - 10:00 PM'}</span>
                          </div>
                        </div>

                        {/* Bookings & Revenue */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-400">Bookings</span>
                              <span className="text-white font-bold">
                                {event.currentParticipants || 0}/{event.maxParticipants || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                              <div 
                                className={`${getProgressBarColor(fillPercentage)} h-2 rounded-full transition-all`}
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-800">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Revenue</span>
                              <span className="text-lg font-bold text-white">
                                ₹{revenueValue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-4 mt-auto">
                          {/* Scan Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/scan-tickets?eventId=${event._id}`);
                            }}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>Scan</span>
                          </button>

                          {/* Analytics Button - For events with bookings */}
                          {event.currentParticipants > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizer/events/${event._id}/analytics`);
                              }}
                              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span>Analytics</span>
                            </button>
                          )}

                          {/* Copy Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyEvent(event);
                            }}
                            className="p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                            title="Copy Event Details"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                          );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carousel Indicators - desktop only */}
            {currentEvents.length > 1 && (
              <div className="hidden md:flex justify-center mt-6 space-x-2">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === carouselIndex ? 'w-8' : 'w-2'
                    }`}
                    style={idx === carouselIndex ? {
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    } : { background: '#374151' }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Carousel for Other Tabs */
          <div className="relative">
            {/* Mobile: Horizontal Scroll */}
            <div 
              className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {currentEvents.map((event) => {
                const fillPercentage = event.maxParticipants > 0 
                  ? Math.round(((event.currentParticipants || 0) / event.maxParticipants) * 100)
                  : 0;
                const statusBadge = getStatusBadge(event.date);
                const revenueValue = event.revenue || 0;

                return (
                  <div
                    key={event._id}
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col cursor-pointer"
                  >
                    {/* Event Header */}
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 
                          className="font-bold text-white text-lg flex-1 line-clamp-2"
                          style={{ fontFamily: 'Oswald, sans-serif' }}
                        >
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium flex-shrink-0`}>
                            {statusBadge.text}
                          </span>
                          {event.status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/edit-event/${event._id}`);
                              }}
                              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                              title="Edit Event"
                            >
                              <Edit className="h-4 w-4 text-gray-400 hover:text-white" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{new Date(event.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time || '7:00 PM - 10:00 PM'}</span>
                        </div>
                      </div>

                      {/* Bookings & Revenue */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Bookings</span>
                            <span className="text-white font-bold">
                              {event.currentParticipants || 0}/{event.maxParticipants || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div 
                              className={`${getProgressBarColor(fillPercentage)} h-2 rounded-full transition-all`}
                              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Revenue</span>
                            <span className="text-lg font-bold text-white">
                              ₹{revenueValue.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-4 mt-auto">
                        {/* Scan Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scan-tickets?eventId=${event._id}`);
                          }}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>Scan</span>
                        </button>

                        {/* Analytics Button - For events with bookings */}
                        {event.currentParticipants > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/organizer/events/${event._id}/analytics`);
                            }}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Analytics</span>
                          </button>
                        )}

                        {/* Copy Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyEvent(event);
                          }}
                          className="p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                          title="Copy Event Details"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Carousel Container */}
            <div className="hidden md:block overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${carouselIndex * 100}%)`
                }}
              >
                {Array.from({ length: Math.ceil(currentEvents.length / cardsPerView) }).map((_, pageIndex) => (
                  <div 
                    key={pageIndex} 
                    className="grid grid-cols-4 gap-4 flex-shrink-0 w-full"
                  >
                    {currentEvents.slice(pageIndex * cardsPerView, (pageIndex + 1) * cardsPerView).map((event) => {
                      const fillPercentage = event.maxParticipants > 0 
                        ? Math.round(((event.currentParticipants || 0) / event.maxParticipants) * 100)
                        : 0;
                      const statusBadge = getStatusBadge(event.date);

                      const revenueValue = event.revenue || 0;

                      return (
                        <div
                          key={event._id}
                          onClick={() => navigate(`/events/${event._id}`)}
                          className="bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col cursor-pointer"
                        >
                      {/* Event Header */}
                      <div className="p-4 flex flex-col flex-grow h-full">
                        <div className="flex items-start justify-between mb-3">
                          <h3 
                            className="font-bold text-white text-lg flex-1 line-clamp-2"
                            style={{ fontFamily: 'Oswald, sans-serif' }}
                          >
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium flex-shrink-0`}>
                              {statusBadge.text}
                            </span>
                            {event.status !== 'completed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/edit-event/${event._id}`);
                                }}
                                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                                title="Edit Event"
                              >
                                <Edit className="h-4 w-4 text-gray-400 hover:text-white" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(event.date).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time || '7:00 PM - 10:00 PM'}</span>
                          </div>
                        </div>

                        {/* Bookings & Revenue */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-400">Bookings</span>
                              <span className="text-white font-bold">
                                {event.currentParticipants || 0}/{event.maxParticipants || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                              <div 
                                className={`${getProgressBarColor(fillPercentage)} h-2 rounded-full transition-all`}
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-800">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Revenue</span>
                              <span className="text-lg font-bold text-white">
                                ₹{revenueValue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-4 mt-auto">
                          {/* Scan Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/scan-tickets?eventId=${event._id}`);
                            }}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>Scan</span>
                          </button>

                          {/* Analytics Button - For events with bookings */}
                          {event.currentParticipants > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizer/events/${event._id}/analytics`);
                              }}
                              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span>Analytics</span>
                            </button>
                          )}

                          {/* Copy Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyEvent(event);
                            }}
                            className="p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                            title="Copy Event Details"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                      })}
                    </div>
                  ))}
                </div>
              </div>

            {/* Carousel Indicators - desktop only */}
            {currentEvents.length > 1 && (
              <div className="hidden md:flex justify-center mt-6 space-x-2">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === carouselIndex ? 'w-8' : 'w-2'
                    }`}
                    style={idx === carouselIndex ? {
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    } : { background: '#374151' }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleDuplicateEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/organizer/events/${eventId}/duplicate`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error duplicating event:', error);
    }
  };

  const handleCopyEvent = async (event) => {
    try {
      const eventDetails = `
Event: ${event.title}
Date: ${new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
Time: ${event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time || '7:00 PM - 10:00 PM'}
Location: ${event.location?.address || ''}, ${event.location?.city || ''}
Capacity: ${event.maxParticipants || '0'}
Price: ₹${event.price?.amount || 0}
Description: ${event.description || ''}
Categories: ${event.categories?.join(', ') || 'N/A'}
      `.trim();
      
      await navigator.clipboard.writeText(eventDetails);
      
      // Show success feedback (you can replace with a toast notification if available)
      const btn = document.activeElement;
      const originalTitle = btn.getAttribute('title');
      btn.setAttribute('title', 'Copied!');
      setTimeout(() => {
        btn.setAttribute('title', originalTitle || 'Copy Event Details');
      }, 2000);
    } catch (error) {
      console.error('Error copying event details:', error);
      alert('Failed to copy event details');
    }
  };

  // ==================== MANAGE COLLABORATIONS SECTION ====================
  const ManageCollaborationsSection = () => {
    const currentCollabs = collaborations[activeCollabTab] || [];
    const cardsPerView = 4;
    const maxIndex = Math.max(0, Math.ceil(currentCollabs.length / cardsPerView) - 1);

    const handlePrevious = () => {
      setCollabCarouselIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
      setCollabCarouselIndex(prev => Math.min(maxIndex, prev + 1));
    };

    const getStatusBadge = (status) => {
      const badges = {
        submitted: { text: 'Submitted', bg: 'bg-yellow-600' },
        admin_approved: { text: 'Approved', bg: 'bg-blue-600' },
        vendor_accepted: { text: 'Accepted', bg: 'bg-green-600' },
        accepted: { text: 'Accepted', bg: 'bg-green-600' },
        confirmed: { text: 'Live', bg: 'bg-green-600' },
        approved_delivered: { text: 'Live', bg: 'bg-green-600' },
        completed: { text: 'Completed', bg: 'bg-gray-600' },
        rejected: { text: 'Rejected', bg: 'bg-red-600' },
        vendor_rejected: { text: 'Rejected', bg: 'bg-red-600' },
        cancelled: { text: 'Cancelled', bg: 'bg-gray-600' },
        pending: { text: 'Pending', bg: 'bg-yellow-600' }
      };
      return badges[status] || { text: status, bg: 'bg-gray-600' };
    };

    const getCollaborationType = (collab) => {
      if (collab.requestDetails?.venueRequest) return { text: 'Venue', color: 'bg-purple-600' };
      if (collab.requestDetails?.brandSponsorship) {
        const types = collab.requestDetails.brandSponsorship.sponsorshipType || [];
        if (types.includes('sampling')) return { text: 'Sampling', color: 'bg-green-600' };
        if (types.includes('paid_monetary')) return { text: 'Sponsorship', color: 'bg-blue-600' };
        return { text: 'Brand', color: 'bg-blue-600' };
      }
      return { text: 'Partnership', color: 'bg-indigo-600' };
    };

    const getPartnerInfo = (collab) => {
      const currentUserId = user?.userId || user?._id;
      // Check if current user is initiator or recipient
      const isInitiator = collab.initiator?.user?.toString() === currentUserId?.toString() || 
                          collab.proposerId?.toString() === currentUserId?.toString();
      
      if (isInitiator) {
        return {
          name: collab.recipient?.name || 'Partner',
          location: collab.requestDetails?.venueRequest?.location || 'Location N/A',
          type: collab.recipient?.userType || collab.recipientType || 'Partner'
        };
      } else {
        return {
          name: collab.initiator?.name || 'Partner',
          location: collab.requestDetails?.venueRequest?.location || 'Location N/A',
          type: collab.initiator?.userType || collab.proposerType || 'Partner'
        };
      }
    };

    return (
      <div>
        {/* Tabs and Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          {/* Tabs */}
          <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 pb-2 sm:pb-0">
              {[
                { key: 'all', label: 'All' },
                { key: 'upcoming', label: `Upcoming (${collaborations.upcoming?.length || 0})` },
                { key: 'live', label: `Live (${collaborations.live?.length || 0})` },
                { key: 'completed', label: `Completed (${collaborations.completed?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCollabTab(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeCollabTab === tab.key
                      ? 'bg-white dark:bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Carousel Navigation */}
            {currentCollabs.length > cardsPerView && (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={collabCarouselIndex === 0}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={collabCarouselIndex === maxIndex}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/collaborations')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black px-6 py-2 rounded-md font-medium transition-all hover:bg-gray-100"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              <FileText className="h-5 w-5" />
              <span>Manage Collaborations</span>
            </button>
          </div>
        </div>

        {/* Collaborations Display */}
        {currentCollabs.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No {activeCollabTab} collaborations
            </h3>
            <p className="text-gray-400 mb-4">
              {activeCollabTab === 'upcoming' 
                ? 'No upcoming collaborations at the moment'
                : activeCollabTab === 'live'
                ? 'No active collaborations'
                : activeCollabTab === 'completed'
                ? 'No completed collaborations to show'
                : 'No collaborations yet'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Mobile: Horizontal Scroll */}
            <div 
              className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {currentCollabs.map((collab) => {
                const statusBadge = getStatusBadge(collab.status);
                const collabType = getCollaborationType(collab);
                const partner = getPartnerInfo(collab);

                return (
                  <div
                    key={collab._id}
                    className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col"
                  >
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 
                          className="font-bold text-white text-lg flex-1 line-clamp-2"
                          style={{ fontFamily: 'Oswald, sans-serif' }}
                        >
                          {collab.requestDetails?.eventName || 'Collaboration Request'}
                        </h3>
                        <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0`}>
                          {statusBadge.text}
                        </span>
                      </div>

                      {/* Partner Info */}
                      <div className="text-sm text-gray-400 mb-3">
                        {partner.name}
                      </div>

                      {/* Location & Type */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <Building2 className="h-4 w-4 mr-2" />
                          <span>{partner.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Music & Social</span>
                        </div>
                      </div>

                      {/* Collaboration Type & Date */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Collaboration Type</span>
                          <span className={`${collabType.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                            {collabType.text}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                          <span className="text-sm text-gray-400">Event Date</span>
                          <span className="text-sm text-white font-medium">
                            {collab.requestDetails?.eventDate 
                              ? new Date(collab.requestDetails.eventDate).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })
                              : 'Date TBD'}
                          </span>
                        </div>

                        {collab.requestDetails?.venueRequest?.expectedAttendees && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Est. Attendees</span>
                            <span className="text-sm text-white font-medium">
                              {collab.requestDetails.venueRequest.expectedAttendees}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-auto">
                        <button
                          onClick={() => navigate(`/collaborations/${collab._id}`)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => navigate(`/collaborations/${collab._id}/contact`)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          <Users className="h-4 w-4" />
                          <span>Contact</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Carousel Container */}
            <div className="hidden md:block overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${collabCarouselIndex * 100}%)`
                }}
              >
                {Array.from({ length: Math.ceil(currentCollabs.length / cardsPerView) }).map((_, pageIndex) => (
                  <div 
                    key={pageIndex} 
                    className="grid grid-cols-4 gap-4 flex-shrink-0 w-full"
                  >
                    {currentCollabs.slice(pageIndex * cardsPerView, (pageIndex + 1) * cardsPerView).map((collab) => {
                      const statusBadge = getStatusBadge(collab.status);
                      const collabType = getCollaborationType(collab);
                      const partner = getPartnerInfo(collab);

                      return (
                        <div
                          key={collab._id}
                          className="bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col"
                        >
                          <div className="p-4 flex flex-col flex-grow h-full">
                            <div className="flex items-start justify-between mb-3">
                              <h3 
                                className="font-bold text-white text-lg flex-1 line-clamp-2"
                                style={{ fontFamily: 'Oswald, sans-serif' }}
                              >
                                {collab.requestDetails?.eventName || 'Collaboration Request'}
                              </h3>
                              <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0`}>
                                {statusBadge.text}
                              </span>
                            </div>

                            {/* Partner Info */}
                            <div className="text-sm text-gray-400 mb-3">
                              {partner.name}
                            </div>

                            {/* Location & Type */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-400">
                                <Building2 className="h-4 w-4 mr-2" />
                                <span>{partner.location}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-400">
                                <Users className="h-4 w-4 mr-2" />
                                <span>Music & Social</span>
                              </div>
                            </div>

                            {/* Collaboration Type & Date */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Collaboration Type</span>
                                <span className={`${collabType.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                                  {collabType.text}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                                <span className="text-sm text-gray-400">Event Date</span>
                                <span className="text-sm text-white font-medium">
                                  {collab.requestDetails?.eventDate 
                                    ? new Date(collab.requestDetails.eventDate).toLocaleDateString('en-IN', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })
                                    : 'Date TBD'}
                                </span>
                              </div>

                              {collab.requestDetails?.venueRequest?.expectedAttendees && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-400">Est. Attendees</span>
                                  <span className="text-sm text-white font-medium">
                                    {collab.requestDetails.venueRequest.expectedAttendees}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-auto">
                              <button
                                onClick={() => navigate(`/collaborations/${collab._id}`)}
                                className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => navigate(`/collaborations/${collab._id}/contact`)}
                                className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                              >
                                <Users className="h-4 w-4" />
                                <span>Contact</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Indicators - desktop only */}
            {currentCollabs.length > 1 && (
              <div className="hidden md:flex justify-center mt-6 space-x-2">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCollabCarouselIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === collabCarouselIndex ? 'w-8' : 'w-2'
                    }`}
                    style={idx === collabCarouselIndex ? {
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    } : { background: '#374151' }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== EARNINGS OVERVIEW SECTION ====================
  const EarningsSection = () => {
    return (
      <div>
        {/* Desktop Grid */}
        <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                Total Earnings
              </h3>
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
              ₹{earnings.totalLifetime?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">Lifetime via IndulgeOut</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                This Month
              </h3>
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              ₹{earnings.thisMonth?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {earnings.monthGrowth ? (
                <span className="flex items-center">
                  {earnings.monthGrowth > 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{earnings.monthGrowth}% from last month
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      {earnings.monthGrowth}% from last month
                    </>
                  )}
                </span>
              ) : 'First month earnings'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Pending Payout
              </h3>
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mb-1">
              ₹{earnings.pendingPayout?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {earnings.nextPayoutDate 
                ? `Next payout: ${new Date(earnings.nextPayoutDate).toLocaleDateString('en-IN')}`
                : 'Processing...'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Last Payout
              </h3>
              <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              ₹{earnings.lastPayoutAmount?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {earnings.lastPayoutDate 
                ? new Date(earnings.lastPayoutDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })
                : 'No payouts yet'}
            </p>
          </div>
        </div>

        {/* Mobile Carousel */}
        <div 
          className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                Total Earnings
              </h3>
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
              ₹{earnings.totalLifetime?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">Lifetime via IndulgeOut</p>
          </div>

          <div className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                This Month
              </h3>
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              ₹{earnings.thisMonth?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {earnings.monthGrowth ? (
                <span className="flex items-center">
                  {earnings.monthGrowth > 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{earnings.monthGrowth}% from last month
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      {earnings.monthGrowth}% from last month
                    </>
                  )}
                </span>
              ) : 'First month earnings'}
            </p>
          </div>

          <div className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Pending Payout
              </h3>
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mb-1">
              ₹{earnings.pendingPayout?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {earnings.nextPayoutDate 
                ? `Next payout: ${new Date(earnings.nextPayoutDate).toLocaleDateString('en-IN')}`
                : 'Processing...'}
            </p>
          </div>

          <div className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Last Payout
              </h3>
              <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              ₹{earnings.lastPayoutAmount?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {earnings.lastPayoutDate 
                ? new Date(earnings.lastPayoutDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })
                : 'No payouts yet'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ==================== ANALYTICS SECTION ====================
  const AnalyticsSection = () => {
    const hasAnalyticsData = analytics.totalViews > 0 || analytics.totalBookings > 0;
    const dateRangeLabel = {
      '7days': 'Last 7 days',
      '30days': 'Last 30 days',
      '90days': 'Last 90 days',
      'all': 'All time'
    }[selectedDateRange] || 'Last 30 days';

    return (
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Event Performance
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* No Data Message */}
        {!hasAnalyticsData && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <BarChart3 className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
              No Analytics Data Available
            </h3>
            <p className="text-blue-700 dark:text-blue-300">
              Analytics data for {dateRangeLabel.toLowerCase()} is not available yet. Data will appear once users start viewing and booking your events.
            </p>
          </div>
        )}

        {/* Key Metrics */}
        {/* Desktop Grid */}
        <div className="hidden md:grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Views', value: analytics.totalViews || 0, icon: Eye, color: 'blue' },
            { label: 'Total Bookings', value: analytics.totalBookings || 0, icon: Users, color: 'green' },
            { label: 'Avg Fill Rate', value: `${analytics.avgFillRate || 0}%`, icon: Target, color: 'yellow' },
            { label: 'Conversion Rate', value: `${analytics.conversionRate || 0}%`, icon: TrendingUp, color: 'purple' }
          ].map((metric) => (
            <div key={metric.label} className="bg-zinc-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{metric.label}</span>
                <metric.icon className={`h-5 w-5 text-${metric.color}-400`} />
              </div>
              <p className="text-2xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { label: 'Total Views', value: analytics.totalViews || 0, icon: Eye, color: 'blue' },
            { label: 'Total Bookings', value: analytics.totalBookings || 0, icon: Users, color: 'green' },
            { label: 'Avg Fill Rate', value: `${analytics.avgFillRate || 0}%`, icon: Target, color: 'yellow' },
            { label: 'Conversion Rate', value: `${analytics.conversionRate || 0}%`, icon: TrendingUp, color: 'purple' }
          ].map((metric) => (
            <div key={metric.label} className="bg-zinc-900 border border-gray-700 rounded-lg p-4 flex-shrink-0 w-[calc(100vw-3rem)] snap-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{metric.label}</span>
                <metric.icon className={`h-5 w-5 text-${metric.color}-400`} />
              </div>
              <p className="text-2xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Per Event Analytics */}
        {analytics.eventBreakdown && analytics.eventBreakdown.length > 0 && (
          <div className="bg-zinc-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h4 className="font-semibold text-white">Event Breakdown</h4>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <table className="w-full min-w-[800px]">
                <thead className="bg-black sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bookings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fill %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Conversion</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {analytics.eventBreakdown.map((event) => {
                    // Calculate retention rate (example: bookings / views * 100)
                    const retentionRate = event.views > 0 
                      ? ((event.bookings / event.views) * 100).toFixed(1)
                      : 0;
                    
                    return (
                      <tr key={event.eventId} className="hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-white whitespace-nowrap">
                          {event.eventName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {event.views}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {event.bookings}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className={`font-medium ${
                            event.fillPercentage >= 80 ? 'text-green-400' :
                            event.fillPercentage >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {event.fillPercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {event.conversionRate}%
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className={`font-medium ${
                            retentionRate >= 15 ? 'text-green-400' :
                            retentionRate >= 5 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {retentionRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== INSIGHTS & RECOMMENDATIONS SECTION ====================
  const InsightsSection = () => {
    return (
      <div className="space-y-6">
        {/* Performance Insights */}
        {/* Desktop Grid */}
        <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.recommendations?.map((insight, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div 
          className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {insights.recommendations?.map((insight, index) => (
            <div
              key={index}
              className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Community Stats */}
        {insights.communityStats && (
          <div className="bg-black dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Your Community at a Glance</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                  {insights.communityStats.repeatAttendeePercentage}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Repeat Attendees</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                  {insights.communityStats.avgEventSize}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Event Size</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                  {insights.communityStats.bestDay}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Best Day</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black overflow-x-hidden">
      {/* Navigation Bar */}
      <NavigationBar />
      
      <div className="flex overflow-x-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:block w-20 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-gray-800 min-h-screen pt-8">
          <nav className="flex flex-col items-center space-y-6">
            {/* All */}
            <button
              onClick={() => setActiveSidebarItem('all')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'all'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              style={activeSidebarItem === 'all' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="All"
            >
              <Grid className="h-6 w-6" />
              <span className="text-xs font-medium">All</span>
            </button>

            {/* Actions Required */}
            <button
              onClick={() => setActiveSidebarItem('actions')}
              className={`relative flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'actions'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              style={activeSidebarItem === 'actions' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="Actions Required"
            >
              {actionItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {actionItems.length}
                </span>
              )}
              <Bell className="h-6 w-6" />
              <span className="text-xs font-medium">Actions <br /> Required</span>
            </button>

            {/* Events */}
            <button
              onClick={() => setActiveSidebarItem('events')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'events'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              style={activeSidebarItem === 'events' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="Events"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-xs font-medium">Events</span>
            </button>

            {/* Collaborations */}
            <button
              onClick={() => setActiveSidebarItem('collaborations')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'collaborations'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              style={activeSidebarItem === 'collaborations' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="Collaborations"
            >
              <Users2 className="h-6 w-6" />
              <span className="text-xs font-medium">Collaborations</span>
            </button>

            {/* Analytics */}
            <button
              onClick={() => setActiveSidebarItem('analytics')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'analytics'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              style={activeSidebarItem === 'analytics' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="Analytics"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-xs font-medium">Analytics</span>
            </button>

          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 max-w-full">
              <div className="flex items-center justify-between mb-4 max-w-full">
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 truncate"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Welcome back, {user?.communityProfile?.communityName || user?.name}!
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Here's what's happening with your events
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Sections */}
            <div className="space-y-8">
              {/* Conditionally render sections based on sidebar selection */}
              {console.log('🎨 [Render] Checking condition for Actions Required section:')}
              {console.log('  - activeSidebarItem:', activeSidebarItem)}
              {console.log('  - actionItems.length:', actionItems.length)}
              {console.log('  - Condition result:', (activeSidebarItem === 'all' || activeSidebarItem === 'actions') && actionItems.length > 0)}
              {(activeSidebarItem === 'all' || activeSidebarItem === 'actions') && actionItems.length > 0 && (
                <section>
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    <h2 
                      className="text-xl font-bold text-gray-900 dark:text-white"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      Action Required
                    </h2>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                      {actionItems.length}
                    </span>
                  </div>
                  <ActionRequiredSection />
                </section>
              )}

              {(activeSidebarItem === 'all' || activeSidebarItem === 'events') && (
                <section>
                  <h2 
                    className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Manage Events
                  </h2>
                  <ManageEventsSection />
                </section>
              )}

              {(activeSidebarItem === 'all' || activeSidebarItem === 'events' || activeSidebarItem === 'collaborations') && (
                <section>
                  <h2 
                    className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Collaborations
                  </h2>
                  <ManageCollaborationsSection />
                </section>
              )}

              {activeSidebarItem === 'all' && (
                <>
                  <section>
                    <h2 
                      className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      Earnings Overview
                    </h2>
                    <EarningsSection />
                  </section>

                  <section>
                    <h2 
                      className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      Analytics
                    </h2>
                    <AnalyticsSection />
                  </section>

                  <section>
                    <h2 
                      className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      Insights & Recommendations
                    </h2>
                    <InsightsSection />
                  </section>
                </>
              )}

              {activeSidebarItem === 'analytics' && (
                <section>
                  <h2 
                    className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Analytics
                  </h2>
                  <AnalyticsSection />
                </section>
              )}

              {activeSidebarItem === 'settings' && (
                <section>
                  <h2 
                    className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Settings
                  </h2>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">Settings page coming soon...</p>
                  </div>
                </section>
              )}

              {activeSidebarItem === 'help' && (
                <section>
                  <h2 
                    className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Help & Support
                  </h2>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">Help page coming soon...</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityOrganizerDashboard;

