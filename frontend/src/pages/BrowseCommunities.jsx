import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  Search, Filter, Users, MapPin, TrendingUp, Calendar, 
  X, ChevronLeft, ChevronRight, Sparkles, Target, BarChart3, FileText, Image
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import FilterBar from '../components/FilterBar';
import RotatingSearchBar from '../components/RotatingSearchBar';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryHelper';

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
  const [modalTab, setModalTab] = useState('overview');
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
    
    // Determine proposal type based on user hostPartnerType
    let proposalType;
    let proposerType;
    
    // Check hostPartnerType for host_partner role users
    if (user.hostPartnerType === 'brand_sponsor') {
      proposalType = 'brandToCommunity';
      proposerType = 'brand';
    } else if (user.hostPartnerType === 'venue') {
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
    setModalTab('overview');
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
        </div>

        {/* White Search Bar - Centered, not full width */}
        <div className="max-w-2xl mx-auto mb-8">
          <RotatingSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholders={[
              'Search for event organizers',
              'Search for communities',
              'Search for creators',
            ]}
          />
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
                {/* Community Image */}
                <div className="relative h-48 overflow-hidden">
                  {community.communityProfile?.pastEventPhotos && community.communityProfile.pastEventPhotos.length > 0 ? (
                    <img
                      src={getOptimizedCloudinaryUrl(community.communityProfile.pastEventPhotos[0])}
                      alt={community.communityProfile?.communityName}
                      className="w-full h-full object-cover"
                    />
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
          <div className="bg-zinc-950 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-800/50" onClick={(e) => e.stopPropagation()}>
            {/* Hero Banner */}
            <div className="relative h-48 sm:h-56 overflow-hidden">
              {selectedCommunity.communityProfile?.pastEventPhotos && selectedCommunity.communityProfile.pastEventPhotos.length > 0 ? (
                <img src={getOptimizedCloudinaryUrl(selectedCommunity.communityProfile.pastEventPhotos[0])} alt={selectedCommunity.communityProfile?.communityName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: 'linear-gradient(135deg, #7878E9 0%, #3D3DD4 50%, #6C3CE0 100%)' }}>
                  {getCommunityTypeIcon(selectedCommunity.communityProfile?.communityType)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <button onClick={closeCommunityModal} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
              {/* Community Type Badge */}
              {selectedCommunity.communityProfile?.communityType && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                  {selectedCommunity.communityProfile.communityType}
                </div>
              )}
            </div>

            {/* Community Name & Description */}
            <div className="px-6 pt-3 pb-2">
              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {selectedCommunity.communityProfile?.communityName || selectedCommunity.name}
              </h3>
              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-1">
                {selectedCommunity.communityProfile?.city && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-purple-400" />{selectedCommunity.communityProfile.city}</span>
                )}
                {selectedCommunity.communityProfile?.memberCount && (
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-purple-400" />{selectedCommunity.communityProfile.memberCount.toLocaleString()} members</span>
                )}
                {selectedCommunity.communityProfile?.pastEventExperience && (
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-purple-400" />{selectedCommunity.communityProfile.pastEventExperience} events</span>
                )}
              </div>
              <p className="text-gray-400 text-sm line-clamp-2">{selectedCommunity.communityProfile?.communityDescription || 'Discover collaboration opportunities'}</p>
            </div>

            {/* Toggle Tabs */}
            <div className="px-6 pt-2 pb-1">
              <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl border border-gray-800/50">
                <button
                  onClick={() => setModalTab('overview')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    modalTab === 'overview'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </button>
                <button
                  onClick={() => setModalTab('gallery')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    modalTab === 'gallery'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Image className="h-4 w-4" />
                  Gallery {selectedCommunity.communityProfile?.pastEventPhotos?.length > 0 && `(${selectedCommunity.communityProfile.pastEventPhotos.length})`}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-340px)] px-6 py-4">
              {modalTab === 'overview' ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Preferred Cities */}
                  {selectedCommunity.communityProfile?.preferredCities && selectedCommunity.communityProfile.preferredCities.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cities</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCommunity.communityProfile.preferredCities.map((city, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{city}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Categories */}
                  {selectedCommunity.communityProfile?.preferredCategories && selectedCommunity.communityProfile.preferredCategories.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categories</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCommunity.communityProfile.preferredCategories.map((cat, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{cat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Event Formats */}
                  {selectedCommunity.communityProfile?.preferredEventFormats && selectedCommunity.communityProfile.preferredEventFormats.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Event Formats</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCommunity.communityProfile.preferredEventFormats.map((format, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{format}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Audience Types */}
                  {selectedCommunity.communityProfile?.preferredAudienceTypes && selectedCommunity.communityProfile.preferredAudienceTypes.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Audience Types</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCommunity.communityProfile.preferredAudienceTypes.map((audience, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{audience}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attendee Event Size */}
                  {selectedCommunity.communityProfile?.attendeeEventSize && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Event Size</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{selectedCommunity.communityProfile.attendeeEventSize}</span>
                    </div>
                  )}

                  {/* Niche Community Description */}
                  {selectedCommunity.communityProfile?.nicheCommunityDescription && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all sm:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Niche Community</h4>
                      </div>
                      <p className="text-gray-300 text-sm">{selectedCommunity.communityProfile.nicheCommunityDescription}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Gallery Tab */
                <div>
                  {selectedCommunity.communityProfile?.pastEventPhotos && selectedCommunity.communityProfile.pastEventPhotos.length > 0 ? (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden aspect-video">
                        <img src={getOptimizedCloudinaryUrl(selectedCommunity.communityProfile.pastEventPhotos[currentImageIndex])} alt={selectedCommunity.communityProfile?.communityName} className="w-full h-full object-cover" />
                        {selectedCommunity.communityProfile.pastEventPhotos.length > 1 && (
                          <>
                            <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                              <ChevronLeft className="h-5 w-5 text-white" />
                            </button>
                            <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                              <ChevronRight className="h-5 w-5 text-white" />
                            </button>
                            <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                              {currentImageIndex + 1} / {selectedCommunity.communityProfile.pastEventPhotos.length}
                            </div>
                          </>
                        )}
                      </div>
                      {selectedCommunity.communityProfile.pastEventPhotos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {selectedCommunity.communityProfile.pastEventPhotos.map((photo, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === currentImageIndex ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-gray-700 hover:border-gray-500'
                              }`}
                            >
                              <img src={getOptimizedCloudinaryUrl(photo)} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <Image className="h-16 w-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">No photos uploaded yet</p>
                      <p className="text-sm mt-1">This community hasn't added any photos</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t border-gray-800/50">
              <button
                onClick={() => handleProposeCollaboration(selectedCommunity._id)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all text-base hover:shadow-lg hover:shadow-purple-500/20"
                style={{ background: 'linear-gradient(135deg, #7878E9 0%, #3D3DD4 100%)' }}
              >
                Propose Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseCommunities;
