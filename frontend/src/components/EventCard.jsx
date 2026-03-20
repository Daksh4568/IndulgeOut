import { MapPin, Calendar, Heart, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CATEGORY_ICONS } from '../constants/eventConstants';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryHelper';
import { convert24To12Hour } from '../utils/timeUtils';

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
    if (!timeString) return '';
    // Convert to 12-hour format if it's in 24-hour format
    if (!timeString.includes('AM') && !timeString.includes('PM')) {
      return convert24To12Hour(timeString);
    }
    return timeString;
  };

  // Check if event has ended by considering both date and end time
  const isEventEnded = () => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (event.endTime) {
      // Parse end time (e.g., "08:30 PM")
      const timeMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        eventDate.setHours(hours, minutes, 0, 0);
        return eventDate < now;
      }
    }
    
    // If no end time, consider event lasts until end of day
    eventDate.setHours(23, 59, 59, 999);
    return eventDate < now;
  };

  const isPastEvent = isEventEnded();

  const getPriceBadge = () => {
    const effectivePrice = event.currentEffectivePrice ?? event.price?.amount ?? 0;
    if (effectivePrice === 0) {
      return <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Free</span>;
    } else {
      return <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">${effectivePrice}</span>;
    }
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
      to={`/events/${event.slug || event._id}`}
      className={`group flex flex-col bg-[#1E1E2E] dark:bg-[#1E1E2E] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${isPastEvent ? 'opacity-75' : ''} h-full`}
    >
      {/* Image */}
      <div className="relative h-56 sm:h-48 overflow-hidden bg-gray-700 flex-shrink-0">
        {isPastEvent && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
            <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Event Ended
            </span>
          </div>
        )}
        {event.images && event.images.length > 0 && !imageError ? (
          <img
            src={getOptimizedCloudinaryUrl(event.images[0])}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src="/images/BackgroundLogin.jpg"
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
      <div className="p-4 sm:p-4 bg-[#1E1E2E] flex flex-col flex-grow">
        {/* Content Area - Grows to fill space */}
        <div className="flex-grow space-y-2">
          {/* Title */}
          <h3 className="text-lg sm:text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#7878E9] transition-colors" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="h-4 w-4 sm:h-4 sm:w-4 text-[#7878E9] flex-shrink-0" />
            <span className="text-sm sm:text-sm line-clamp-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {formatDate(event.date)} • {event.startTime && event.endTime ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}` : formatTime(event.time)}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="h-4 w-4 sm:h-4 sm:w-4 text-[#7878E9] flex-shrink-0" />
            <span className="text-sm sm:text-sm line-clamp-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {event.location?.city}, {event.location?.state}
            </span>
          </div>

          {/* Price */}
          {event.price?.amount !== undefined && (
            <div className="flex items-center gap-2 text-gray-300">
              <IndianRupee className="h-4 w-4 sm:h-4 sm:w-4 text-[#7878E9] flex-shrink-0" />
              <span className="text-sm sm:text-sm font-medium" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                {(event.currentEffectivePrice ?? event.price.amount) === 0 ? 'FREE' : `₹${event.currentEffectivePrice ?? event.price.amount} onwards`}
              </span>
            </div>
          )}

          {/* Category Badges */}
          {event.categories && event.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
              {event.categories.slice(0, 2).map((category, index) => (
                <span key={index} className="inline-flex items-center gap-1 bg-[#2A2A3E] text-gray-300 px-2.5 sm:px-3 py-1 sm:py-1 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View Details Button - Fixed at bottom */}
        <button
          className="w-full text-white px-4 sm:px-4 py-2.5 sm:py-2.5 rounded-md text-sm sm:text-sm font-bold uppercase transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-lg mt-3"
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
