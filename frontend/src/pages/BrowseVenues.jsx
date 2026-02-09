import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  MapPin, Users, Search, Filter, Building2, Coffee, 
  Music, Dumbbell, Home, Briefcase, Wine, Star,
  Heart, ArrowRight, CheckCircle, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import FilterBar from '../components/FilterBar';
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
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const venuesPerPage = 8;
  
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
    setCurrentPage(1); // Reset to first page when filters change
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
    navigate('/collaboration/proposal?type=communityToVenue', {
      state: { 
        proposalType: 'communityToVenue',
        recipientId: venueId,
        recipientType: 'venue'
      }
    });
  };

  const getVenueTypeIcon = (venueType) => {
    return VENUE_TYPE_ICONS[venueType] || VENUE_TYPE_ICONS['other'];
  };

  const getVenueTypeLabel = (type) => {
    const venueType = venueTypes.find(v => v.value === type);
    return venueType ? venueType.label : type;
  };

  const openVenueModal = (venue) => {
    setSelectedVenue(venue);
    setCurrentImageIndex(0);
  };

  const closeVenueModal = () => {
    setSelectedVenue(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedVenue && selectedVenue.images) {
      setCurrentImageIndex((prev) => 
        (prev + 1) % selectedVenue.images.length
      );
    }
  };

  const prevImage = () => {
    if (selectedVenue && selectedVenue.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedVenue.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Browse Venues */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Browse Venues
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

        {/* All Venues Title */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
            All Venues
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
            <span className="font-semibold text-gray-900 dark:text-white">{filteredVenues.length}</span> venues found
          </p>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
            {filteredVenues
              .slice((currentPage - 1) * venuesPerPage, currentPage * venuesPerPage)
              .map((venue) => (
              <div
                key={venue._id}
                onClick={() => openVenueModal(venue)}
                className="bg-zinc-900 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col h-full"
              >
                {/* Venue Image with Gradient Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    }}
                  />
                  {venue.photos && venue.photos.length > 0 ? (
                    <img
                      src={venue.photos[0]}
                      alt={venue.venueName}
                      className="w-full h-full object-cover mix-blend-overlay"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl relative z-10">
                      {getVenueTypeIcon(venue.venueType)}
                    </div>
                  )}
                  {/* Availability Badge */}
                  {venue.availability === 'open_for_collaborations' && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                      Available
                    </div>
                  )}
                </div>

                {/* Venue Info */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-white font-bold text-lg mb-1">{venue.venueName}</h3>
                  <div className="flex items-center text-gray-400 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{venue.locality}, {venue.city}</span>
                  </div>

                  {/* Venue Type & Capacity */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Building2 className="h-4 w-4" />
                      <span className="capitalize">{venue.venueType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>{venue.capacityRange}</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {venue.amenities && venue.amenities.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Amenities</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {venue.amenities.slice(0, 3).map((amenity, idx) => {
                          const amenityInfo = amenitiesList.find(a => a.value === amenity);
                          return (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs"
                            >
                              {amenityInfo ? amenityInfo.icon : '⭐'} {amenity.replace('_', ' ')}
                            </span>
                          );
                        })}
                        {venue.amenities.length > 3 && (
                          <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs">
                            +{venue.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Suitability */}
                  {venue.eventSuitability && venue.eventSuitability.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-2">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Event Types</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {venue.eventSuitability.slice(0, 3).map((type, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Collaboration Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestCollaboration(venue._id);
                    }}
                    className="w-full py-2.5 rounded-lg font-medium text-white transition-all mt-auto"
                    style={{
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    }}
                  >
                    Request Collaboration
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredVenues.length > venuesPerPage && (
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
                {[...Array(Math.ceil(filteredVenues.length / venuesPerPage))].map((_, index) => {
                  const pageNumber = index + 1;
                  const totalPages = Math.ceil(filteredVenues.length / venuesPerPage);
                  
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredVenues.length / venuesPerPage)))}
                disabled={currentPage === Math.ceil(filteredVenues.length / venuesPerPage)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === Math.ceil(filteredVenues.length / venuesPerPage)
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

      {/* Venue Detail Modal */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeVenueModal}>
          <div className="bg-black rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>Venue Overview</h2>
              <button
                onClick={closeVenueModal}
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
                    {selectedVenue.photos && selectedVenue.photos.length > 0 ? (
                      <>
                        <img
                          src={selectedVenue.photos[currentImageIndex]}
                          alt={selectedVenue.venueName}
                          className="w-full h-full object-cover"
                        />
                        {selectedVenue.photos.length > 1 && (
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
                              {currentImageIndex + 1} / {selectedVenue.photos.length}
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
                        {getVenueTypeIcon(selectedVenue.venueType)}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Images */}
                  {selectedVenue.photos && selectedVenue.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedVenue.photos.map((photo, idx) => (
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

                {/* Right Column - Venue Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>{selectedVenue.venueName}</h3>
                    <div className="flex items-center text-gray-400 mb-2">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{selectedVenue.locality}, {selectedVenue.city}</span>
                    </div>
                    <p className="text-gray-400">{selectedVenue.description || 'Discover the perfect venue for your next event'}</p>
                  </div>

                  {/* Venue Type */}
                  {selectedVenue.venueType && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Venue Type</h4>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white" style={{
                        background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                      }}>
                        <span className="text-lg">{getVenueTypeIcon(selectedVenue.venueType)}</span>
                        <span className="font-medium">{getVenueTypeLabel(selectedVenue.venueType)}</span>
                      </div>
                    </div>
                  )}

                  {/* Target Cities */}
                  {selectedVenue.city && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Target Cities</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium">
                          {selectedVenue.city}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Capacity Range */}
                  {selectedVenue.capacityRange && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Capacity Range</h4>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg">
                        <Users className="h-5 w-5 text-purple-400" />
                        <span className="font-medium">{selectedVenue.capacityRange} people</span>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {selectedVenue.amenities && selectedVenue.amenities.length > 0 && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedVenue.amenities.map((amenity, idx) => {
                          const amenityInfo = amenitiesList.find(a => a.value === amenity);
                          return (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2 font-medium"
                            >
                              <span>{amenityInfo ? amenityInfo.icon : '⭐'}</span>
                              <span>{amenityInfo ? amenityInfo.label : amenity.replace('_', ' ')}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Venue Rules */}
                  {selectedVenue.rules && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Venue Rules</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                          <span className="text-lg">🍺</span>
                          <div>
                            <p className="text-xs text-gray-400">Alcohol</p>
                            <p className="text-sm font-medium text-white">
                              {selectedVenue.rules.alcoholAllowed ? 'Allowed' : 'Not Allowed'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                          <span className="text-lg">🚭</span>
                          <div>
                            <p className="text-xs text-gray-400">Smoking</p>
                            <p className="text-sm font-medium text-white">
                              {selectedVenue.rules.smokingAllowed ? 'Allowed' : 'Not Allowed'}
                            </p>
                          </div>
                        </div>
                        {selectedVenue.rules.minimumAge && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                            <span className="text-lg">🔞</span>
                            <div>
                              <p className="text-xs text-gray-400">Age Restriction</p>
                              <p className="text-sm font-medium text-white">{selectedVenue.rules.minimumAge}+ years</p>
                            </div>
                          </div>
                        )}
                        {selectedVenue.rules.soundRestrictions && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                            <span className="text-lg">🔊</span>
                            <div>
                              <p className="text-xs text-gray-400">Sound</p>
                              <p className="text-sm font-medium text-white">Until 11 PM</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Suitability */}
                  {selectedVenue.eventSuitability && selectedVenue.eventSuitability.length > 0 && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Suitable For</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedVenue.eventSuitability.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gray-800 text-purple-400 rounded-lg font-medium"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Venue Scales */}
                  {selectedVenue.venueScales && selectedVenue.venueScales.length > 0 && (
                    <div className="bg-zinc-900 p-4 rounded-lg border border-transparent hover:border-[#7878E9]/50 hover:bg-gradient-to-r hover:from-[#7878E9]/20 hover:to-[#3D3DD4]/10 transition-all duration-300 cursor-pointer">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Venue Scales</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedVenue.venueScales.map((scale, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium"
                          >
                            {scale}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Propose Campaign Button */}
                  <button
                    onClick={() => handleRequestCollaboration(selectedVenue._id)}
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

export default BrowseVenues;

