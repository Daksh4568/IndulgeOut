import { MapPin, Users, Heart, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const DEFAULT_COMMUNITY_IMAGES = [
  '/images/BackgroundLogin.jpg',
  '/images/communities2.jpg',
  '/images/communities3.jpg',
  '/images/communities4.jpg',
];

const CommunityCard = ({ community, onFavorite, isLocked = false, defaultImageIndex = 0 }) => {
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
      <div className={`relative h-48 overflow-hidden bg-gray-900 flex-shrink-0 ${isLocked ? 'filter blur-sm' : ''}`}>
        {(community.coverImage || (community.images && community.images.length > 0)) ? (
          <>
            <img
              src={community.coverImage || community.images[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60"
            />
            <img
              src={community.coverImage || community.images[0]}
              alt={community.name}
              className="relative w-full h-full object-contain scale-[1.35] group-hover:scale-[1.4] transition-transform duration-300"
            />
          </>
        ) : (
          <>
            <img
              src={DEFAULT_COMMUNITY_IMAGES[defaultImageIndex % DEFAULT_COMMUNITY_IMAGES.length]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60"
            />
            <img
              src={DEFAULT_COMMUNITY_IMAGES[defaultImageIndex % DEFAULT_COMMUNITY_IMAGES.length]}
              alt={community.name || "Community poster"}
              className="relative w-full h-full object-contain scale-[1.35] group-hover:scale-[1.4] transition-transform duration-300"
            />
          </>
        )}
        
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <Lock className="h-12 w-12 text-white mx-auto mb-2" />
            </div>
          </div>
        )}

        {/* Favorite Button */}
        {!isLocked && (
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
        )}
      </div>

      {/* Content */}
      <div className={`p-4 bg-[#1E1E2E] flex-grow ${isLocked ? 'filter blur-sm' : ''}`}>
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#7878E9] transition-colors" style={{ fontFamily: 'Oswald, sans-serif' }}>
          {community.name}
        </h3>

        {/* Description */}
        {community.description && (
          <p className="text-sm text-gray-300 mb-3 line-clamp-2" style={{ fontFamily: 'Source Serif Pro, serif' }}>
            {community.description}
          </p>
        )}

        {/* Members */}
        <div className="flex items-center gap-2 text-gray-300 mb-3">
          <Users className="h-4 w-4 text-[#7878E9]" />
          <span className="text-sm font-medium" style={{ fontFamily: 'Source Serif Pro, serif' }}>
            {community.memberCount || 0} members
          </span>
        </div>

        {/* Location */}
        {community.location?.city && (
          <div className="flex items-center gap-2 text-gray-300 mb-3">
            <MapPin className="h-4 w-4 text-[#7878E9]" />
            <span className="text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {community.location.city}
            </span>
          </div>
        )}

        {/* Category Badge */}
        {community.category && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1 bg-[#2A2A3E] text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              {community.category}
            </span>
          </div>
        )}

        {/* Join Button */}
        <button
          className="w-full text-white px-4 py-2.5 rounded-md text-sm font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-lg mt-auto"
          style={{ 
            background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
            fontFamily: 'Oswald, sans-serif'
          }}
        >
          Join Now
        </button>
      </div>
    </>
  );

  if (isLocked) {
    return (
      <div className="relative group flex flex-col bg-[#1E1E2E] dark:bg-[#1E1E2E] rounded-2xl overflow-hidden shadow-lg">
        <CardContent />
      </div>
    );
  }

  return (
    <Link
      to={`/communities/${community._id}`}
      className="group flex flex-col bg-[#1E1E2E] dark:bg-[#1E1E2E] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
    >
      <CardContent />
    </Link>
  );
};

export default CommunityCard;
