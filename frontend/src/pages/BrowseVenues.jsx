import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  MapPin, Users, Search, Filter, Building2, Coffee, 
  Music, Dumbbell, Home, Briefcase, Wine, Star,
  Heart, ArrowRight, CheckCircle, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import API_URL from '../config/api';

// Venue type icon mapping for fallback images
const VENUE_TYPE_ICONS = {
  'cafe': '☕',
  'bar': '🍺',
  'studio': '🎨',
  'club': '🎵',
  'outdoor': '🌳',
  'restaurant': '🍽️',
  'coworking': '💼',
  'other': '🏢'
};

const BrowseVenues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    city: '',
    venueType: '',
    capacityRange: '',
    amenities: [],
    availability: 'all'
  });

  const venueTypes = [
    { value: 'cafe', label: 'Café', icon: Coffee },
    { value: 'bar', label: 'Bar', icon: Wine },
    { value: 'studio', label: 'Studio', icon: Building2 },
    { value: 'club', label: 'Club', icon: Music },
    { value: 'outdoor', label: 'Outdoor Space', icon: Home },
    { value: 'restaurant', label: 'Restaurant', icon: Coffee },
    { value: 'coworking', label: 'Coworking', icon: Briefcase },
    { value: 'other', label: 'Other', icon: Building2 }
  ];

  const capacityRanges = [
    { value: '0-20', label: 'Intimate (0-20)' },
    { value: '20-40', label: 'Small (20-40)' },
    { value: '40-80', label: 'Medium (40-80)' },
    { value: '80-150', label: 'Large (80-150)' },
    { value: '150-300', label: 'Very Large (150-300)' },
    { value: '300+', label: 'Massive (300+)' }
  ];

  const amenitiesList = [
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'parking', label: 'Parking', icon: '🅿️' },
    { value: 'ac', label: 'AC', icon: '❄️' },
    { value: 'sound_system', label: 'Sound System', icon: '🔊' },
    { value: 'projector', label: 'Projector', icon: '📽️' },
    { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { value: 'bar', label: 'Bar', icon: '🍹' },
    { value: 'outdoor_seating', label: 'Outdoor', icon: '🪑' },
    { value: 'stage', label: 'Stage', icon: '🎭' },
    { value: 'dance_floor', label: 'Dance Floor', icon: '💃' }
  ];

  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [venues, searchQuery, filters]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/venues/browse');
      setVenues(response.data);
      setFilteredVenues(response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...venues];

    // Search filter - enhanced to include venue type and other searchable fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(venue => {
        // Search in basic fields
        const matchesBasicFields = 
          venue.venueName?.toLowerCase().includes(query) ||
          venue.locality?.toLowerCase().includes(query) ||
          venue.city?.toLowerCase().includes(query) ||
          venue.description?.toLowerCase().includes(query);
        
        // Search in venue type (e.g., "bar", "cafe", "studio")
        const matchesVenueType = venue.venueType?.toLowerCase().replace('_', ' ').includes(query);
        
        // Search in capacity range
        const matchesCapacity = venue.capacityRange?.toLowerCase().includes(query);
        
        // Search in amenities
        const matchesAmenities = venue.amenities?.some(amenity => 
          amenity.toLowerCase().replace('_', ' ').includes(query)
        );
        
        // Search in event suitability tags
        const matchesEventTypes = venue.eventSuitability?.some(event => 
          event.toLowerCase().replace('_', ' ').includes(query)
        );
        
        return matchesBasicFields || matchesVenueType || matchesCapacity || matchesAmenities || matchesEventTypes;
      });
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(venue => venue.city === filters.city);
    }

    // Venue type filter
    if (filters.venueType) {
      filtered = filtered.filter(venue => venue.venueType === filters.venueType);
    }

    // Capacity filter
    if (filters.capacityRange) {
      filtered = filtered.filter(venue => venue.capacityRange === filters.capacityRange);
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(venue =>
        filters.amenities.every(amenity => venue.amenities?.includes(amenity))
      );
    }

    // Availability filter
    if (filters.availability === 'available') {
      filtered = filtered.filter(venue => venue.availability === 'open_for_collaborations');
    }

    setFilteredVenues(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleAmenity = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      venueType: '',
      capacityRange: '',
      amenities: [],
      availability: 'all'
    });
    setSearchQuery('');
  };

  const getVenueIcon = (type) => {
    const venueType = venueTypes.find(v => v.value === type);
    return venueType?.icon || Building2;
  };

  const handleRequestCollaboration = (venueId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/venue/${venueId}/request-collaboration`);
  };

  const getVenueTypeIcon = (venueType) => {
    return VENUE_TYPE_ICONS[venueType] || VENUE_TYPE_ICONS['other'];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Venues
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find the perfect space for your next event
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
                placeholder="Search venues by name, location, or type..."
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
              {(filters.city || filters.venueType || filters.capacityRange || filters.amenities.length > 0) && (
                <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                  {[filters.city, filters.venueType, filters.capacityRange, ...filters.amenities].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {cities.map(city => (
                    <button
                      key={city}
                      onClick={() => handleFilterChange('city', filters.city === city ? '' : city)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.city === city
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {venueTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => handleFilterChange('venueType', filters.venueType === type.value ? '' : type.value)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filters.venueType === type.value
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capacity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacity
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {capacityRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => handleFilterChange('capacityRange', filters.capacityRange === range.value ? '' : range.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.capacityRange === range.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {amenitiesList.map(amenity => (
                    <button
                      key={amenity.value}
                      onClick={() => toggleAmenity(amenity.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.amenities.includes(amenity.value)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{amenity.icon}</span>
                      <span>{amenity.label}</span>
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
            <span className="font-semibold text-gray-900 dark:text-white">{filteredVenues.length}</span> venues found
          </p>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No venues found
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
            {filteredVenues.map((venue) => {
              const VenueIcon = getVenueIcon(venue.venueType);
              
              return (
                <div
                  key={venue._id}
                  onClick={() => navigate(`/venue/${venue._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
                >
                  {/* Venue Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {venue.photos && venue.photos[0] && !imageErrors[venue._id] ? (
                      <img
                        src={venue.photos[0]}
                        alt={venue.venueName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageErrors(prev => ({ ...prev, [venue._id]: true }))}
                      />
                    ) : (
                      <span className="text-9xl">{getVenueTypeIcon(venue.venueType)}</span>
                    )}
                    {venue.availability === 'open_for_collaborations' && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Available
                      </div>
                    )}
                  </div>

                  {/* Venue Details */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {venue.venueName}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{venue.locality}, {venue.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Venue Type & Capacity */}
                    <div className="flex items-center space-x-4 mb-3 text-sm">
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <VenueIcon className="h-4 w-4" />
                        <span className="capitalize">{venue.venueType?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>{venue.capacityRange}</span>
                      </div>
                    </div>

                    {/* Event Suitability Tags */}
                    {venue.eventSuitability && venue.eventSuitability.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {venue.eventSuitability.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Hosted Events Count */}
                    {venue.hostedEventsCount > 0 && (
                      <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-4">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Hosted {venue.hostedEventsCount} IndulgeOut events</span>
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/venue/${venue._id}`);
                        }}
                        className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <span>View Details</span>
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

export default BrowseVenues;
