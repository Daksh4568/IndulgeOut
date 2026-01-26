import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, TrendingUp, Users, MapPin, Calendar,
  CheckCircle, ArrowRight, Star, Briefcase, Eye, Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { api } from '../config/api';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'host_partner' || user.hostPartnerType !== 'brand_sponsor') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brands/dashboard');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching brand dashboard:', err);
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
      case 'pending_approval':
        navigate(`/organizer/collaborations?id=${itemId}`);
        break;
      case 'clarification_requested':
        navigate(`/organizer/collaborations?id=${itemId}`);
        break;
      case 'feedback_pending':
        navigate(`/feedback/${itemId}`);
        break;
      case 'missing_deliverables':
        navigate('/profile?section=deliverables');
        break;
      default:
        break;
    }
  };

  const getCollaborationTypeColor = (type) => {
    const colors = {
      sponsorship: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      sampling: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      popup: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      cohosted: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      live: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      completed: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' }
    };
    const badge = badges[status] || badges.upcoming;
    return `${badge.bg} ${badge.text}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const { actionsRequired, activeCollaborations, performance, insights } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Brand Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.brandProfile?.brandName || 'Partner'}
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
                You're all set. Your brand is ready for collaborations.
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
            {/* Total Collaborations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {performance?.totalCollaborations || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Collaborations
              </p>
            </div>

            {/* Cities Reached */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {performance?.citiesReached || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cities Reached
              </p>
            </div>

            {/* Total Footfall */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(performance?.totalFootfall || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Estimated Total Footfall
              </p>
            </div>

            {/* Avg Engagement */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {performance?.avgEngagement || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Avg Footfall per Event
              </p>
            </div>
          </div>
        </div>

        {/* Active Collaborations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Active Collaborations
          </h2>

          {activeCollaborations && activeCollaborations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCollaborations.map((collab) => (
                <div
                  key={collab._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {collab.eventName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        with {collab.communityName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(collab.status)}`}>
                      {collab.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {collab.city} • {collab.category}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(collab.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCollaborationTypeColor(collab.type)}`}>
                      {collab.type.toUpperCase()}
                    </span>
                    <button
                      onClick={() => navigate(`/organizer/collaborations?id=${collab._id}`)}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Active Collaborations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start collaborating with communities to activate your brand.
              </p>
              <button
                onClick={() => navigate('/browse/communities')}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Browse Communities
              </button>
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
                Complete more collaborations to unlock insights about what works best for your brand.
              </p>
            )}
          </div>

          {/* Event-Level Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              Recent Performance
            </h3>
            {insights?.recentEvents && insights.recentEvents.length > 0 ? (
              <div className="space-y-3">
                {insights.recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {event.name}
                      </p>
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        {event.category}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{event.attendees} attendees</span>
                      <span className="mx-2">•</span>
                      <span>{event.visibilityType}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Event performance data will appear here after your first collaboration.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDashboard;

