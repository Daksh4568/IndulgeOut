import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  MapPin, Users, Search, Filter, Building2, Coffee, 
  Music, Dumbbell, Home, Briefcase, Wine, Star, Sparkles, Target,
  Heart, ArrowRight, CheckCircle, X, ChevronLeft, ChevronRight, FileText, Image, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import FilterBar from '../components/FilterBar';
import RotatingSearchBar from '../components/RotatingSearchBar';
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
  const [modalTab, setModalTab] = useState('overview');
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
        
        return matchesBasicFields || matchesVenueType || matchesCapacity || matchesAmenities;
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
    setModalTab('overview');
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
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#1A1A2E] to-[#0A0A0A] relative">
      <NavigationBar />
      
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' }}>
        <div className="text-center px-4">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 mb-4">
              <Building2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Coming Soon
          </h1>
          <p className="text-xl text-gray-300 mb-8" style={{ fontFamily: 'Source Serif Pro, serif' }}>
            We're working hard to bring you the best venue browsing experience
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-white text-black rounded-md font-semibold hover:bg-gray-100 transition-all"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Go Back
          </button>
        </div>
      </div>
      
      {/* Blurred Content */}
      <div className="blur-sm pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Browse Venues */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Browse Venues
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
              'Search for cafes',
              'Search for bars, studios',
              'Search for event spaces',
            ]}
          />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeVenueModal}>
          <div className="bg-zinc-950 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-800/50" onClick={(e) => e.stopPropagation()}>
            {/* Hero Banner */}
            <div className="relative h-48 sm:h-56 overflow-hidden">
              {selectedVenue.photos && selectedVenue.photos.length > 0 ? (
                <img src={selectedVenue.photos[0]} alt={selectedVenue.venueName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: 'linear-gradient(135deg, #7878E9 0%, #3D3DD4 50%, #6C3CE0 100%)' }}>
                  {getVenueTypeIcon(selectedVenue.venueType)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <button onClick={closeVenueModal} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
              {/* Availability Badge */}
              {selectedVenue.availability === 'open_for_collaborations' && (
                <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">Available</div>
              )}
            </div>

            {/* Venue Name & Location */}
            <div className="px-6 pt-3 pb-2">
              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{selectedVenue.venueName}</h3>
              <div className="flex items-center text-gray-400 text-sm mb-1">
                <MapPin className="h-4 w-4 mr-1.5 text-purple-400" />
                <span>{selectedVenue.locality}, {selectedVenue.city}</span>
              </div>
              {selectedVenue.description && <p className="text-gray-400 text-sm line-clamp-2 mt-1">{selectedVenue.description}</p>}
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
                  Gallery {selectedVenue.photos?.length > 0 && `(${selectedVenue.photos.length})`}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-340px)] px-6 py-4">
              {modalTab === 'overview' ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Venue Type */}
                  {selectedVenue.venueType && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Venue Type</h4>
                      </div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">
                        <span className="text-sm">{getVenueTypeIcon(selectedVenue.venueType)}</span>
                        <span>{getVenueTypeLabel(selectedVenue.venueType)}</span>
                      </div>
                    </div>
                  )}

                  {/* Capacity Range */}
                  {selectedVenue.capacityRange && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Capacity</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{selectedVenue.capacityRange} people</span>
                    </div>
                  )}

                  {/* Target City */}
                  {selectedVenue.city && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">City</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{selectedVenue.city}</span>
                    </div>
                  )}

                  {/* Amenities */}
                  {selectedVenue.amenities && selectedVenue.amenities.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Amenities</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVenue.amenities.map((amenity, idx) => {
                          const amenityInfo = amenitiesList.find(a => a.value === amenity);
                          return (
                            <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">
                              {amenityInfo ? amenityInfo.icon : '⭐'} {amenityInfo ? amenityInfo.label : amenity.replace('_', ' ')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Venue Rules */}
                  {selectedVenue.rules && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all sm:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Venue Rules</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 rounded-lg">
                          <span className="text-sm">🍺</span>
                          <div>
                            <p className="text-[10px] text-gray-500">Alcohol</p>
                            <p className="text-xs font-medium text-white">{selectedVenue.rules.alcoholAllowed ? 'Allowed' : 'Not Allowed'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 rounded-lg">
                          <span className="text-sm">🚭</span>
                          <div>
                            <p className="text-[10px] text-gray-500">Smoking</p>
                            <p className="text-xs font-medium text-white">{selectedVenue.rules.smokingAllowed ? 'Allowed' : 'Not Allowed'}</p>
                          </div>
                        </div>
                        {selectedVenue.rules.minimumAge && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 rounded-lg">
                            <span className="text-sm">🔞</span>
                            <div>
                              <p className="text-[10px] text-gray-500">Age Restriction</p>
                              <p className="text-xs font-medium text-white">{selectedVenue.rules.minimumAge}+ years</p>
                            </div>
                          </div>
                        )}
                        {selectedVenue.rules.soundRestrictions && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 rounded-lg">
                            <span className="text-sm">🔊</span>
                            <div>
                              <p className="text-[10px] text-gray-500">Sound</p>
                              <p className="text-xs font-medium text-white">Until 11 PM</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preferred Categories */}
                  {selectedVenue.preferredCategories?.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categories</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVenue.preferredCategories.map((cat, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{cat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Event Formats */}
                  {selectedVenue.preferredEventFormats?.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Event Formats</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVenue.preferredEventFormats.map((format, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{format}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Audience Types */}
                  {selectedVenue.preferredAudienceTypes?.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Audience Types</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVenue.preferredAudienceTypes.map((audience, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{audience}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Cities */}
                  {selectedVenue.preferredCities?.length > 0 && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preferred Cities</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVenue.preferredCities.map((city, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-purple-500/15 border border-purple-500/20">{city}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Niche Community Description */}
                  {selectedVenue.nicheCommunityDescription && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all sm:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Niche Community</h4>
                      </div>
                      <p className="text-gray-300 text-sm">{selectedVenue.nicheCommunityDescription}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Gallery Tab */
                <div>
                  {selectedVenue.photos && selectedVenue.photos.length > 0 ? (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden aspect-video">
                        <img src={selectedVenue.photos[currentImageIndex]} alt={selectedVenue.venueName} className="w-full h-full object-cover" />
                        {selectedVenue.photos.length > 1 && (
                          <>
                            <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                              <ChevronLeft className="h-5 w-5 text-white" />
                            </button>
                            <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors">
                              <ChevronRight className="h-5 w-5 text-white" />
                            </button>
                            <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                              {currentImageIndex + 1} / {selectedVenue.photos.length}
                            </div>
                          </>
                        )}
                      </div>
                      {selectedVenue.photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {selectedVenue.photos.map((photo, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === currentImageIndex ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-gray-700 hover:border-gray-500'
                              }`}
                            >
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <Image className="h-16 w-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">No photos uploaded yet</p>
                      <p className="text-sm mt-1">This venue hasn't added any photos</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t border-gray-800/50">
              <button
                onClick={() => handleRequestCollaboration(selectedVenue._id)}
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
    </div>
  );
};

export default BrowseVenues;

