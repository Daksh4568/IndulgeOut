import { MapPin, Users, Heart, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const CommunityCard = ({ community, onFavorite, isLocked = false }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onFavorite) {
      const result = onFavorite(community._id);
      if (result !== false) {
        setIsFavorited(!isFavorited);
      }
    }
  };

  const getCategoryEmoji = (category) => {
    const categoryMap = {
      'Sip & Savor': '🍷',
      'Sweat & Play': '⚽',
      'Art & DIY': '🎨',
      'Social Mixers': '🎭',
      'Adventure & Outdoors': '🏔️',
      'Epic Screenings': '🎬',
      'Indoor & Board Games': '🎲',
      'Music & Performance': '🎵'
    };
    return categoryMap[category] || '🌟';
  };

  const CardContent = () => (
    <>
      {/* Image */}
      <div className={`relative aspect-video overflow-hidden bg-gray-200 dark:bg-gray-700 ${isLocked ? 'filter blur-sm' : ''}`}>
        {(community.coverImage || (community.images && community.images.length > 0)) ? (
          <img
            src={community.coverImage || community.images[0]}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Users className="h-16 w-16" />
          </div>
        )}
        
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center">
              <Lock className="h-12 w-12 text-white mx-auto mb-2" />
              <p className="text-white font-semibold text-sm">Download App to View</p>
            </div>
          </div>
        )}

        {/* Favorite Button */}
        {!isLocked && (
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
        )}
      </div>

      {/* Content */}
      <div className={`p-4 ${isLocked ? 'filter blur-sm' : ''}`}>
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
          {community.name}
        </h3>

        {/* Description */}
        {community.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {community.description}
          </p>
        )}

        {/* Location */}
        {community.location?.city && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              {community.location.city}
              {community.location.state && `, ${community.location.state}`}
            </span>
          </div>
        )}

        {/* Category Badge */}
        {community.category && (
          <div className="mb-3">
            <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-medium">
              {getCategoryEmoji(community.category)} {community.category}
            </span>
          </div>
        )}

        {/* Footer - Members & Creator */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              {community.memberCount || 0} members
            </span>
          </div>

          {community.creator && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {community.creator.name ? community.creator.name.charAt(0).toUpperCase() : 'C'}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (isLocked) {
    return (
      <div className="relative group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
        <CardContent />
      </div>
    );
  }

  return (
    <Link
      to={`/communities/${community._id}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
    >
      <CardContent />
    </Link>
  );
};

export default CommunityCard;
