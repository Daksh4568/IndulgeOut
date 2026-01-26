import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  Search, Filter, Building2, Target, TrendingUp,
  ArrowRight, X, Sparkles, Users, MapPin, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
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
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
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
      console.error('Error fetching brands:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Brands & Sponsors
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find partners to collaborate with for your events
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search brands by name, category, or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              {(filters.brandCategory || filters.targetCity || filters.sponsorshipType.length > 0 || filters.collaborationIntent.length > 0 || filters.budgetScale) && (
                <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                  {[filters.brandCategory, filters.targetCity, filters.budgetScale, ...filters.sponsorshipType, ...filters.collaborationIntent].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
              {/* Brand Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {brandCategories.map(category => (
                    <button
                      key={category.value}
                      onClick={() => handleFilterChange('brandCategory', filters.brandCategory === category.value ? '' : category.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.brandCategory === category.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target City
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {cities.map(city => (
                    <button
                      key={city}
                      onClick={() => handleFilterChange('targetCity', filters.targetCity === city ? '' : city)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.targetCity === city
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sponsorship Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sponsorship Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {sponsorshipTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => toggleArrayFilter('sponsorshipType', type.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.sponsorshipType.includes(type.value)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div>{type.label}</div>
                      <div className="text-xs opacity-75">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Collaboration Intent Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collaboration Format
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {collaborationIntents.map(intent => (
                    <button
                      key={intent.value}
                      onClick={() => toggleArrayFilter('collaborationIntent', intent.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.collaborationIntent.includes(intent.value)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{intent.icon}</span>
                      <span>{intent.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Scale Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Scale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {budgetScales.map(scale => (
                    <button
                      key={scale.value}
                      onClick={() => handleFilterChange('budgetScale', filters.budgetScale === scale.value ? '' : scale.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.budgetScale === scale.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Clear all filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{filteredBrands.length}</span> brands found
          </p>
        </div>

        {/* Brands Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBrands.map((brand) => {
              return (
              <div
                key={brand._id}
                onClick={() => navigate(`/brand/${brand._id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
              >
                {/* Brand Logo/Header */}
                <div className="relative h-32 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-6 flex items-center justify-center">
                  {brand.logo && !imageErrors[brand._id] ? (
                    <img
                      src={brand.logo}
                      alt={brand.brandName}
                      className="h-full w-auto object-contain mx-auto"
                      onError={() => setImageErrors(prev => ({ ...prev, [brand._id]: true }))}
                    />
                  ) : (
                    <span className="text-6xl">{getBrandCategoryIcon(brand.brandCategory)}</span>
                  )}
                  <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {brandCategories.find(c => c.value === brand.brandCategory)?.icon || '🏢'}
                    </span>
                  </div>
                </div>

                {/* Brand Details */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {brand.brandName}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {brand.brandDescription || 'No description available'}
                  </p>

                  {/* Category & Scale */}
                  <div className="flex items-center space-x-4 mb-3 text-xs">
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                      <Target className="h-3 w-3" />
                      <span className="capitalize">{brand.brandCategory?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                      <Globe className="h-3 w-3" />
                      <span>{getActivationScale(brand.targetCity)}</span>
                    </div>
                  </div>

                  {/* Collaboration Formats */}
                  {brand.collaborationIntent && brand.collaborationIntent.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {brand.collaborationIntent.slice(0, 3).map((intent, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                        >
                          {intent.replace('_', ' ')}
                        </span>
                      ))}
                      {brand.collaborationIntent.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          +{brand.collaborationIntent.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Budget Info */}
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-4">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>{getBudgetDisplay(brand.budget)}</span>
                  </div>

                  {/* Past Activations Count */}
                  {brand.pastActivations > 0 && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span>{brand.pastActivations} past collaborations</span>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/brand/${brand._id}`);
                      }}
                      className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseSponsors;

