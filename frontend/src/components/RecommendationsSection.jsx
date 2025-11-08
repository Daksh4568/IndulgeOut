import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Star, RefreshCw, ChevronRight, Heart } from 'lucide-react';
import { CATEGORY_ICONS } from '../constants/eventConstants';
import API_BASE_URL from '../config/api.js';

const RecommendationsSection = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/api/recommendations/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const getCategoryIcon = (categories) => {
    if (!categories || categories.length === 0) return '🎉';
    return CATEGORY_ICONS[categories[0]] || '🎉';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.toLowerCase();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recommended for You
          </h2>
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recommended for You
          </h2>
          <button
            onClick={fetchRecommendations}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to load recommendations
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recommended for You
          </h2>
          <button
            onClick={fetchRecommendations}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">🎯</div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No recommendations yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Explore more events to get personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Recommended for You
        </h2>
        <button
          onClick={fetchRecommendations}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 4).map((rec) => (
          <div
            key={rec.event._id}
            onClick={() => handleEventClick(rec.event._id)}
            className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 cursor-pointer"
          >
            {/* Event Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
                {getCategoryIcon(rec.event.categories)}
              </div>
              {rec.matchPercentage && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                  {Math.round(rec.matchPercentage)}%
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {rec.event.title}
              </h3>
              
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(rec.event.date)} • {formatTime(rec.event.time)}</span>
                </div>
                
                {rec.event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {typeof rec.event.location === 'string' 
                        ? rec.event.location 
                        : rec.event.location.city || 'Location TBD'
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Tags and Price */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {rec.event.categories && rec.event.categories.slice(0, 2).map((category, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  {rec.event.price && rec.event.price.amount > 0 ? (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{rec.event.price.amount}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      FREE
                    </span>
                  )}
                </div>
              </div>

              {/* Reason for recommendation */}
              {rec.reason && (
                <div className="mt-2 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-pink-500" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {rec.reason}
                  </span>
                </div>
              )}
            </div>

            {/* Arrow Icon */}
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* View All Button */}
      {recommendations.length > 4 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => navigate('/events')}
            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            View All Events
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;