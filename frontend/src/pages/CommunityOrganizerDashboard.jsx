import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, TrendingUp, AlertCircle, DollarSign, Users, 
  Eye, Target, Clock, ChevronRight, Plus, Edit, Copy,
  CheckCircle, XCircle, AlertTriangle, BarChart3, 
  ArrowUpRight, ArrowDownRight, Filter, Download, Bell,
  Building2, Sparkles, QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { api } from '../config/api';
import { CATEGORY_ICONS } from '../constants/eventConstants';

const CommunityOrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('draft'); // draft, live, past
  const [selectedDateRange, setSelectedDateRange] = useState('30days');
  
  // Dashboard Data States
  const [actionItems, setActionItems] = useState([]);
  const [events, setEvents] = useState({ draft: [], live: [], past: [] });
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
      const [actionRes, eventsRes, earningsRes, analyticsRes, insightsRes] = await Promise.all([
        api.get('/organizer/action-required'),
        api.get('/organizer/events'),
        api.get('/organizer/earnings'),
        api.get('/organizer/analytics', {
          params: { dateRange: selectedDateRange }
        }),
        api.get('/organizer/insights')
      ]);

      setActionItems(actionRes.data);
      setEvents(eventsRes.data);
      setEarnings(earningsRes.data);
      setAnalytics(analyticsRes.data);
      setInsights(insightsRes.data);
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
      <div className="space-y-3">
        {actionItems.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 ${getActionColor(item.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-lg ${
                  item.priority === 'high' ? 'text-red-600 bg-red-100 dark:bg-red-900/40' :
                  item.priority === 'medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40' :
                  'text-blue-600 bg-blue-100 dark:bg-blue-900/40'
                }`}>
                  {getActionIcon(item.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {item.description}
                  </p>
                  {item.metadata && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      {item.metadata.eventName && (
                        <div>Event: <span className="font-medium">{item.metadata.eventName}</span></div>
                      )}
                      {item.metadata.daysUntil && (
                        <div>Time left: <span className="font-medium">{item.metadata.daysUntil} days</span></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleActionClick(item)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    item.priority === 'high' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : item.priority === 'medium'
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {item.ctaText || 'Fix Now'}
                </button>
              </div>
            </div>
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
        navigate('/organizer/settings/payout');
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
    const currentEvents = events[activeTab] || [];
    const [imageErrors, setImageErrors] = useState({});

    const getCategoryIcon = (event) => {
      const category = event.categories?.[0] || event.category;
      
      if (category) {
        // Try exact match first
        if (CATEGORY_ICONS[category]) {
          return CATEGORY_ICONS[category];
        }
        
        // Try case-insensitive match
        const categoryKey = Object.keys(CATEGORY_ICONS).find(
          key => key.toLowerCase() === category.toLowerCase()
        );
        
        if (categoryKey) {
          return CATEGORY_ICONS[categoryKey];
        }
      }
      
      // Default fallback
      return '🎉';
    };

    const handleImageError = (eventId) => {
      setImageErrors(prev => ({ ...prev, [eventId]: true }));
    };

    const getStatusBadge = (status) => {
      const badges = {
        draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        live: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
        completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
      };
      return badges[status] || badges.draft;
    };

    const getFillColor = (fillPercentage) => {
      if (fillPercentage >= 80) return 'text-green-600 dark:text-green-400';
      if (fillPercentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    return (
      <div>
        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'draft', label: 'Draft', count: events.draft?.length || 0 },
              { key: 'live', label: 'Live', count: events.live?.length || 0 },
              { key: 'past', label: 'Past', count: events.past?.length || 0 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/create-event')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Events Grid */}
        {currentEvents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab} events
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeTab === 'draft' 
                ? 'Start by creating your first event'
                : activeTab === 'live'
                ? 'No live events at the moment'
                : 'No past events to show'}
            </p>
            {activeTab === 'draft' && (
              <button
                onClick={() => navigate('/create-event')}
                className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Event</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/events/${event._id}`)}
              >
                {/* Event Image */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                  {event.image && !imageErrors[event._id] ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(event._id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                      <span className="text-9xl">{getCategoryIcon(event)}</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {event.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    {activeTab !== 'draft' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{event.currentParticipants || 0} / {event.maxParticipants}</span>
                        </div>
                        <span className={`font-medium ${getFillColor(event.fillPercentage || 0)}`}>
                          {event.fillPercentage || 0}% filled
                        </span>
                      </div>
                    )}
                    {activeTab === 'past' && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ₹{event.revenue?.toLocaleString('en-IN') || 0}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Show Analytics & Scan for live/past events with participants */}
                    {(activeTab === 'live' || activeTab === 'past') && event.currentParticipants > 0 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organizer/events/${event._id}/analytics`);
                          }}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                          title="View Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>Analytics</span>
                        </button>
                        {activeTab === 'live' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/scan-tickets?eventId=${event._id}`);
                            }}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-colors"
                            title="Scan Tickets"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>Scan</span>
                          </button>
                        )}
                      </>
                    )}
                    {/* Edit button - only show for draft and live events, not past events */}
                    {activeTab !== 'past' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-event/${event._id}`);
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateEvent(event._id);
                      }}
                      className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      title="Duplicate event"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

  // ==================== EARNINGS OVERVIEW SECTION ====================
  const EarningsSection = () => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Views', value: analytics.totalViews || 0, icon: Eye, color: 'blue' },
            { label: 'Total Bookings', value: analytics.totalBookings || 0, icon: Users, color: 'green' },
            { label: 'Avg Fill Rate', value: `${analytics.avgFillRate || 0}%`, icon: Target, color: 'yellow' },
            { label: 'Conversion Rate', value: `${analytics.conversionRate || 0}%`, icon: TrendingUp, color: 'purple' }
          ].map((metric) => (
            <div key={metric.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                <metric.icon className={`h-5 w-5 text-${metric.color}-600 dark:text-${metric.color}-400`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Per Event Analytics */}
        {analytics.eventBreakdown && analytics.eventBreakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white">Event Breakdown</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-black">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Views</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bookings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fill %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analytics.eventBreakdown.map((event) => (
                    <tr key={event.eventId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {event.eventName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {event.views}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {event.bookings}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${
                          event.fillPercentage >= 80 ? 'text-green-600' :
                          event.fillPercentage >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {event.fillPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {event.conversionRate}%
                      </td>
                    </tr>
                  ))}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.recommendations?.map((insight, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6"
            >
              <div className="flex items-start space-x-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
              {insight.action && (
                <button
                  onClick={() => navigate(insight.actionLink)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <span>{insight.action}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Community Stats */}
        {insights.communityStats && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
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
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Navigation Bar */}
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.communityProfile?.communityName || user?.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your events
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notification Icon - Static for now */}
            <button
              className="relative p-3 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              title="Notifications (Coming Soon)"
            >
              <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              {/* Notification badge - uncomment when implementing */}
              {/* <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span> */}
            </button>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="space-y-8">
          {/* 1. Action Required */}
          {actionItems.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Action Required
                </h2>
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                  {actionItems.length}
                </span>
              </div>
              <ActionRequiredSection />
            </section>
          )}

          {/* 2. Manage Events */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Manage Events
            </h2>
            <ManageEventsSection />
          </section>

          {/* 3. Earnings Overview */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Earnings Overview
            </h2>
            <EarningsSection />
          </section>

          {/* 4. Event Analytics */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Analytics
            </h2>
            <AnalyticsSection />
          </section>

          {/* 5. Community Insights */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Insights & Recommendations
            </h2>
            <InsightsSection />
          </section>
        </div>
      </div>
    </div>
  );
};

export default CommunityOrganizerDashboard;

