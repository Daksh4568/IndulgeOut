import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  Search, Filter, Building2, Target, TrendingUp,
  ArrowRight, X, Sparkles, Users, MapPin, Globe, ChevronLeft, ChevronRight, FileText, Image, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import FilterBar from '../components/FilterBar';
import RotatingSearchBar from '../components/RotatingSearchBar';
import API_URL from '../config/api';

// Brand category icon mapping for fallback images
const BRAND_CATEGORY_ICONS = {
  'food_beverage': '🍽️',
  'wellness_fitness': '💪',
  'lifestyle': '✨',
  'tech': '💻',
  'entertainment': '🎬',
  'fashion': '👗',
  'education': '📚',
  'other': '🏢'
};

const BrowseSponsors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [modalTab, setModalTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const brandsPerPage = 8;
  
  // Filters
  const [filters, setFilters] = useState({
    brandCategory: '',
    targetCity: '',
    sponsorshipType: [],
    collaborationIntent: []
  });

  const brandCategories = [
    { value: 'food_beverage', label: 'Food & Beverage', icon: '🍽️' },
    { value: 'wellness_fitness', label: 'Wellness & Fitness', icon: '💪' },
    { value: 'lifestyle', label: 'Lifestyle', icon: '✨' },
    { value: 'tech', label: 'Tech', icon: '💻' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'fashion', label: 'Fashion', icon: '👗' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'other', label: 'Other', icon: '🏢' }
  ];

  const sponsorshipTypes = [
    { value: 'barter', label: 'Barter', description: 'Product/service exchange' },
    { value: 'paid_monetary', label: 'Paid/Monetary', description: 'Cash sponsorship' },
    { value: 'product_sampling', label: 'Product Sampling', description: 'Free samples' },
    { value: 'co-marketing', label: 'Co-Marketing', description: 'Joint promotion' }
  ];

  const collaborationIntents = [
    { value: 'sponsorship', label: 'Sponsorship', icon: '🤝' },
    { value: 'sampling', label: 'Sampling', icon: '🎁' },
    { value: 'popups', label: 'Pop-ups', icon: '🏪' },
    { value: 'experience_partnerships', label: 'Experience Partnerships', icon: '✨' },
    { value: 'brand_activation', label: 'Brand Activation', icon: '🚀' },
    { value: 'content_creation', label: 'Content Creation', icon: '📸' }
  ];

  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [brands, searchQuery, filters]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brands/browse');
      setBrands(response.data);
      setFilteredBrands(response.data);
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...brands];

    // Search filter - enhanced to include category and other searchable fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(brand => {
        // Search in basic fields
        const matchesBasicFields = 
          brand.brandName?.toLowerCase().includes(query) ||
          brand.brandDescription?.toLowerCase().includes(query);
        
        // Search in brand category (e.g., "food", "fitness", "tech")
        const matchesCategory = brand.brandCategory?.toLowerCase().replace('_', ' ').includes(query);
        
        // Search in target cities
        const matchesCities = brand.targetCity?.some(city => 
          city.toLowerCase().includes(query)
        );
        
        // Search in sponsorship types
        const matchesSponsorshipType = brand.sponsorshipType?.some(type => 
          type.toLowerCase().replace('_', ' ').includes(query)
        );
        
        // Search in collaboration intents
        const matchesCollaboration = brand.collaborationIntent?.some(intent => 
          intent.toLowerCase().replace('_', ' ').includes(query)
        );
        
        return matchesBasicFields || matchesCategory || matchesCities || matchesSponsorshipType || matchesCollaboration;
      });
    }

    // Category filter
    if (filters.brandCategory) {
      filtered = filtered.filter(brand => brand.brandCategory === filters.brandCategory);
    }

    // City filter
    if (filters.targetCity) {
      filtered = filtered.filter(brand => 
        brand.targetCity?.includes(filters.targetCity)
      );
    }

    // Sponsorship type filter
    if (filters.sponsorshipType.length > 0) {
      filtered = filtered.filter(brand =>
        filters.sponsorshipType.some(type => brand.sponsorshipType?.includes(type))
      );
    }

    // Collaboration intent filter
    if (filters.collaborationIntent.length > 0) {
      filtered = filtered.filter(brand =>
        filters.collaborationIntent.some(intent => brand.collaborationIntent?.includes(intent))
      );
    }

    setFilteredBrands(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      brandCategory: '',
      targetCity: '',
      sponsorshipType: [],
      collaborationIntent: []
    });
    setSearchQuery('');
  };

  const handleProposeCollaboration = (brandId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Only communities can propose to brands in current system
    // TODO: Add venue→brand and brand→venue collaboration types if needed
    if (user.hostPartnerType !== 'community_organizer' && user.role !== 'user') {
      alert('Only Communities can propose collaborations to Brands in the current system. Venue-to-Brand collaborations are not yet supported.');
      return;
    }
    
    navigate('/collaboration/proposal?type=communityToBrand', {
      state: { 
        proposalType: 'communityToBrand',
        recipientId: brandId,
        recipientType: 'brand'
      }
    });
  };

  const getBrandCategoryIcon = (category) => {
    return BRAND_CATEGORY_ICONS[category] || BRAND_CATEGORY_ICONS['other'];
  };

  const getBrandCategoryLabel = (category) => {
    const cat = brandCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const openBrandModal = (brand) => {
    setSelectedBrand(brand);
    setCurrentImageIndex(0);
    setModalTab('overview');
  };

  const closeBrandModal = () => {
    setSelectedBrand(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedBrand && selectedBrand.productPhotos) {
      setCurrentImageIndex((prev) => 
        (prev + 1) % selectedBrand.productPhotos.length
      );
    }
  };

  const prevImage = () => {
    if (selectedBrand && selectedBrand.productPhotos) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedBrand.productPhotos.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Browse Sponsors */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Browse Sponsors
          </h1>
          <p className="text-gray-400 text-base mb-4">
            Join communities and circles for your interests and hobbies
          </p>
        </div>

        {/* White Search Bar - Centered, not full width */}
        <div className="max-w-2xl mx-auto mb-8">
          <RotatingSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholders={[
              'Search for sponsors',
              'Search for lifestyle brands',
              'Search for consumer brands',
            ]}
          />
        </div>

        {/* All Sponsors Title */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
            All Sponsors
          </h2>
        </div>

        {/* Filter Bar */}
        <FilterBar
          onFilterChange={handleFilterChange}
          activeFilters={filters}
        />

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{filteredBrands.length}</span> brands found
          </p>
        </div>

        {/* Brands Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No brands found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 text-white rounded-lg transition-colors"
              style={{
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {filteredBrands
              .slice((currentPage - 1) * brandsPerPage, currentPage * brandsPerPage)
              .map((brand) => (
              <div
                key={brand._id}
                onClick={() => openBrandModal(brand)}
                className="bg-zinc-900 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col h-full"
              >
                {/* Brand Image */}
                <div className="relative h-48 overflow-hidden">
                  {brand.productPhotos && brand.productPhotos.length > 0 ? (
                    <img
                      src={brand.productPhotos[0]}
                      alt={brand.brandName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl relative z-10" style={{
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    }}>
                      {getBrandCategoryIcon(brand.brandCategory)}
                    </div>
                  )}
                  {/* Brand Logo Overlay */}
                  {brand.logo && (
                    <div className="absolute bottom-3 left-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-10">
                      <img src={brand.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Brand Info */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-white font-bold text-lg mb-2">{brand.brandName}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {brand.brandDescription || 'Discover collaboration opportunities'}
                  </p>

                  {/* Collaboration Formats */}
                  {brand.collaborationIntent && brand.collaborationIntent.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Collaboration Formats</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {brand.collaborationIntent.slice(0, 3).map((intent, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs"
                          >
                            {intent.replace('_', ' ')}
                          </span>
                        ))}
                        {brand.collaborationIntent.length > 3 && (
                          <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs">
                            +{brand.collaborationIntent.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cities Present */}
                  {brand.targetCity && brand.targetCity.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Cities present in</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {brand.targetCity.slice(0, 4).map((city, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs"
                          >
                            {city}
                          </span>
                        ))}
                        {brand.targetCity.length > 4 && (
                          <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs">
                            +{brand.targetCity.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Propose Collaboration Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProposeCollaboration(brand._id);
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
          {filteredBrands.length > brandsPerPage && (
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
                {[...Array(Math.ceil(filteredBrands.length / brandsPerPage))].map((_, index) => {
                  const pageNumber = index + 1;
                  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
                  
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredBrands.length / brandsPerPage)))}
                disabled={currentPage === Math.ceil(filteredBrands.length / brandsPerPage)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === Math.ceil(filteredBrands.length / brandsPerPage)
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

      {/* Brand Detail Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeBrandModal}>
          <div className="bg-zinc-950 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-800/50" onClick={(e) => e.stopPropagation()}>
            {/* Hero Banner */}
            <div className="relative h-48 sm:h-56 overflow-hidden">
              {selectedBrand.productPhotos && selectedBrand.productPhotos.length > 0 ? (
                <img
                  src={selectedBrand.productPhotos[0]}
                  alt={selectedBrand.brandName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: 'linear-gradient(135deg, #7878E9 0%, #3D3DD4 50%, #6C3CE0 100%)' }}>
                  {getBrandCategoryIcon(selectedBrand.brandCategory)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              {/* Close Button */}
              <button onClick={closeBrandModal} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
              {/* Brand Logo */}
              {selectedBrand.logo && (
                <div className="absolute bottom-4 left-6 w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-xl border-2 border-white/20">
                  <img src={selectedBrand.logo} alt="" className="w-12 h-12 rounded-lg object-cover" />
                </div>
              )}
            </div>

            {/* Brand Name & Description */}
            <div className="px-6 pt-3 pb-2">
              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{selectedBrand.brandName}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{selectedBrand.brandDescription || 'Discover collaboration opportunities'}</p>
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
                  Gallery {selectedBrand.productPhotos?.length > 0 && `(${selectedBrand.productPhotos.length})`}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-340px)] px-6 py-4">
              {modalTab === 'overview' ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Preferred Cities */}
                  {selectedBrand.preferredCities && selectedBrand.preferredCities.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cities</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBrand.preferredCities.map((city, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{city}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Categories */}
                  {selectedBrand.preferredCategories && selectedBrand.preferredCategories.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categories</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBrand.preferredCategories.map((cat, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{cat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Event Formats */}
                  {selectedBrand.preferredEventFormats && selectedBrand.preferredEventFormats.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Event Formats</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBrand.preferredEventFormats.map((format, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{format}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Collaboration Types */}
                  {selectedBrand.preferredCollaborationTypes && selectedBrand.preferredCollaborationTypes.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Collaboration Types</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBrand.preferredCollaborationTypes.map((type, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{type}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Audience Types */}
                  {selectedBrand.preferredAudienceTypes && selectedBrand.preferredAudienceTypes.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all sm:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Audience Types</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBrand.preferredAudienceTypes.map((audience, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{audience}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Niche Community Description */}
                  {selectedBrand.nicheCommunityDescription && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all sm:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Niche Community</h4>
                      </div>
                      <p className="text-gray-300 text-sm">{selectedBrand.nicheCommunityDescription}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Gallery Tab */
                <div>
                  {selectedBrand.productPhotos && selectedBrand.productPhotos.length > 0 ? (
                    <div className="space-y-4">
                      {/* Main Image */}
                      <div className="relative rounded-xl overflow-hidden aspect-video">
                        <img
                          src={selectedBrand.productPhotos[currentImageIndex]}
                          alt={selectedBrand.brandName}
                          className="w-full h-full object-cover"
                        />
                        {selectedBrand.productPhotos.length > 1 && (
                          <>
                            <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                              <ChevronLeft className="h-5 w-5 text-white" />
                            </button>
                            <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                              <ChevronRight className="h-5 w-5 text-white" />
                            </button>
                            <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                              {currentImageIndex + 1} / {selectedBrand.productPhotos.length}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Thumbnails */}
                      {selectedBrand.productPhotos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {selectedBrand.productPhotos.map((image, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === currentImageIndex ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-gray-700 hover:border-gray-500'
                              }`}
                            >
                              <img src={image} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <Image className="h-16 w-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">No photos uploaded yet</p>
                      <p className="text-sm mt-1">This brand hasn't added any product photos</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t border-gray-800/50">
              <button
                onClick={() => handleProposeCollaboration(selectedBrand._id)}
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

export default BrowseSponsors;

