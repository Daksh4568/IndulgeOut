import { MapPin, Calendar, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const EventCard = ({ event, onFavorite, showLoginPrompt }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onFavorite) {
      const result = onFavorite(event._id);
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

  return (
    <Link
      to={`/events/${event._id}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gray-200 dark:bg-gray-700">
        {event.images && event.images.length > 0 ? (
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Calendar className="h-16 w-16" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {getPriceBadge()}
          {event.mood && (
            <span className="bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full text-xs font-semibold">
              {getMoodEmoji(event.mood)} {event.mood}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
          {event.title}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {formatDate(event.date)} • {formatTime(event.time)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="h-4 w-4" />
          <span className="text-sm line-clamp-1">
            {event.location?.city}, {event.location?.state}
          </span>
        </div>

        {/* Category Badge */}
        {event.categories && event.categories.length > 0 && (
          <div className="mb-3">
            <span className="inline-block bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-xs font-medium">
              {event.categories[0]}
            </span>
          </div>
        )}

        {/* Footer - Attendees & Host */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              {event.currentParticipants || 0}/{event.maxParticipants} going
            </span>
          </div>

          {event.host && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {event.host.name ? event.host.name.charAt(0).toUpperCase() : 'H'}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
