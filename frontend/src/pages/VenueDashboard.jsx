import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Calendar, Users, TrendingUp, Clock,
  MapPin, Star, ArrowRight, CheckCircle, DollarSign,
  Briefcase, Image, FileText, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { api } from '../config/api';

const VenueDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'host_partner' || user.hostPartnerType !== 'venue') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/venues/dashboard');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching venue dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionType, itemId) => {
    switch (actionType) {
      case 'collaboration_request':
        navigate(`/organizer/collaborations?id=${itemId}`);
        break;
      case 'profile_incomplete':
        navigate('/profile');
        break;
      case 'missing_photos':
        navigate('/profile?section=photos');
        break;
      case 'pending_confirmation':
        navigate(`/organizer/collaborations?id=${itemId}`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const { actionsRequired, upcomingEvents, performance, insights } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Venue Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.venueProfile?.venueName || 'Partner'}
          </p>
        </div>

        {/* Actions Required Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertCircle className="h-6 w-6 text-orange-500 mr-2" />
            Actions Required
          </h2>

          {actionsRequired && actionsRequired.length > 0 ? (
            <div className="space-y-3">
              {actionsRequired.map((action, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-orange-500 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded">
                          {action.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {action.priority === 'high' && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            • High Priority
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {action.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick(action.type, action.itemId)}
                      className="ml-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 whitespace-nowrap"
                    >
                      <span>{action.ctaText || 'Take Action'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                You're all set. Your venue is visible to organizers.
              </p>
            </div>
          )}
        </div>

        {/* Performance Snapshot */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Performance Snapshot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Events */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {performance?.totalEvents || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Events Hosted
              </p>
            </div>

            {/* Total Earnings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₹{(performance?.totalEarnings || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Earnings (Lifetime)
              </p>
            </div>

            {/* This Month Earnings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₹{(performance?.monthlyEarnings || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Earnings This Month
              </p>
            </div>

            {/* Avg Attendance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {performance?.avgAttendance || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Avg Attendance per Event
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Events at Your Venue
          </h2>

          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {event.eventName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {event.organizerName}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                      {event.eventType}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      {event.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4 mr-2" />
                      Expected: {event.expectedAttendance} attendees
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Upcoming Events
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                IndulgeOut is bringing activity into your space. Check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* What's Working */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              What's Working
            </h3>
            {insights?.working && insights.working.length > 0 ? (
              <div className="space-y-3">
                {insights.working.map((insight, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <p className="text-sm text-green-800 dark:text-green-300">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Host more events to unlock insights about what works best at your venue.
              </p>
            )}
          </div>

          {/* Suggestions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              Suggestions
            </h3>
            {insights?.suggestions && insights.suggestions.length > 0 ? (
              <div className="space-y-3">
                {insights.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We'll provide personalized suggestions as you host more events.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDashboard;
