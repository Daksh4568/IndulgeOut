import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api.js';
import DarkModeToggle from '../components/DarkModeToggle';
import LoadingSpinner from '../components/LoadingSpinner';
import SimpleEventsMap from '../components/SimpleEventsMap';
import { DISCOVERY_CATEGORIES, CATEGORY_ICONS } from '../constants/eventConstants';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  Star,
  Heart,
  Share2,
  Map,
  List,
  CheckCircle,
  Navigation
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import locationService from '../services/locationService';
import axios from 'axios';

const EventDiscovery = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useContext(ToastContext);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyInterested, setShowOnlyInterested] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [locationFilter, setLocationFilter] = useState('all'); // 'all', 'nearby', 'custom'
  const [customDistance, setCustomDistance] = useState(10); // km
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(9); // 3x3 grid
  const [totalEvents, setTotalEvents] = useState(0);

  const categories = DISCOVERY_CATEGORIES;

  const locations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchEvents();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCategory, selectedLocation, priceRange, showOnlyInterested, locationFilter, customDistance, userLocation, currentPage]);

  // Initialize user location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const location = await locationService.getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.warn('Could not get user location:', error);
      }
    };
    
    initializeLocation();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedLocation, priceRange, showOnlyInterested, locationFilter, customDistance]);

  const fetchEvents = async () => {
    try {
      console.log('Fetching events from:', `${API_BASE_URL}/api/events`);
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      console.log('API Response:', response.data);
      // Backend returns { events: [...], totalPages, currentPage, total }
      const eventsData = response.data.events || [];
      console.log('Events data:', eventsData);
      
      // Process events to add coordinates if they don't exist and normalize coordinate format
      const processedEvents = await Promise.all(
        eventsData.map(async (event) => {
          // Normalize coordinates format from latitude/longitude to lat/lng
          if (event.location?.coordinates?.latitude && event.location?.coordinates?.longitude) {
            event.location.coordinates = {
              lat: event.location.coordinates.latitude,
              lng: event.location.coordinates.longitude
            };
          }
          
          if (!event.coordinates && !event.location?.coordinates) {
            // Try to get coordinates from location
            const locationStr = event.location?.city || event.location?.address || event.venue;
            if (locationStr && typeof locationStr === 'string') {
              try {
                const coords = await locationService.geocodeAddress(locationStr);
                return {
                  ...event,
                  coordinates: coords
                };
              } catch (error) {
                console.warn(`Could not geocode location for event ${event.title}:`, error);
                return event;
              }
            }
          }
          return event;
        })
      );
      
      // Check if any events have coordinates (after normalization)
      const eventsWithCoords = processedEvents.filter(event => 
        (event.coordinates && event.coordinates.lat && event.coordinates.lng) ||
        (event.location?.coordinates && event.location.coordinates.lat && event.location.coordinates.lng)
      );
      
      // If no events have coordinates, use sample events for demo
      if (eventsWithCoords.length === 0 && processedEvents.length > 0) {
        console.log('No events have coordinates, using sample events for map demo');
        setSampleEvents();
        return;
      }
      
      setEvents(Array.isArray(processedEvents) ? processedEvents : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      console.error('Error details:', error.response?.data);
      // For demo purposes, set some sample events
      setSampleEvents();
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is registered for an event
  const isUserRegistered = (event) => {
    if (!user || !event.participants) return false;
    return event.participants.some(p => 
      p.user && (p.user._id === user.id || p.user === user.id)
    );
  };

  // Helper function to get category name from ID
  const getCategoryNameFromId = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Helper function to get category icon from category name
  const getCategoryIcon = (categoryName) => {
    // Use the shared category icons first
    if (CATEGORY_ICONS[categoryName]) {
      return CATEGORY_ICONS[categoryName];
    }
    
    // Fallback for legacy categories that might still exist in database
    const legacyIconMap = {
      'Mind & Soul': '🧘',
      'Music & Dance': '💃',
      'Tech & Innovation': '💻',
      'Culture & Learning': '📚',
      'Food & Drink': '🍽️',
      'Sports & Fitness': '🏃',
      'Wellness': '🌿',
      'Photography': '📸',
      'Travel': '✈️',
      'Gaming': '🎮',
      'Books': '📚',
      'Nature': '🌲'
    };
    return legacyIconMap[categoryName] || '🎉';
  };

  // Helper function to check if event matches user interests
  const matchesUserInterests = (event) => {
    return user?.interests && event.categories?.some(cat => user.interests.includes(cat));
  };

  // Function to track event clicks for analytics
  const trackEventClick = async (eventId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/events/${eventId}/click`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Event click tracked successfully');
    } catch (error) {
      console.warn('Failed to track event click:', error);
    }
  };

  // Handle event card click with tracking
  const handleEventClick = async (event) => {
    // Track the click
    await trackEventClick(event._id);
    // Navigate to event detail
    navigate(`/events/${event._id}`);
  };

  const setSampleEvents = () => {
    const sampleEvents = [
      {
        _id: '1',
        title: 'Wine Tasting & Food Pairing',
        description: 'Discover the art of wine and food pairing with expert sommeliers.',
        categories: ['Sip & Savor'],
        date: new Date('2024-11-15'),
        time: '7:00 PM',
        location: { 
          city: 'Mumbai',
          coordinates: { lat: 19.0596, lng: 72.8295 }
        },
        venue: 'The Wine Company, Bandra',
        price: { amount: 2500 },
        maxParticipants: 20,
        currentParticipants: 12,
        participants: [],
        host: { name: 'Wine Masters Mumbai' },
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500',
        rating: 4.8,
        tags: ['wine', 'food', 'networking']
      },
      {
        _id: '2',
        title: 'Morning Yoga in the Park',
        description: 'Start your day with peaceful yoga session in nature.',
        categories: ['Sweat & Play'],
        date: new Date('2024-11-12'),
        time: '6:30 AM',
        location: { 
          city: 'Bangalore',
          coordinates: { lat: 12.9716, lng: 77.5946 }
        },
        venue: 'Cubbon Park',
        price: { amount: 0 },
        maxParticipants: 30,
        currentParticipants: 18,
        participants: [],
        host: { name: 'Zen Wellness' },
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
        rating: 4.9,
        tags: ['yoga', 'wellness', 'outdoor']
      },
      {
        _id: '3',
        title: 'Digital Art Workshop',
        description: 'Learn digital illustration techniques with industry professionals.',
        categories: ['Art & DIY'],
        date: new Date('2024-11-18'),
        time: '2:00 PM',
        location: { 
          city: 'Delhi',
          coordinates: { lat: 28.6139, lng: 77.2090 }
        },
        venue: 'Creative Hub, Connaught Place',
        price: { amount: 1800 },
        maxParticipants: 15,
        currentParticipants: 8,
        participants: [],
        host: { name: 'Digital Artists Collective' },
        image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500',
        rating: 4.7,
        tags: ['art', 'digital', 'workshop']
      }
    ];
    setEvents(sampleEvents);
  };

  const filterEvents = () => {
    // Ensure events is an array before filtering
    if (!Array.isArray(events)) {
      setFilteredEvents([]);
      return;
    }
    
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      const categoryName = getCategoryNameFromId(selectedCategory);
      filtered = filtered.filter(event => 
        event.categories && event.categories.includes(categoryName)
      );
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(event => 
        event.location?.city === selectedLocation
      );
    }

    // Location-based filtering for nearby events
    if (locationFilter === 'nearby' && userLocation) {
      filtered = filtered.filter(event => {
        if (!event.coordinates && !event.location?.coordinates) return false;
        const eventCoords = event.coordinates || event.location.coordinates;
        if (!eventCoords) return false;
        
        const distance = locationService.calculateDistance(
          userLocation.lat, userLocation.lng,
          eventCoords.lat, eventCoords.lng
        );
        return distance <= customDistance;
      });
    }

    if (priceRange !== 'all') {
      filtered = filtered.filter(event => {
        const eventPrice = event.price?.amount || event.price || 0;
        switch (priceRange) {
          case 'free':
            return eventPrice === 0;
          case 'under-1000':
            return eventPrice > 0 && eventPrice < 1000;
          case 'under-2000':
            return eventPrice >= 1000 && eventPrice < 2000;
          case 'above-2000':
            return eventPrice >= 2000;
          default:
            return true;
        }
      });
    }

    // Filter by user interests if toggle is enabled
    if (showOnlyInterested && user?.interests && user.interests.length > 0) {
      filtered = filtered.filter(event =>
        event.categories?.some(cat => user.interests.includes(cat))
      );
    }

    // Sort events: upcoming events first (by date, soonest first), then past events
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const now = new Date();
      
      const isAPast = dateA < now;
      const isBPast = dateB < now;
      
      // If one is past and one is upcoming, upcoming comes first
      if (isAPast && !isBPast) return 1;
      if (!isAPast && isBPast) return -1;
      
      // If both are upcoming, show soonest first (ascending order)
      if (!isAPast && !isBPast) return dateA - dateB;
      
      // If both are past, show most recent first (descending order)
      return dateB - dateA;
    });

    // Secondary sort by interest relevance within upcoming/past groups
    if (user?.interests && user.interests.length > 0) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const now = new Date();
        
        const isAPast = dateA < now;
        const isBPast = dateB < now;
        
        // Keep upcoming/past separation
        if (isAPast !== isBPast) {
          return isAPast ? 1 : -1;
        }
        
        // Within same group (both upcoming or both past), prioritize interest matches
        const aMatches = a.categories?.some(cat => user.interests.includes(cat)) ? 1 : 0;
        const bMatches = b.categories?.some(cat => user.interests.includes(cat)) ? 1 : 0;
        
        if (aMatches !== bMatches) {
          return bMatches - aMatches;
        }
        
        // If interest match is same, sort by date
        if (!isAPast && !isBPast) return dateA - dateB; // Upcoming: soonest first
        return dateB - dateA; // Past: most recent first
      });
    }

    // Set total count for pagination
    setTotalEvents(filtered.length);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * eventsPerPage;
    const paginatedEvents = filtered.slice(startIndex, startIndex + eventsPerPage);

    setFilteredEvents(paginatedEvents);
  };

  const handleEventRegister = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.warning('Please log in to register for events');
        navigate('/login');
        return;
      }

      await axios.post(`${API_BASE_URL}/api/events/${eventId}/register`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Successfully registered for the event!');
      fetchEvents(); // Refresh events to update participant count
    } catch (error) {
      console.error('Error registering for event:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to register for event. Please try again.');
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading amazing events..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Discover Events</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 line-clamp-2">
                Find events that match your interests and connect with like-minded people
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <DarkModeToggle />
              {user && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 sm:px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters - Mobile Optimized */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[44px] text-base"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px] min-w-[44px] touch-manipulation flex-1 sm:flex-initial"
                >
                  <Filter className="h-5 w-5" />
                  <span className="sm:inline">Filters</span>
                </button>
                {user?.interests && user.interests.length > 0 && (
                  <button
                    onClick={() => setShowOnlyInterested(!showOnlyInterested)}
                    className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation ${
                      showOnlyInterested
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${showOnlyInterested ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">My Interests</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills - Mobile Scrollable */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-2 min-w-max sm:flex-wrap sm:min-w-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap min-h-[44px] touch-manipulation ${
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle and Location Controls - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 min-h-[44px] touch-manipulation ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden xs:inline">List View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 min-h-[44px] touch-manipulation ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Map className="h-4 w-4" />
                <span className="hidden xs:inline">Map View</span>
              </button>
            </div>

            {/* Location Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setLocationFilter('all')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 min-h-[44px] touch-manipulation ${
                    locationFilter === 'all'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setLocationFilter('nearby')}
                  disabled={!userLocation}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 min-h-[44px] touch-manipulation ${
                    locationFilter === 'nearby'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50'
                  }`}
                >
                  <Navigation className="h-3 w-3 inline mr-1" />
                  Nearby
                </button>
              </div>
              
              {locationFilter === 'nearby' && userLocation && (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Within</span>
                  <select
                    value={customDistance}
                    onChange={(e) => setCustomDistance(Number(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[40px]"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="all">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free</option>
                    <option value="under-1000">Under ₹1,000</option>
                    <option value="under-2000">₹1,000 - ₹2,000</option>
                    <option value="above-2000">Above ₹2,000</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedLocation('all');
                      setPriceRange('all');
                      setSearchTerm('');
                      setLocationFilter('all');
                      setCurrentPage(1);
                    }}
                    className="w-full bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Found {totalEvents} event{totalEvents !== 1 ? 's' : ''} 
            {user?.interests && user.interests.length > 0 && (
              <span> matching your interests</span>
            )}
            {totalEvents > eventsPerPage && (
              <span> • Showing page {currentPage} of {Math.ceil(totalEvents / eventsPerPage)}</span>
            )}
          </p>
        </div>

        {/* Events Display - List or Map View */}
        {viewMode === 'map' ? (
          <div className="h-96 md:h-[600px] w-full rounded-lg overflow-hidden shadow-lg">
            {(() => {
              // Filter events to only include those with valid coordinates for the map
              const eventsWithCoordinates = filteredEvents.filter(event => {
                const hasCoords = (event.coordinates && 
                                   typeof event.coordinates.lat === 'number' && 
                                   typeof event.coordinates.lng === 'number') ||
                                 (event.coordinates && 
                                   typeof event.coordinates.latitude === 'number' && 
                                   typeof event.coordinates.longitude === 'number') ||
                                 (event.location?.coordinates && 
                                   typeof event.location.coordinates.lat === 'number' && 
                                   typeof event.location.coordinates.lng === 'number') ||
                                 (event.location?.coordinates && 
                                   typeof event.location.coordinates.latitude === 'number' && 
                                   typeof event.location.coordinates.longitude === 'number');
                
                if (!hasCoords) {
                  console.log('Filtering out event without coordinates:', event.title);
                }
                return hasCoords;
              });
              
              console.log('Rendering map with filteredEvents:', filteredEvents.length, 'eventsWithCoordinates:', eventsWithCoordinates.length);
              console.log('User location:', userLocation);
              return (
                <SimpleEventsMap 
                  events={eventsWithCoordinates}
                  userLocation={userLocation}
                  onEventSelect={(event) => handleEventClick(event)}
                />
              );
            })()}
          </div>
        ) : (
          <>
            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search criteria or explore different categories.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setPriceRange('all');
                    setLocationFilter('all');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Show All Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEvents.map((event) => {
              const isPastEvent = new Date(event.date) < new Date();
              const isRegistered = isUserRegistered(event);
              return (
              <div 
                key={event._id} 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 touch-manipulation ${isPastEvent ? 'opacity-75' : ''}`}
                onClick={() => handleEventClick(event)}
              >
                {/* Event Image */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                  {isPastEvent && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
                      <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Event Ended
                      </span>
                    </div>
                  )}
                  {isRegistered && !isPastEvent && (
                    <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                      <CheckCircle className="h-3 w-3" />
                      Registered
                    </div>
                  )}
                  {event.images && event.images.length > 0 ? (
                    <img
                      src={event.images[0]}
                      alt={event.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback when no image or image fails to load */}
                  <div className={`w-full h-full flex flex-col items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 transition-all duration-300 hover:from-gray-50 hover:to-gray-150 dark:hover:from-gray-600 dark:hover:to-gray-700 ${event.images && event.images.length > 0 ? 'hidden' : 'flex'}`}>
                    <div className="text-center transform transition-transform duration-300 hover:scale-110">
                      <div className="mb-2 drop-shadow-sm filter hover:drop-shadow-lg transition-all duration-300">
                        {/* Map category to emoji based on event categories */}
                        {event.categories && event.categories.length > 0 ? 
                          getCategoryIcon(event.categories[0]) : '🎉'}
                      </div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider px-2 py-1 rounded-full bg-white dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70 backdrop-blur-sm">
                        {event.categories && event.categories.length > 0 ? event.categories[0] : 'Event'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Badge */}
                  {(event.price && event.price.amount === 0) || (!event.price) ? (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      FREE
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      ₹{event.price?.amount || event.price}
                    </div>
                  )}
                </div>

                {/* Simplified Event Details - Mobile Optimized */}
                <div className="p-3 sm:p-4">
                  {/* Category */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                      {event.categories && event.categories.length > 0 ? event.categories[0] : 'Event'}
                    </span>
                  </div>

                  {/* Event Name */}
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Date and Location */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {new Date(event.date).toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })} • {event.time}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {event.venue ? `${event.venue}, ` : ''}{typeof event.location === 'string' ? event.location : event.location?.city || event.location?.address || 'Location TBD'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Pagination Controls - Mobile Responsive */}
        {viewMode === 'list' && totalEvents > eventsPerPage && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              Showing {((currentPage - 1) * eventsPerPage) + 1}-{Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents} events
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 min-h-[44px] touch-manipulation"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              {/* Page Numbers */}
              <div className="flex">
                {Array.from({ length: Math.ceil(totalEvents / eventsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(totalEvents / eventsPerPage);
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, arr) => (
                    <React.Fragment key={page}>
                      {index > 0 && arr[index - 1] !== page - 1 && (
                        <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium border-t border-b ${
                          currentPage === page
                            ? 'text-blue-600 bg-blue-50 border-blue-500 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalEvents / eventsPerPage)))}
                disabled={currentPage === Math.ceil(totalEvents / eventsPerPage)}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 min-h-[44px] touch-manipulation"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </>
    )}
      </div>
    </div>
  );
};

export default EventDiscovery;