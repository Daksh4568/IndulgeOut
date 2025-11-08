import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import { 
  BarChart3, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Users, 
  Star,
  Settings,
  RefreshCw
} from 'lucide-react';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/insights`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchAnalytics(), fetchInsights()]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-300 dark:bg-gray-600 h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="bg-gray-300 dark:bg-gray-600 h-96 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={`text-sm ${change.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your event preferences and discover personalized insights
            </p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'preferences', name: 'Preferences', icon: Star },
                { id: 'recommendations', name: 'Recommendations', icon: TrendingUp },
                { id: 'settings', name: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && insights && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Events Attended"
                value={insights.totalEventsAttended}
                icon={Calendar}
                color="blue"
              />
              <StatCard
                title="Favorite Categories"
                value={insights.favoriteCategories?.length || 0}
                icon={Star}
                color="yellow"
              />
              <StatCard
                title="Cities Visited"
                value={insights.mostVisitedCities?.length || 0}
                icon={MapPin}
                color="green"
              />
              <StatCard
                title="Monthly Average"
                value={Math.round(insights.attendancePattern?.averagePerMonth || 0)}
                icon={TrendingUp}
                color="purple"
              />
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Favorite Categories */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Categories
                </h3>
                {insights.favoriteCategories?.length > 0 ? (
                  <div className="space-y-3">
                    {insights.favoriteCategories.slice(0, 5).map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{category.category}</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min((category.score / 10) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {category.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Attend more events to see your category preferences!
                  </p>
                )}
              </div>

              {/* Most Visited Cities */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Favorite Locations
                </h3>
                {insights.mostVisitedCities?.length > 0 ? (
                  <div className="space-y-3">
                    {insights.mostVisitedCities.slice(0, 5).map((location, index) => (
                      <div key={location.city} className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 dark:text-gray-300">{location.city}</span>
                          {location.state && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                              , {location.state}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {location.frequency} events
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Attend events in different cities to see your location preferences!
                  </p>
                )}
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Monthly Activity
              </h3>
              {insights.monthlyActivity && (
                <div className="flex items-end space-x-2 h-40">
                  {insights.monthlyActivity.map((month, index) => (
                    <div key={month.month} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{
                          height: `${Math.max((month.events / Math.max(...insights.monthlyActivity.map(m => m.events))) * 120, 4)}px`
                        }}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {month.month}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {month.events}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && analytics && (
          <div className="space-y-8">
            {/* Recommendation Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recommendation Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analytics.recommendationMetrics.totalRecommendationsShown}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Shown</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(analytics.recommendationMetrics.clickThroughRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Click Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(analytics.recommendationMetrics.conversionRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
                </div>
              </div>
            </div>

            {/* Upcoming Recommendations */}
            {insights?.upcomingRecommendations && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Personalized for You
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.upcomingRecommendations.map((item) => (
                    <div key={item.event._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.event.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(item.event.date).toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          {Math.round(item.score * 100)}% match
                        </span>
                        <button
                          onClick={() => window.location.href = `/events/${item.event._id}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">Error loading analytics: {error}</p>
            <button
              onClick={refreshData}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;