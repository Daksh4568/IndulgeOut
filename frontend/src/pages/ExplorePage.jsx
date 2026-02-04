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
  }, [tab, searchQuery, filters, eventsPage, communitiesPage]);

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

      // Fetch main events with filters
      let eventsEndpoint = `${API_URL}/api/explore/events/popular?limit=12&page=${eventsPage}`;
      
      if (searchQuery) {
        eventsEndpoint = `${API_URL}/api/explore/events/search?q=${encodeURIComponent(searchQuery)}&limit=12&page=${eventsPage}`;
      } else if (filters.useGeolocation && filters.userLocation) {
        eventsEndpoint = `${API_URL}/api/explore/events/nearby?lat=${filters.userLocation.lat}&lng=${filters.userLocation.lng}&radius=50&limit=12&page=${eventsPage}`;
      }

      const eventsResponse = await fetch(eventsEndpoint);
      const eventsData = await eventsResponse.json();
      console.log('✅ Main events received:', eventsData.events?.length || 0, 'events');
      setEventsPagination(eventsData.pagination);
      
      let filteredEvents = eventsData.events || [];

      // Apply additional filters
      if (filters.price && filters.price !== 'all') {
        filteredEvents = filteredEvents.filter(event => {
          const price = event.price?.amount || 0;
          if (filters.price === 'free') return price === 0;
          if (filters.price === 'under500') return price > 0 && price < 500;
          if (filters.price === '500-2000') return price >= 500 && price <= 2000;
          if (filters.price === 'over2000') return price > 2000;
          return true;
        });
      }

      if (filters.city && filters.city !== 'all') {
        filteredEvents = filteredEvents.filter(event => 
          event.location?.city === filters.city
        );
      }

      if (filters.mood && filters.mood !== 'all') {
        filteredEvents = filteredEvents.filter(event => 
          event.mood === filters.mood
        );
      }

      if (filters.showToday) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate < tomorrow;
        });
      }

      if (filters.showWeekend) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);
        saturday.setHours(0, 0, 0, 0);
        const monday = new Date(saturday);
        monday.setDate(saturday.getDate() + 3);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= saturday && eventDate < monday;
        });
      }

      setEvents(filteredEvents);
      console.log('📊 Final events count:', filteredEvents.length);
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
      let featuredEndpoint = `${API_URL}/api/explore/communities/featured?limit=15&page=${communitiesPage}`;
      
      // If there's a search query, use search endpoint instead
      if (searchQuery) {
        featuredEndpoint = `${API_URL}/api/explore/communities/search?q=${encodeURIComponent(searchQuery)}&limit=15&page=${communitiesPage}`;
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
                        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth px-4 sm:px-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {topEvents.map((event, index) => (
                          <div 
                            key={event._id} 
                            className="flex-none w-full sm:w-[600px] lg:w-[650px] snap-center"
                            style={{
                              animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                            }}
                          >
                            {/* Horizontal Event Card */}
                            <div className="bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all h-full">
                              <div className="flex flex-col sm:flex-row h-full min-h-[400px]">
                                {/* Left Side - Content */}
                                <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                                      <Calendar className="h-4 w-4" />
                                      <span className="text-sm font-medium" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}
                                      </span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 line-clamp-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                      {event.title}
                                    </h3>
                                    <div className="flex items-start gap-2 text-gray-700 mb-4">
                                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                                      <span className="text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                        {event.location?.venue || event.location?.city}, {event.location?.state}
                                      </span>
                                    </div>
                                    <div className="mb-4">
                                      <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                        ₹{event.price?.amount || 499} onwards
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => window.location.href = `/events/${event._id}`}
                                    className="w-full sm:w-auto text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
                                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                                  >
                                    Get your Ticket
                                  </button>
                                </div>

                                {/* Right Side - Framed Image */}
                                <div className="w-full sm:w-1/2 h-64 sm:h-auto p-4 flex items-center justify-center">
                                  <div className="relative w-full h-full max-w-[280px] mx-auto">
                                    {/* Frame/Shadow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg transform rotate-2 shadow-2xl"></div>
                                    
                                    {/* Image container */}
                                    <div className="relative bg-white rounded-lg overflow-hidden shadow-xl h-full">
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
                    <style jsx>{`
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
                  
                  {/* Filter Pills for All Events */}
                  <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => handleFilterChange({ ...filters, showToday: !filters.showToday })}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        filters.showToday
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Today
                    </button>
                    <button className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                      Tonight
                    </button>
                    <button className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                      Tomorrow
                    </button>
                    <button
                      onClick={() => handleFilterChange({ ...filters, showWeekend: !filters.showWeekend })}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        filters.showWeekend
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      This Weekend
                    </button>
                    <button className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                      Online
                    </button>
                    <button className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                      Open
                    </button>
                    <button className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                      more
                    </button>
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
                    {/* Mobile: Horizontal Carousel */}
                    <div className="block sm:hidden overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-4 px-2">
                        {lockedCommunities.slice(0, 13).map(community => (
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
                      {/* Show all communities as locked/blurred */}
                      {lockedCommunities.slice(0, 13).map(community => (
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
                           Viewing 5 of many communities. <br /> Download the app to join more communities                          </p>
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
                  <div className="flex gap-2 sm:gap-3 mb-8 overflow-x-auto pb-2">
                    <button className="px-4 sm:px-5 py-2 rounded-full bg-[#3A3A52] text-white text-sm sm:text-base font-medium hover:bg-[#4A4A62] transition-colors whitespace-nowrap" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      ☰ Filters
                    </button>
                    <button className="px-4 sm:px-5 py-2 rounded-full text-white text-sm sm:text-base font-medium hover:opacity-90 transition-all shadow-lg whitespace-nowrap" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Source Serif Pro, serif' }}>
                      Recommended
                    </button>
                    <button className="px-4 sm:px-5 py-2 rounded-full bg-[#3A3A52] text-white text-sm sm:text-base font-medium hover:bg-[#4A4A62] transition-colors whitespace-nowrap" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      Nearby
                    </button>
                    <button className="px-4 sm:px-5 py-2 rounded-full bg-[#3A3A52] text-white text-sm sm:text-base font-medium hover:bg-[#4A4A62] transition-colors whitespace-nowrap" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      New
                    </button>
                    <button className="px-4 sm:px-5 py-2 rounded-full bg-[#3A3A52] text-white text-sm sm:text-base font-medium hover:bg-[#4A4A62] transition-colors whitespace-nowrap" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      Active Now
                    </button>
                    <button className="px-4 sm:px-5 py-2 rounded-full bg-[#3A3A52] text-white text-sm sm:text-base font-medium hover:bg-[#4A4A62] transition-colors whitespace-nowrap" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      Under 10km
                    </button>
                  </div>

                  {/* Connections Grid with Blur Effect */}
                  <div className="relative">
                    {/* Mobile: Horizontal Carousel */}
                    <div className="block sm:hidden overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-4 px-2">
                        {[
                          { name: 'Alex Johnson', interests: 'Music, Art, Travel', distance: '2.5 km away', emoji: '👤', bgColor: 'from-purple-500 to-purple-700' },
                          { name: 'Sarah Williams', interests: 'Food, Photography, Yoga', distance: '3.8 km away', emoji: '👤', bgColor: 'from-pink-500 to-pink-700' },
                          { name: 'Mike Davis', interests: 'Sports, Tech, Gaming', distance: '1.2 km away', emoji: '👤', bgColor: 'from-blue-500 to-blue-700' },
                          { name: 'Emma Brown', interests: 'Dance, Fashion, Books', distance: '4.5 km away', emoji: '👤', bgColor: 'from-indigo-500 to-indigo-700' },
                          { name: 'Chris Wilson', interests: 'Music, Comedy, Movies', distance: '5.0 km away', emoji: '👤', bgColor: 'from-violet-500 to-violet-700' },
                          { name: 'Lisa Martinez', interests: 'Art, Wellness, Nature', distance: '2.1 km away', emoji: '👤', bgColor: 'from-fuchsia-500 to-fuchsia-700' },
                          { name: 'David Lee', interests: 'Business, Tech, Coffee', distance: '3.3 km away', emoji: '👤', bgColor: 'from-cyan-500 to-cyan-700' },
                          { name: 'Rachel Taylor', interests: 'Fitness, Travel, Food', distance: '1.8 km away', emoji: '👤', bgColor: 'from-rose-500 to-rose-700' },
                        ].map((person, index) => (
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
                                  {person.distance}
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
                      {/* Fake Connection Cards */}
                      {[
                        { name: 'Alex Johnson', interests: 'Music, Art, Travel', distance: '2.5 km away', emoji: '👤', bgColor: 'from-purple-500 to-purple-700' },
                        { name: 'Sarah Williams', interests: 'Food, Photography, Yoga', distance: '3.8 km away', emoji: '👤', bgColor: 'from-pink-500 to-pink-700' },
                        { name: 'Mike Davis', interests: 'Sports, Tech, Gaming', distance: '1.2 km away', emoji: '👤', bgColor: 'from-blue-500 to-blue-700' },
                        { name: 'Emma Brown', interests: 'Dance, Fashion, Books', distance: '4.5 km away', emoji: '👤', bgColor: 'from-indigo-500 to-indigo-700' },
                        { name: 'Chris Wilson', interests: 'Music, Comedy, Movies', distance: '5.0 km away', emoji: '👤', bgColor: 'from-violet-500 to-violet-700' },
                        { name: 'Lisa Martinez', interests: 'Art, Wellness, Nature', distance: '2.1 km away', emoji: '👤', bgColor: 'from-fuchsia-500 to-fuchsia-700' },
                        { name: 'David Lee', interests: 'Business, Tech, Coffee', distance: '3.3 km away', emoji: '👤', bgColor: 'from-cyan-500 to-cyan-700' },
                        { name: 'Rachel Taylor', interests: 'Fitness, Travel, Food', distance: '1.8 km away', emoji: '👤', bgColor: 'from-rose-500 to-rose-700' },
                      ].map((person, index) => (
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
                              {person.distance}
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

