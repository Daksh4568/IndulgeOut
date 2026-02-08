import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  Search, Filter, Building2, Target, TrendingUp,
  ArrowRight, X, Sparkles, Users, MapPin, Globe, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import FilterBar from '../components/FilterBar';
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
    collaborationIntent: [],
    budgetScale: ''
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

  const budgetScales = [
    { value: 'micro', label: 'Micro (₹0-50K)' },
    { value: 'mid', label: 'Mid (₹50K-2L)' },
    { value: 'large', label: 'Large (₹2L+)' }
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

    // Budget filter
    if (filters.budgetScale) {
      filtered = filtered.filter(brand => {
        const max = brand.budget?.max || 0;
        if (filters.budgetScale === 'micro') return max <= 50000;
        if (filters.budgetScale === 'mid') return max > 50000 && max <= 200000;
        if (filters.budgetScale === 'large') return max > 200000;
        return true;
      });
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
      collaborationIntent: [],
      budgetScale: ''
    });
    setSearchQuery('');
  };

  const handleProposeCollaboration = (brandId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/brand/${brandId}/propose-collaboration`);
  };

  const getBrandCategoryIcon = (category) => {
    return BRAND_CATEGORY_ICONS[category] || BRAND_CATEGORY_ICONS['other'];
  };

  const getBudgetDisplay = (budget) => {
    if (!budget || (!budget.min && !budget.max)) return 'Budget not specified';
    if (budget.min && budget.max) {
      return `₹${(budget.min / 1000).toFixed(0)}K - ₹${(budget.max / 1000).toFixed(0)}K`;
    }
    if (budget.max) {
      return `Up to ₹${(budget.max / 1000).toFixed(0)}K`;
    }
    return 'Flexible budget';
  };

  const getActivationScale = (targetCity) => {
    if (!targetCity || targetCity.length === 0) return 'National';
    if (targetCity.length === 1) return 'City-specific';
    if (targetCity.length <= 3) return 'Multi-city';
    return 'Pan-India';
  };

  const getBrandCategoryLabel = (category) => {
    const cat = brandCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const openBrandModal = (brand) => {
    setSelectedBrand(brand);
    setCurrentImageIndex(0);
  };

  const closeBrandModal = () => {
    setSelectedBrand(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedBrand && selectedBrand.images) {
      setCurrentImageIndex((prev) => 
        (prev + 1) % selectedBrand.images.length
      );
    }
  };

  const prevImage = () => {
    if (selectedBrand && selectedBrand.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedBrand.images.length - 1 : prev - 1
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
          <p className="text-gray-400 text-base">
            Join communities and circles for your interests and hobbies
          </p>
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
                {/* Brand Image with Gradient Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    }}
                  />
                  {brand.images && brand.images.length > 0 ? (
                    <img
                      src={brand.images[0]}
                      alt={brand.brandName}
                      className="w-full h-full object-cover mix-blend-overlay"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl relative z-10">
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
          <div className="bg-black rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>Brand Overview</h2>
              <button
                onClick={closeBrandModal}
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
                    {selectedBrand.images && selectedBrand.images.length > 0 ? (
                      <>
                        <img
                          src={selectedBrand.images[currentImageIndex]}
                          alt={selectedBrand.brandName}
                          className="w-full h-full object-cover"
                        />
                        {selectedBrand.images.length > 1 && (
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
                              {currentImageIndex + 1} / {selectedBrand.images.length}
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
                        {getBrandCategoryIcon(selectedBrand.brandCategory)}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Images */}
                  {selectedBrand.images && selectedBrand.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedBrand.images.map((image, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex ? 'border-purple-500' : 'border-transparent'
                          }`}
                        >
                          <img src={image} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column - Brand Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>{selectedBrand.brandName}</h3>
                    <p className="text-gray-400">{selectedBrand.brandDescription || 'Discover collaboration opportunities'}</p>
                  </div>

                  {/* Brand Category */}
                  {selectedBrand.brandCategory && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Brand Category</h4>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white" style={{
                        background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                      }}>
                        <span className="text-lg">{getBrandCategoryIcon(selectedBrand.brandCategory)}</span>
                        <span className="font-medium">{getBrandCategoryLabel(selectedBrand.brandCategory)}</span>
                      </div>
                    </div>
                  )}

                  {/* Target Cities */}
                  {selectedBrand.targetCity && selectedBrand.targetCity.length > 0 && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Target Cities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedBrand.targetCity.map((city, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium"
                          >
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sponsorship Type */}
                  {selectedBrand.sponsorshipType && selectedBrand.sponsorshipType.length > 0 && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Sponsorship Type</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedBrand.sponsorshipType.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gray-800 text-purple-400 rounded-lg flex items-center gap-2 font-medium"
                          >
                            <Sparkles className="h-4 w-4" />
                            {type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collaboration Intent */}
                  {selectedBrand.collaborationIntent && selectedBrand.collaborationIntent.length > 0 && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Collaboration Intent</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedBrand.collaborationIntent.map((intent, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium"
                          >
                            {intent.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Propose Campaign Button */}
                  <button
                    onClick={() => handleProposeCollaboration(selectedBrand._id)}
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

export default BrowseSponsors;

