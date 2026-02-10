import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  Search, Filter, Users, MapPin, TrendingUp, Calendar, 
  X, ChevronLeft, ChevronRight, Sparkles, Target, BarChart3, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import FilterBar from '../components/FilterBar';

// Community type icon mapping for fallback images
const COMMUNITY_TYPE_ICONS = {
  'open': '🌐',
  'curated': '✨',
  'fitness': '💪',
  'arts': '🎨',
  'tech': '💻',
  'food': '🍽️',
  'music': '🎵',
  'sports': '⚽',
  'wellness': '🧘',
  'business': '💼'
};

const BrowseCommunities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const communitiesPerPage = 8;
  
  // Filters
  const [filters, setFilters] = useState({
    city: '',
    communityType: '',
    primaryCategory: '',
    audienceSize: '',
    eventExperience: ''
  });

  const communityTypes = [
    { value: 'open', label: 'Open Community', icon: '🌐' },
    { value: 'curated', label: 'Curated Community', icon: '✨' }
  ];

  const categories = [
    { value: 'arts_culture', label: 'Arts & Culture', icon: '🎨' },
    { value: 'fitness_wellness', label: 'Fitness & Wellness', icon: '💪' },
    { value: 'tech_innovation', label: 'Tech & Innovation', icon: '💻' },
    { value: 'food_beverage', label: 'Food & Beverage', icon: '🍽️' },
    { value: 'music_performance', label: 'Music & Performance', icon: '🎵' },
    { value: 'sports_outdoors', label: 'Sports & Outdoors', icon: '⚽' },
    { value: 'business_networking', label: 'Business & Networking', icon: '💼' },
    { value: 'social_impact', label: 'Social Impact', icon: '🤝' }
  ];

  const audienceSizes = [
    { value: '0-20', label: 'Intimate (0-20)' },
    { value: '20-50', label: 'Small (20-50)' },
    { value: '50-100', label: 'Medium (50-100)' },
    { value: '100-200', label: 'Large (100-200)' },
    { value: '200-500', label: 'Very Large (200-500)' },
    { value: '500+', label: 'Massive (500+)' }
  ];

  const eventExperiences = [
    { value: '0-5', label: 'Getting Started (0-5 events)' },
    { value: '5-10', label: 'Growing (5-10 events)' },
    { value: '10-30', label: 'Established (10-30 events)' },
    { value: '30-50', label: 'Experienced (30-50 events)' },
    { value: '50-100', label: 'Expert (50-100 events)' },
    { value: '100+', label: 'Master (100+ events)' }
  ];

  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [communities, searchQuery, filters]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/communities/browse');
      setCommunities(response.data);
      setFilteredCommunities(response.data);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...communities];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(community =>
        community.communityProfile?.communityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.communityProfile?.communityDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.communityProfile?.primaryCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.communityProfile?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(community =>
        community.communityProfile?.city === filters.city
      );
    }

    // Community type filter
    if (filters.communityType) {
      filtered = filtered.filter(community =>
        community.communityProfile?.communityType === filters.communityType
      );
    }

    // Primary category filter
    if (filters.primaryCategory) {
      filtered = filtered.filter(community =>
        community.communityProfile?.primaryCategory?.toLowerCase().includes(filters.primaryCategory.toLowerCase())
      );
    }

    // Audience size filter
    if (filters.audienceSize) {
      filtered = filtered.filter(community =>
        community.communityProfile?.typicalAudienceSize === filters.audienceSize
      );
    }

    // Event experience filter
    if (filters.eventExperience) {
      filtered = filtered.filter(community =>
        community.communityProfile?.pastEventExperience === filters.eventExperience
      );
    }

    setFilteredCommunities(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleProposeCollaboration = (communityId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Determine proposal type based on user role
    let proposalType;
    let proposerType;
    
    if (user.role === 'brand') {
      proposalType = 'brandToCommunity';
      proposerType = 'brand';
    } else if (user.role === 'venue') {
      proposalType = 'venueToCommunity';
      proposerType = 'venue';
    } else {
      alert('Only Brands and Venues can propose collaborations to Communities');
      return;
    }
    
    navigate(`/collaboration/proposal?type=${proposalType}`, {
      state: { 
        proposalType,
        recipientId: communityId,
        recipientType: 'community',
        proposerType
      }
    });
  };

  const getCommunityTypeIcon = (type) => {
    return COMMUNITY_TYPE_ICONS[type] || COMMUNITY_TYPE_ICONS['open'];
  };

  const getCommunityTypeLabel = (type) => {
    const communityType = communityTypes.find(t => t.value === type);
    return communityType ? communityType.label : type;
  };

  const openCommunityModal = (community) => {
    setSelectedCommunity(community);
    setCurrentImageIndex(0);
  };

  const closeCommunityModal = () => {
    setSelectedCommunity(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedCommunity && selectedCommunity.communityProfile?.pastEventPhotos) {
      setCurrentImageIndex((prev) => 
        (prev + 1) % selectedCommunity.communityProfile.pastEventPhotos.length
      );
    }
  };

  const prevImage = () => {
    if (selectedCommunity && selectedCommunity.communityProfile?.pastEventPhotos) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedCommunity.communityProfile.pastEventPhotos.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Browse Communities */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Browse Communities
          </h1>
          <p className="text-gray-400 text-base mb-4">
            Join communities and clubs for your interests and hobbies
          </p>
          
          {/* Manage Collaborations Button */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/collaborations')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FileText className="h-5 w-5" />
              Manage Collaborations
            </button>
          </div>
        </div>

        {/* White Search Bar - Centered, not full width */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search an event, a festival, an interest, a mood, a city"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>
        </div>

        {/* All Communities Title */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
            All Communities
          </h2>
        </div>

        {/* Filter Bar */}
        <FilterBar
          onFilterChange={handleFilterChange}
          activeFilters={filters}
        />

        {/* Communities Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No communities found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCommunities
                .slice((currentPage - 1) * communitiesPerPage, currentPage * communitiesPerPage)
                .map((community) => (
              <div
                key={community._id}
                onClick={() => openCommunityModal(community)}
                className="bg-zinc-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-800 flex flex-col h-full"
              >
                {/* Community Image with Gradient Overlay */}
                <div className="relative h-48 overflow-hidden">
                  {community.communityProfile?.pastEventPhotos && community.communityProfile.pastEventPhotos.length > 0 ? (
                    <>
                      <img
                        src={community.communityProfile.pastEventPhotos[0]}
                        alt={community.communityProfile?.communityName}
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className="absolute inset-0 mix-blend-overlay"
                        style={{
                          background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                        }}
                      ></div>
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-6xl relative z-10"
                      style={{
                        background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                      }}
                    >
                      {getCommunityTypeIcon(community.communityProfile?.communityType)}
                    </div>
                  )}
                  
                  {/* Community Type Badge */}
                  {community.communityProfile?.communityType && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-semibold z-10 capitalize">
                      {community.communityProfile.communityType}
                    </div>
                  )}
                </div>

                {/* Community Info */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-white font-bold text-lg mb-1">
                    {community.communityProfile?.communityName || community.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-400 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{community.communityProfile?.city || 'Pan-India'}</span>
                  </div>

                  {/* Member Count */}
                  {community.communityProfile?.memberCount && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span>{community.communityProfile.memberCount.toLocaleString()} members</span>
                      </div>
                    </div>
                  )}

                  {/* Primary Category */}
                  {community.communityProfile?.primaryCategory && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs font-medium">
                        {community.communityProfile.primaryCategory}
                      </span>
                    </div>
                  )}

                  {/* Activity Stats */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                    {community.communityProfile?.pastEventExperience && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{community.communityProfile.pastEventExperience} events</span>
                      </div>
                    )}
                    {community.communityProfile?.typicalAudienceSize && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>{community.communityProfile.typicalAudienceSize} avg</span>
                      </div>
                    )}
                  </div>

                  {/* Propose Collaboration Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProposeCollaboration(community._id);
                    }}
                    className="w-full py-2.5 rounded-lg font-medium text-white transition-all mt-auto"
                    style={{
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    }}
                  >
                    Propose Collaboration
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredCommunities.length > communitiesPerPage && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {[...Array(Math.ceil(filteredCommunities.length / communitiesPerPage))].map((_, index) => {
                  const pageNumber = index + 1;
                  const totalPages = Math.ceil(filteredCommunities.length / communitiesPerPage);
                  
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="text-gray-500">...</span>;
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredCommunities.length / communitiesPerPage)))}
                disabled={currentPage === Math.ceil(filteredCommunities.length / communitiesPerPage)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === Math.ceil(filteredCommunities.length / communitiesPerPage)
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Community Detail Modal */}
      {selectedCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeCommunityModal}>
          <div className="bg-black rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-800" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>Community Overview</h2>
              <button
                onClick={closeCommunityModal}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid md:grid-cols-2 gap-8 p-6">
                {/* Left Column - Image Carousel */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative h-80 rounded-xl overflow-hidden">
                    {selectedCommunity.communityProfile?.pastEventPhotos && selectedCommunity.communityProfile.pastEventPhotos.length > 0 ? (
                      <>
                        <img
                          src={selectedCommunity.communityProfile.pastEventPhotos[currentImageIndex]}
                          alt={selectedCommunity.communityProfile?.communityName}
                          className="w-full h-full object-cover"
                        />
                        {selectedCommunity.communityProfile.pastEventPhotos.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                            >
                              <ChevronLeft className="h-6 w-6 text-white" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                            >
                              <ChevronRight className="h-6 w-6 text-white" />
                            </button>
                            {/* Image Counter */}
                            <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 rounded-full text-white text-sm">
                              {currentImageIndex + 1} / {selectedCommunity.communityProfile.pastEventPhotos.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-6xl"
                        style={{
                          background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                        }}
                      >
                        {getCommunityTypeIcon(selectedCommunity.communityProfile?.communityType)}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Images */}
                  {selectedCommunity.communityProfile?.pastEventPhotos && selectedCommunity.communityProfile.pastEventPhotos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedCommunity.communityProfile.pastEventPhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex ? 'border-purple-500' : 'border-transparent'
                          }`}
                        >
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column - Community Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {selectedCommunity.communityProfile?.communityName || selectedCommunity.name}
                    </h3>
                    <p className="text-gray-400">
                      {selectedCommunity.communityProfile?.communityDescription || 'An enchanting outdoor venue perfect for intimate gatherings and creative events under the stars'}
                    </p>
                  </div>

                  {/* Target Cities */}
                  {selectedCommunity.communityProfile?.city && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Target Cities</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium">
                          {selectedCommunity.communityProfile.city}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Community Type */}
                  {selectedCommunity.communityProfile?.communityType && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Community Type</h4>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                        background: selectedCommunity.communityProfile.communityType === 'curated' 
                          ? 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                          : 'linear-gradient(180deg, #4ADE80 11%, #22C55E 146%)'
                      }}>
                        <span className="text-lg">{getCommunityTypeIcon(selectedCommunity.communityProfile.communityType)}</span>
                        <span className="font-medium text-white capitalize">
                          {selectedCommunity.communityProfile.communityType}
                          {selectedCommunity.communityProfile.communityType === 'curated' && (
                            <span className="block text-xs opacity-80">Approval required</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {selectedCommunity.communityProfile?.primaryCategory && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Categories</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Main Category</p>
                          <span className="px-4 py-2 bg-purple-900/50 text-purple-300 rounded-lg inline-block font-medium">
                            {selectedCommunity.communityProfile.primaryCategory}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Typical Audience Size */}
                  {selectedCommunity.communityProfile?.typicalAudienceSize && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Typical Audience Size</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-400" />
                          <div>
                            <p className="text-2xl font-bold text-white">{selectedCommunity.communityProfile.typicalAudienceSize.split('-')[0]}</p>
                            <p className="text-xs text-gray-400">Average attendees</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Events Hosted */}
                    {selectedCommunity.communityProfile?.pastEventExperience && (
                      <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-purple-400" />
                          <p className="text-xs text-gray-400">Events Hosted</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{selectedCommunity.communityProfile.pastEventExperience}</p>
                      </div>
                    )}

                    {/* Total Reach */}
                    {selectedCommunity.communityProfile?.memberCount && (
                      <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-5 w-5 text-purple-400" />
                          <p className="text-xs text-gray-400">Total Reach</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{selectedCommunity.communityProfile.memberCount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Propose Campaign Button */}
                  <button
                    onClick={() => handleProposeCollaboration(selectedCommunity._id)}
                    className="w-full py-3 rounded-lg font-semibold text-white transition-all text-lg"
                    style={{
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    }}
                  >
                    Propose Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseCommunities;
