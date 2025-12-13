import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api.js';
import DarkModeToggle from '../components/DarkModeToggle';
import LoadingSpinner from '../components/LoadingSpinner';
import { DISCOVERY_CATEGORIES, CATEGORY_ICONS } from '../constants/eventConstants';
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Star,
  Plus,
  TrendingUp,
  Globe,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import axios from 'axios';

const CommunityDiscovery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useContext(ToastContext);
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyMyCommunities, setShowOnlyMyCommunities] = useState(false);

  // Check if user is a host (community_member)
  const isHost = user?.role === 'community_member';

  // Extended categories for communities
  const communityCategories = [
    { id: 'all', name: 'All Communities', icon: '🌐' },
    { id: 'Sip & Savor', name: 'Sip & Savor', icon: '🍷' },
    { id: 'Sweat & Play', name: 'Sweat & Play', icon: '⚽' },
    { id: 'Art & DIY', name: 'Art & DIY', icon: '🎨' },
    { id: 'Social Mixers', name: 'Social Mixers', icon: '🎭' },
    { id: 'Adventure & Outdoors', name: 'Adventure & Outdoors', icon: '🏔️' },
    { id: 'Epic Screenings', name: 'Epic Screenings', icon: '🎬' },
    { id: 'Indoor & Board Games', name: 'Indoor & Board Games', icon: '🎲' },
    { id: 'Music & Performance', name: 'Music & Performance', icon: '🎵' },
    { id: 'Technology', name: 'Technology', icon: '💻' },
    { id: 'wellness', name: 'Wellness', icon: '🧘' },
    { id: 'business-networking', name: 'Business & Networking', icon: '🤝' },
    { id: 'education-learning', name: 'Education & Learning', icon: '📚' }
  ];

  const locations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur'
  ];

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    filterCommunities();
  }, [communities, selectedCategory, searchTerm, selectedLocation, showOnlyMyCommunities]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/communities`);
      
      if (response.data.communities) {
        setCommunities(response.data.communities);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCommunities = () => {
    let filtered = [...communities];

    // My Communities filter (for hosts)
    if (showOnlyMyCommunities && user) {
      const userId = user._id || user.id;
      filtered = filtered.filter(community => {
        const hostId = community.host?._id || community.host;
        return hostId === userId || String(hostId) === String(userId);
      });
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      const categoryName = communityCategories.find(cat => cat.id === selectedCategory)?.name;
      if (categoryName) {
        filtered = filtered.filter(community => 
          community.category === categoryName
        );
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(community =>
        community.location?.city?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredCommunities(filtered);
  };

  const getCategoryIcon = (categoryName) => {
    if (CATEGORY_ICONS[categoryName]) {
      return CATEGORY_ICONS[categoryName];
    }
    
    const additionalIcons = {
      'Technology': '💻',
      'Wellness': '🧘',
      'Business & Networking': '🤝',
      'Education & Learning': '📚'
    };
    
    return additionalIcons[categoryName] || '🌟';
  };

  const joinCommunity = async (communityId, e) => {
    e.stopPropagation();
    
    if (!user) {
      toast.warning('Please log in to join communities');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/communities/${communityId}/join`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      toast.success('Successfully joined community!');
      fetchCommunities(); // Refresh to show updated member count
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error(error.response?.data?.message || 'Error joining community');
    }
  };

  const isUserMember = (community) => {
    if (!user) return false;
    return community.members?.some(member => member.user._id === user.id || member.user === user.id);
  };

  const isUserHost = (community) => {
    if (!user) return false;
    return community.host._id === user.id || community.host === user.id;
  };

  const canJoinCommunity = (community) => {
    if (!user) return false;
    if (isUserHost(community)) return false; // Host cannot join their own community
    if (isUserMember(community)) return false; // Already a member
    return true;
  };

  const getButtonState = (community) => {
    if (!user) {
      return { 
        text: 'Login to Join', 
        clickable: true, 
        className: 'bg-blue-600 text-white hover:bg-blue-700',
        action: () => navigate('/login') 
      };
    }
    
    if (isUserHost(community)) {
      return { 
        text: 'Your Community', 
        clickable: false, 
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 cursor-not-allowed',
        action: null 
      };
    }
    
    if (isUserMember(community)) {
      return { 
        text: 'Joined ✓', 
        clickable: false, 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 cursor-not-allowed',
        action: null 
      };
    }
    
    return { 
      text: 'Join', 
      clickable: true, 
      className: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      action: (e) => joinCommunity(community._id, e) 
    };
  };

  if (loading) {
    return <LoadingSpinner text="Loading communities..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {isHost ? 'Manage Communities' : 'Discover Communities'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 line-clamp-2">
                {isHost 
                  ? 'Manage your communities and explore others' 
                  : 'Join communities that match your interests and connect with like-minded people'
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <DarkModeToggle />
              {user && (
                <>
                  {isHost && (
                    <button
                      onClick={() => setShowOnlyMyCommunities(!showOnlyMyCommunities)}
                      className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation ${
                        showOnlyMyCommunities 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      👤 <span className="hidden xs:inline">My Communities</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-3 sm:px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation"
                  >
                    Dashboard
                  </button>
                  {isHost && (
                    <button
                      onClick={() => navigate('/community/create')}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden xs:inline">Create Community</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search and Filters - Mobile Optimized */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-h-[44px] text-base"
                />
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-h-[44px] text-sm sm:text-base"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 sm:px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {/* Category Pills - Mobile Scrollable */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-2 min-w-max sm:flex-wrap sm:min-w-0">
                {communityCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[44px] touch-manipulation ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 shadow-sm'
                    }`}
                  >
                    <span className="text-base sm:text-lg">{category.icon}</span>
                    <span className="hidden xs:inline">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No communities found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isHost 
                ? 'Try adjusting your search criteria or create a new community'
                : 'Try adjusting your search criteria or browse other categories'
              }
            </p>
            {isHost && (
              <button
                onClick={() => navigate('/community/create')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create First Community
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCommunities.map((community, index) => (
              <div 
                key={community._id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 group touch-manipulation"
                onClick={() => navigate(`/community/${community._id}`)}
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 100}ms forwards`
                }}
              >
                {/* Community Cover Image */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                  {community.coverImage ? (
                    <img
                      src={community.coverImage}
                      alt={community.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-6xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                      <div className="text-center transform transition-transform duration-300 group-hover:scale-110">
                        <div className="mb-2 drop-shadow-sm filter group-hover:drop-shadow-lg transition-all duration-300">
                          {getCategoryIcon(community.category)}
                        </div>
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider px-2 py-1 rounded-full bg-white dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70 backdrop-blur-sm">
                          {community.category}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3">
                    {community.isPrivate ? (
                      <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </div>
                    ) : (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Public
                      </div>
                    )}
                  </div>

                  {/* Trending Badge */}
                  {community.stats?.totalMembers > 50 && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Trending
                    </div>
                  )}
                </div>

                {/* Community Details - Mobile Optimized */}
                <div className="p-4 sm:p-6">
                  {/* Category and Rating */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                      {community.category}
                    </span>
                    {community.stats?.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {community.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Community Name */}
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {community.name}
                  </h3>

                  {/* Short Description */}
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                    {community.shortDescription || community.description}
                  </p>

                  {/* Location and Members */}
                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    {community.location?.city && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {community.location.city}
                          {community.location.state && `, ${community.location.state}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {community.stats?.totalMembers || community.members?.length || 0} members
                    </div>
                  </div>

                  {/* Tags */}
                  {community.tags && community.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {community.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {community.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                          +{community.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Join Button and Host Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                        {community.host?.profilePicture ? (
                          <img
                            src={community.host.profilePicture}
                            alt={community.host.name}
                            className="w-10 h-10 object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {community.host?.name?.charAt(0) || 'H'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {community.host?.name || 'Host'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Community Host
                        </div>
                      </div>
                    </div>
                    
{(() => {
                      const buttonState = getButtonState(community);
                      return (
                        <button
                          onClick={(e) => buttonState.clickable && joinCommunity(community._id, e)}
                          disabled={!buttonState.clickable}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${buttonState.className}`}
                        >
                          {buttonState.text}
                          {buttonState.icon && <ChevronRight className="h-4 w-4" />}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CommunityDiscovery;