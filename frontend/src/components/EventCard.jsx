import { MapPin, Calendar, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CATEGORY_ICONS } from '../constants/eventConstants';

const EventCard = ({ event, onFavorite, showLoginPrompt, isSaved = false }) => {
  const [isFavorited, setIsFavorited] = useState(isSaved);
  const [imageError, setImageError] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setIsFavorited(isSaved);
  }, [isSaved]);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onFavorite) {
      const result = await onFavorite(event._id);
      if (result !== false) {
        setIsFavorited(!isFavorited);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const isPastEvent = new Date(event.date) < new Date();

  const getPriceBadge = () => {
    if (event.price?.amount === 0) {
      return <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Free</span>;
    } else if (event.price?.amount) {
      return <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">${event.price.amount}</span>;
    }
    return null;
  };

  const getMoodEmoji = (mood) => {
    const moodMap = {
      'chill': '😌',
      'energetic': '⚡',
      'creative': '🎨',
      'social': '🎉',
      'adventure': '🏔️'
    };
    return moodMap[mood] || '🎉';
  };

  const getCategoryIcon = () => {
    // Handle both 'categories' array and 'category' string
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

  return (
    <Link
      to={`/events/${event._id}`}
      className={`group flex flex-col h-full bg-[#1E1E2E] dark:bg-[#1E1E2E] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${isPastEvent ? 'opacity-75' : ''}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-700 flex-shrink-0">
        {isPastEvent && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
            <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Event Ended
            </span>
          </div>
        )}
        {event.images && event.images.length > 0 && !imageError ? (
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src="/images/postercard4.jpg"
            alt={event.title || "Event poster"}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors z-10"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 bg-[#1E1E2E] flex flex-col flex-grow">
        {/* Content Area - Grows to fill space */}
        <div className="flex-grow">
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-[#7878E9] transition-colors" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <Calendar className="h-4 w-4 text-[#7878E9]" />
            <span className="text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {formatDate(event.date)} • {formatTime(event.time)}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <MapPin className="h-4 w-4 text-[#7878E9]" />
            <span className="text-sm line-clamp-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {event.location?.city}, {event.location?.state}
            </span>
          </div>

          {/* Attendees */}
          <div className="flex items-center gap-2 text-gray-300 mb-3">
            <Users className="h-4 w-4 text-[#7878E9]" />
            <span className="text-sm font-medium" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {event.currentParticipants || 0} attending
            </span>
          </div>

          {/* Category Badges */}
          {event.categories && event.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {event.categories.slice(0, 2).map((category, index) => (
                <span key={index} className="inline-flex items-center gap-1 bg-[#2A2A3E] text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {category}
                </span>
              ))}
              {event.mood && (
                <span className="inline-flex items-center gap-1 bg-[#2A2A3E] text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {event.mood}
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Details Button - Fixed at bottom */}
        <button
          className="w-full text-white px-4 py-2.5 rounded-md text-sm font-bold uppercase transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-lg mt-auto"
          style={{ 
            background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
            fontFamily: 'Oswald, sans-serif'
          }}
        >
          VIEW DETAILS
        </button>
      </div>
    </Link>
  );
};

export default EventCard;
