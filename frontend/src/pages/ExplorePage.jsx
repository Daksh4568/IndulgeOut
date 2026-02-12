import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, MapPin, Calendar, Lock } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import EventCard from '../components/EventCard';
import CommunityCard from '../components/CommunityCard';
import LoginPromptModal from '../components/LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tab = searchParams.get('tab') || 'events';

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  // Events state
  const [topEvents, setTopEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Cache all events for client-side pagination
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPagination, setEventsPagination] = useState(null);
  const [savedEventIds, setSavedEventIds] = useState([]);
  
  // Communities state
  const [featuredCommunities, setFeaturedCommunities] = useState([]);
  const [lockedCommunities, setLockedCommunities] = useState([]);
  const [communitiesPage, setCommunitiesPage] = useState(1);
  const [communitiesPagination, setCommunitiesPagination] = useState(null);

  // Modal state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // People tab state
  const [peopleFilter, setPeopleFilter] = useState('recommended');
  
  // Carousel state
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = direction === 'left' 
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;
      carouselRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const scrollToSlide = (index) => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.scrollWidth / topEvents.length;
      carouselRef.current.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
      setCurrentCarouselIndex(index);
    }
  };

  // Track carousel scroll position
  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.scrollWidth / topEvents.length;
      const currentIndex = Math.round(carouselRef.current.scrollLeft / slideWidth);
      setCurrentCarouselIndex(currentIndex);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      fetchSavedEvents();
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'events') {
      fetchEvents();
    } else if (tab === 'communities') {
      fetchCommunities();
    }
  }, [tab, searchQuery, filters]); // Removed eventsPage and communitiesPage from dependencies

  // Handle events pagination client-side when page changes
  useEffect(() => {
    if (tab === 'events' && allEvents.length > 0) {
      const itemsPerPage = 8;
      const totalPages = Math.ceil(allEvents.length / itemsPerPage);
      const startIdx = (eventsPage - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const paginatedEvents = allEvents.slice(startIdx, endIdx);
      
      setEventsPagination({
        page: eventsPage,
        limit: itemsPerPage,
        total: allEvents.length,
        totalPages: totalPages
      });
      
      setEvents(paginatedEvents);
      console.log('📄 Page changed to', eventsPage, '- showing', paginatedEvents.length, 'of', allEvents.length, 'events');
    }
  }, [eventsPage, allEvents, tab]);

  // Handle communities pagination when page changes
  useEffect(() => {
    if (tab === 'communities') {
      // Communities page change will be handled in the render
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [communitiesPage, tab]);

  // Fetch saved events
  const fetchSavedEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/my-events`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      const savedIds = (data.saved || []).map(event => event._id);
      setSavedEventIds(savedIds);
    } catch (error) {
      console.error('Error fetching saved events:', error);
    }
  };

  // Fetch events data
  const fetchEvents = async () => {
    console.log('🔄 Fetching events... Query:', searchQuery, 'Filters:', filters, 'Page:', eventsPage);
    setLoading(true);
    try {
      // Fetch top events (recommended if logged in, popular if not)
      const topEndpoint = user
        ? `${API_URL}/api/explore/events/recommended?limit=6&page=1`
        : `${API_URL}/api/explore/events/popular?limit=6&page=1`;
      
      console.log('📡 Fetching top events from:', topEndpoint);
      const topResponse = await fetch(topEndpoint, {
        headers: user ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}
      });
      const topData = await topResponse.json();
      console.log('✅ Top events received:', topData.events?.length || 0, 'events');
      
      // Filter to only show upcoming events (future dates)
      const now = new Date();
      const upcomingEvents = (topData.events || []).filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now;
      });
      console.log('✅ Upcoming events (future only):', upcomingEvents.length, 'events');
      setTopEvents(upcomingEvents);

      // Fetch ALL events at once with a large limit to work around backend pagination bug
      // Backend has pagination issues, so we fetch all events and paginate client-side
      let eventsEndpoint = `${API_URL}/api/explore/events/popular?limit=100&page=1`;
      
      if (searchQuery) {
        eventsEndpoint = `${API_URL}/api/explore/events/search?q=${encodeURIComponent(searchQuery)}&limit=100&page=1`;
      } else if (filters.useGeolocation && filters.userLocation) {
        eventsEndpoint = `${API_URL}/api/explore/events/nearby?lat=${filters.userLocation.lat}&lng=${filters.userLocation.lng}&radius=50&limit=100&page=1`;
      }

      const eventsResponse = await fetch(eventsEndpoint);
      const eventsData = await eventsResponse.json();
      console.log('✅ Main events received:', eventsData.events?.length || 0, 'events');
      
      // Store all events for client-side pagination
      const fetchedEvents = eventsData.events || [];
      setAllEvents(fetchedEvents);
      
      // Client-side pagination (8 events per page)
      const itemsPerPage = 8;
      const totalPages = Math.ceil(fetchedEvents.length / itemsPerPage);
      const startIdx = (eventsPage - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const paginatedEvents = fetchedEvents.slice(startIdx, endIdx);
      
      // Set custom pagination object
      setEventsPagination({
        page: eventsPage,
        limit: itemsPerPage,
        total: fetchedEvents.length,
        totalPages: totalPages
      });
      
      setEvents(paginatedEvents);
      console.log('📊 Final events count:', paginatedEvents.length, 'of', fetchedEvents.length, 'total');
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setTopEvents([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch communities data
  const fetchCommunities = async () => {
    console.log('🔄 Fetching communities... Query:', searchQuery, 'Page:', communitiesPage);
    setLoading(true);
    try {
      let featuredEndpoint = `${API_URL}/api/explore/communities/featured?limit=8&page=${communitiesPage}`;
      
      // If there's a search query, use search endpoint instead
      if (searchQuery) {
        featuredEndpoint = `${API_URL}/api/explore/communities/search?q=${encodeURIComponent(searchQuery)}&limit=8&page=${communitiesPage}`;
      }
      
      console.log('📡 Fetching communities from:', featuredEndpoint);
      const featuredResponse = await fetch(featuredEndpoint);
      const featuredData = await featuredResponse.json();
      console.log('✅ Communities received:', featuredData.communities?.length || 0);
      setFeaturedCommunities(featuredData.communities || []);
      setCommunitiesPagination(featuredData.pagination);

      // Generate locked placeholder communities only if not searching
      if (!searchQuery) {
        const locked = Array(10).fill(null).map((_, index) => ({
          _id: `locked-${index}`,
          name: `Community ${index + 1}`,
          description: 'This is a locked community. Download the app to view.',
          category: 'Social Mixers',
          memberCount: Math.floor(Math.random() * 500) + 100,
          location: { city: 'Los Angeles', state: 'CA' }
        }));
        setLockedCommunities(locked);
      } else {
        setLockedCommunities([]);
      }
    } catch (error) {
      console.error('❌ Error fetching communities:', error);
      setFeaturedCommunities([]);
      setLockedCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query || '');
    setEventsPage(1); // Reset to first page on search
    setCommunitiesPage(1);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({});
    setEventsPage(1);
    setCommunitiesPage(1);
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setEventsPage(1); // Reset to first page on filter change
  };

  // Handle favorite (requires login)
  const handleFavorite = async (eventId) => {
    if (!user) {
      setShowLoginPrompt(true);
      return false;
    }
    
    try {
      const isSaved = savedEventIds.includes(eventId);
      
      if (isSaved) {
        // Unsave event
        await fetch(`${API_URL}/api/users/unsave-event/${eventId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSavedEventIds(prev => prev.filter(id => id !== eventId));
      } else {
        // Save event
        await fetch(`${API_URL}/api/users/save-event/${eventId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSavedEventIds(prev => [...prev, eventId]);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
      return false;
    }
  };

  // Handle tab change
  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  // Get sorted people connections based on filter
  const getSortedPeople = () => {
    const allPeople = [
      { name: 'Alex Johnson', interests: 'Music, Art, Travel', distance: 2.5, emoji: '👤', bgColor: 'from-purple-500 to-purple-700', isActive: true },
      { name: 'Sarah Williams', interests: 'Food, Photography, Yoga', distance: 3.8, emoji: '👤', bgColor: 'from-pink-500 to-pink-700', isActive: false },
      { name: 'Mike Davis', interests: 'Sports, Tech, Gaming', distance: 1.2, emoji: '👤', bgColor: 'from-blue-500 to-blue-700', isActive: true },
      { name: 'Emma Brown', interests: 'Dance, Fashion, Books', distance: 4.5, emoji: '👤', bgColor: 'from-indigo-500 to-indigo-700', isActive: false },
      { name: 'Chris Wilson', interests: 'Music, Comedy, Movies', distance: 5.0, emoji: '👤', bgColor: 'from-violet-500 to-violet-700', isActive: true },
      { name: 'Lisa Martinez', interests: 'Art, Wellness, Nature', distance: 2.1, emoji: '👤', bgColor: 'from-fuchsia-500 to-fuchsia-700', isActive: false },
      { name: 'David Lee', interests: 'Business, Tech, Coffee', distance: 3.3, emoji: '👤', bgColor: 'from-cyan-500 to-cyan-700', isActive: true },
      { name: 'Rachel Taylor', interests: 'Fitness, Travel, Food', distance: 1.8, emoji: '👤', bgColor: 'from-rose-500 to-rose-700', isActive: false },
    ];

    switch(peopleFilter) {
      case 'nearby':
        return [...allPeople].sort((a, b) => a.distance - b.distance);
      case 'new':
        return [...allPeople].reverse();
      case 'active':
        return allPeople.filter(p => p.isActive).concat(allPeople.filter(p => !p.isActive));
      case 'under10km':
        return allPeople.filter(p => p.distance <= 10);
      case 'recommended':
      default:
        return allPeople;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <NavigationBar />
      
      {/* Hero Section */}
      <div className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {tab === 'communities' ? 'Discover Communities' : tab === 'people' ? 'Discover Connections' : 'Discover Events'}
            </h1>
            <p className="text-gray-300 text-lg" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {tab === 'communities' ? 'Join communities and circles for your interests and hobbies' : tab === 'people' ? 'Connect with like-minded people around you' : 'Explore and join curated experiences in your city'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              onSearch={handleSearch}
              placeholder={tab === 'people' ? 'Search people...' : 'Search events, communities, people...'}
              searchType={tab === 'communities' ? 'communities' : 'events'}
            />
          </div>

          {/* Tab Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => handleTabChange('events')}
              className={`w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 ${
                tab === 'events'
                  ? 'text-white shadow-2xl'
                  : 'bg-[#3A3A52] text-gray-300 hover:bg-[#4A4A62]'
              }`}
              style={tab === 'events' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' } : { fontFamily: 'Oswald, sans-serif' }}
            >
              Events
            </button>
            <button
              onClick={() => handleTabChange('communities')}
              className={`w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 ${
                tab === 'communities'
                  ? 'text-white shadow-2xl'
                  : 'bg-[#3A3A52] text-gray-300 hover:bg-[#4A4A62]'
              }`}
              style={tab === 'communities' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' } : { fontFamily: 'Oswald, sans-serif' }}
            >
              Communities
            </button>
            <button
              onClick={() => handleTabChange('people')}
              className={`w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 relative ${
                tab === 'people'
                  ? 'text-white shadow-2xl'
                  : 'bg-[#3A3A52] text-gray-300 hover:bg-[#4A4A62]'
              }`}
              style={tab === 'people' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' } : { fontFamily: 'Oswald, sans-serif' }}
            >
              People
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">\n        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* Events Tab */}
            {tab === 'events' && (
              <div className="space-y-12">
                {/* Upcoming Events Section - Horizontal Carousel */}
                {!searchQuery && topEvents.length > 0 && (
                  <section className="py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden rounded-2xl p-6 sm:p-8">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Upcoming Events
                      </h2>
                      <p className="text-gray-400 text-base" style={{ fontFamily: 'Source Serif Pro, serif' }}>Don't miss these popular experiences</p>
                    </div>
                    <div className="relative">
                      {/* Left Arrow */}
                      <button
                        onClick={() => scrollCarousel('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hidden sm:block"
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-800" />
                      </button>

                      {/* Carousel */}
                      <div 
                        ref={carouselRef}
                        onScroll={handleCarouselScroll}
                        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth px-4 sm:px-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {topEvents.map((event, index) => (
                          <div 
                            key={event._id} 
                            className="flex-none w-[90vw] sm:w-[550px] lg:w-[600px] snap-center"
                            style={{
                              animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                            }}
                          >
                            {/* Event Card */}
                            <div className="bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                              <div className="flex flex-row min-h-[280px] max-h-[320px]">
                                {/* Left Side - Content */}
                                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                                  <div>
                                    {/* Date */}
                                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                                      <Calendar className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm font-bold" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} · {event.time || '6:30 PM'}
                                      </span>
                                    </div>
                                    
                                    {/* Title */}
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                      {event.title}
                                    </h3>
                                    
                                    {/* Category/Type */}
                                    <p className="text-sm text-gray-700 mb-3 font-semibold" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                      {event.category || 'Live Performances'} · {event.type || 'Music'} · {event.genre || 'Alternative'}
                                    </p>
                                    
                                    {/* Location */}
                                    <div className="flex items-start gap-2 text-gray-700 mb-3">
                                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm font-bold line-clamp-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                        {event.location?.address || event.location?.venue || event.location?.city}, {event.location?.state || event.location?.city}
                                      </span>
                                    </div>
                                    
                                    {/* Price */}
                                    <div className="mb-3">
                                      <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                        ₹{event.price?.amount || 499} onwards
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Button */}
                                  <button
                                    onClick={() => window.location.href = `/events/${event._id}`}
                                    className="w-full text-white px-8 py-2.5 rounded-md text-base font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-xl"
                                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                                  >
                                    Get your Ticket
                                  </button>
                                </div>

                                {/* Right Side - Image */}
                                <div className="w-[45%] p-4 flex items-center justify-center">
                                  <div className="relative w-full max-w-[250px]">
                                    {/* Shadow frame effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg transform rotate-2 shadow-2xl"></div>
                                    
                                    {/* Image container */}
                                    <div className="relative bg-white rounded-lg overflow-hidden shadow-xl aspect-[3/4]">
                                      {event.images && event.images.length > 0 ? (
                                        <img
                                          src={event.images[0]}
                                          alt={event.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <img
                                          src="/images/postercard1.jpg"
                                          alt="Event placeholder"
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right Arrow */}
                      <button
                        onClick={() => scrollCarousel('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hidden sm:block"
                      >
                        <ChevronRight className="h-6 w-6 text-gray-800" />
                      </button>
                    </div>

                    {/* Carousel Dots */}
                    {topEvents.length > 1 && (
                      <div className="hidden sm:flex justify-center gap-2 mt-6">
                        {topEvents.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => scrollToSlide(index)}
                            className={`rounded-full transition-all ${
                              index === currentCarouselIndex
                                ? 'w-8 h-2 bg-[#7878E9]'
                                : 'w-2 h-2 bg-gray-500 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                    <style>{`
                      @keyframes slideIn {
                        from {
                          opacity: 0;
                          transform: translateX(30px);
                        }
                        to {
                          opacity: 1;
                          transform: translateX(0);
                        }
                      }
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                  </section>
                )}

                {/* All Events Grid */}
                <section>
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {searchQuery ? `Search Results for "${searchQuery}"` : 'All Events'}
                    </h2>
                  </div>
                  
                  {/* FilterBar Component */}
                  <div className="mb-6">
                    <FilterBar
                      onFilterChange={handleFilterChange}
                      activeFilters={filters}
                    />
                  </div>
                  {events.length > 0 ? (
                    <>
                      {/* Mobile: Horizontal Carousel */}
                      <div className="block sm:hidden overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="flex gap-4 px-2">
                          {events.map(event => (
                            <div key={event._id} className="flex-none w-[85vw] snap-center">
                              <EventCard
                                event={event}
                                onFavorite={handleFavorite}
                                isSaved={savedEventIds.includes(event._id)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Desktop: Grid Layout */}
                      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {events.map(event => (
                          <EventCard
                            key={event._id}
                            event={event}
                            onFavorite={handleFavorite}
                            isSaved={savedEventIds.includes(event._id)}
                          />
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      {eventsPagination && eventsPagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
                          <button
                            onClick={() => setEventsPage(Math.max(1, eventsPage - 1))}
                            disabled={eventsPage === 1}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          
                          {[...Array(eventsPagination.totalPages)].map((_, i) => {
                            const page = i + 1;
                            // Show first, last, current, and adjacent pages
                            if (
                              page === 1 ||
                              page === eventsPagination.totalPages ||
                              (page >= eventsPage - 1 && page <= eventsPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setEventsPage(page)}
                                  className={`px-4 py-2 rounded-lg font-medium ${
                                    page === eventsPage
                                      ? 'bg-orange-500 text-white'
                                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === eventsPage - 2 || page === eventsPage + 2) {
                              return <span key={page} className="px-2 text-gray-500">...</span>;
                            }
                            return null;
                          })}
                          
                          <button
                            onClick={() => setEventsPage(Math.min(eventsPagination.totalPages, eventsPage + 1))}
                            disabled={eventsPage === eventsPagination.totalPages}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          
                          <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                            Page {eventsPage} of {eventsPagination.totalPages}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                        No events found
                      </p>
                      <button
                        onClick={handleClearSearch}
                        className="text-orange-500 hover:text-orange-600 font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </section>

                {/* CTA Section
                <section className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-center text-white">
                  <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>Want to host your own event?</h3>
                  <p className="text-lg mb-6 text-white/90" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    Share your passion and bring people together
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => navigate('/host-partner')}
                      className="bg-white text-orange-500 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105"
                    >
                      Create Event
                    </button>
                    <button
                      onClick={() => navigate('/host-partner')}
                      className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-full transition-all"
                    >
                      Learn More
                    </button>
                  </div>
                </section> */}
              </div>
            )}

            {/* Communities Tab */}
            {tab === 'communities' && (
              <div className="space-y-12">
                {/* Community Picks Section */}
                <section>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      Community Picks
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-base" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      Be a part of the most buzzing communities
                    </p>
                  </div>
                  {featuredCommunities.length > 0 ? (
                    <>
                      {/* Mobile: Horizontal Carousel */}
                      <div className="block sm:hidden overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="flex gap-4 px-2">
                          {featuredCommunities.slice(0, 4).map(community => (
                            <div key={community._id} className="flex-none w-[85vw] snap-center">
                              <CommunityCard
                                community={community}
                                onFavorite={handleFavorite}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Desktop: Grid Layout */}
                      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {featuredCommunities.slice(0, 4).map(community => (
                          <CommunityCard
                            key={community._id}
                            community={community}
                            onFavorite={handleFavorite}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-600 dark:text-gray-400">
                        No featured communities available
                      </p>
                    </div>
                  )}
                </section>

                {/* All Communities Section with Lock Overlay */}
                <section className="relative">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      All Communities
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-base" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      Explore more communities
                    </p>
                  </div>
                  
                  <div className="relative">
                    {/* Calculate pagination for locked communities */}
                    {(() => {
                      const itemsPerPage = 8;
                      const totalPages = Math.ceil(lockedCommunities.length / itemsPerPage);
                      const startIdx = (communitiesPage - 1) * itemsPerPage;
                      const endIdx = startIdx + itemsPerPage;
                      const paginatedCommunities = lockedCommunities.slice(startIdx, endIdx);
                      
                      return (
                        <>
                          {/* Mobile: Horizontal Carousel */}
                          <div className="block sm:hidden overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="flex gap-4 px-2">
                              {paginatedCommunities.map(community => (
                                <div key={community._id} className="flex-none w-[85vw] snap-center">
                                  <CommunityCard
                                    community={community}
                                    isLocked={true}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Desktop: Grid Layout */}
                          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Show paginated communities as locked/blurred */}
                            {paginatedCommunities.map(community => (
                              <CommunityCard
                                key={community._id}
                                community={community}
                                isLocked={true}
                              />
                            ))}
                          </div>
                          
                          {/* Unlock Overlay - positioned higher in the grid */}
                          {lockedCommunities.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '0%' }}>
                              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 text-center text-white max-w-md pointer-events-auto">
                                <div className="h-16 w-16 bg-gradient-to-br from-[#7878E9] to-[#3D3DD4] rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Lock className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                  Unlock More Communities
                                </h3>
                                <p className="text-base mb-6 text-white/90" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                 Viewing {Math.min(8, lockedCommunities.length)} of {lockedCommunities.length} communities. <br /> Download the app to join more communities                          </p>
                                <a
                                  href="https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
                                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                                >
                                  Download the App
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {/* Pagination Controls for Communities */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                              <button
                                onClick={() => setCommunitiesPage(Math.max(1, communitiesPage - 1))}
                                disabled={communitiesPage === 1}
                                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="h-5 w-5 text-gray-900 dark:text-white" />
                              </button>
                              
                              {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= communitiesPage - 1 && page <= communitiesPage + 1)
                                ) {
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => setCommunitiesPage(page)}
                                      className={`px-4 py-2 rounded-lg font-medium ${
                                        page === communitiesPage
                                          ? 'bg-orange-500 text-white'
                                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  );
                                } else if (page === communitiesPage - 2 || page === communitiesPage + 2) {
                                  return <span key={page} className="px-2 text-gray-500">...</span>;
                                }
                                return null;
                              })}
                              
                              <button
                                onClick={() => setCommunitiesPage(Math.min(totalPages, communitiesPage + 1))}
                                disabled={communitiesPage === totalPages}
                                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronRight className="h-5 w-5 text-gray-900 dark:text-white" />
                              </button>
                              
                              <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                                Page {communitiesPage} of {totalPages}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </section>
              </div>
            )}

            {/* People Tab */}
            {tab === 'people' && (
              <div className="mt-8">
                {/* All Connections Section */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      All Connections
                    </h2>
                  </div>

                  {/* Filter Pills */}
                  <div className="hidden md:flex gap-2 sm:gap-3 mb-8 overflow-x-auto pb-2">
                    <button 
                      onClick={() => setPeopleFilter('recommended')}
                      className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium hover:opacity-90 transition-all whitespace-nowrap ${peopleFilter === 'recommended' ? 'text-white shadow-lg' : 'bg-[#3A3A52] text-white hover:bg-[#4A4A62]'}`}
                      style={peopleFilter === 'recommended' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Source Serif Pro, serif' } : { fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Recommended
                    </button>
                    <button 
                      onClick={() => setPeopleFilter('nearby')}
                      className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${peopleFilter === 'nearby' ? 'text-white shadow-lg' : 'bg-[#3A3A52] text-white hover:bg-[#4A4A62]'}`}
                      style={peopleFilter === 'nearby' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Source Serif Pro, serif' } : { fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Nearby
                    </button>
                    <button 
                      onClick={() => setPeopleFilter('new')}
                      className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${peopleFilter === 'new' ? 'text-white shadow-lg' : 'bg-[#3A3A52] text-white hover:bg-[#4A4A62]'}`}
                      style={peopleFilter === 'new' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Source Serif Pro, serif' } : { fontFamily: 'Source Serif Pro, serif' }}
                    >
                      New
                    </button>
                    <button 
                      onClick={() => setPeopleFilter('active')}
                      className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${peopleFilter === 'active' ? 'text-white shadow-lg' : 'bg-[#3A3A52] text-white hover:bg-[#4A4A62]'}`}
                      style={peopleFilter === 'active' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Source Serif Pro, serif' } : { fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Active Now
                    </button>
                    <button 
                      onClick={() => setPeopleFilter('under10km')}
                      className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${peopleFilter === 'under10km' ? 'text-white shadow-lg' : 'bg-[#3A3A52] text-white hover:bg-[#4A4A62]'}`}
                      style={peopleFilter === 'under10km' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Source Serif Pro, serif' } : { fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Under 10km
                    </button>
                  </div>

                  {/* Connections Grid with Blur Effect */}
                  <div className="relative">
                    {/* Mobile: Horizontal Carousel */}
                    <div className="block sm:hidden overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-4 px-2">
                        {getSortedPeople().map((person, index) => (
                          <div key={index} className="flex-none w-[85vw] snap-center">
                            <div className="bg-[#1E1E2E] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer flex flex-col blur-sm">
                              <div className="relative h-64">
                                <div className={`w-full h-full bg-gradient-to-br ${person.bgColor} flex items-center justify-center`}>
                                  <span className="text-8xl opacity-80">{person.emoji}</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                  <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                    {person.name}
                                  </h3>
                                  <p className="text-sm text-gray-300" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                    {person.interests}
                                  </p>
                                </div>
                              </div>
                              <div className="p-4 flex-grow flex flex-col">
                                <div className="flex items-center text-gray-400 text-sm mb-4" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                  <MapPin className="h-4 w-4 mr-1 text-[#7878E9]" />
                                  {person.distance.toFixed(1)} km away
                                </div>
                                <button
                                  className="w-full text-white py-2.5 rounded-md text-base font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-lg mt-auto"
                                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                                >
                                  Connect Now
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop: Grid Layout */}
                    <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {getSortedPeople().map((person, index) => (
                        <div key={index} className="bg-[#1E1E2E] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer flex flex-col blur-sm">
                          <div className="relative h-64">
                            <div className={`w-full h-full bg-gradient-to-br ${person.bgColor} flex items-center justify-center`}>
                              <span className="text-8xl opacity-80">{person.emoji}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                {person.name}
                              </h3>
                              <p className="text-sm text-gray-300" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                {person.interests}
                              </p>
                            </div>
                          </div>
                          <div className="p-4 flex-grow flex flex-col">
                            <div className="flex items-center text-gray-400 text-sm mb-4" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                              <MapPin className="h-4 w-4 mr-1 text-[#7878E9]" />
                              {person.distance.toFixed(1)} km away
                            </div>
                            <button
                              className="w-full text-white py-2.5 rounded-md text-base font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-lg mt-auto"
                              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                            >
                              Connect Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Unlock Overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(2px)',
                        top: '0%',
                      }}
                    >
                      <div className="text-center px-4 max-w-md">
                        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
                          <Lock className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                          Unlock More Connections
                        </h3>
                        <p className="text-base mb-6 text-white/90" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                          Viewing 5 of many people. Download the app to connect with more like-minded people.
                        </p>
                        <a
                          href="https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl mb-2"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                        >
                          Download the App
                        </a>
                        <p className="text-sm text-white/70" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                          Available on iOS & Android
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        eventTitle={selectedEvent?.title}
        message="Sign in to favorite and save items"
      />
    </div>
  );
}

