import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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
      setTopEvents(topData.events || []);

      // Fetch main events with filters
      let eventsEndpoint = `${API_URL}/api/explore/events/popular?limit=15&page=${eventsPage}`;
      
      if (searchQuery) {
        eventsEndpoint = `${API_URL}/api/explore/events/search?q=${encodeURIComponent(searchQuery)}&limit=15&page=${eventsPage}`;
      } else if (filters.useGeolocation && filters.userLocation) {
        eventsEndpoint = `${API_URL}/api/explore/events/nearby?lat=${filters.userLocation.lat}&lng=${filters.userLocation.lng}&radius=50&limit=15&page=${eventsPage}`;
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
      <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Discover Your Next Adventure
              </h1>
            </div>
            <p className="text-xl text-white/90">
              Find events, join communities, and connect with amazing people
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search events, communities, people..."
              searchType={tab === 'communities' ? 'communities' : 'events'}
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {tab === 'events' && (
        <FilterBar
          onFilterChange={handleFilterChange}
          activeFilters={filters}
        />
      )}

      {/* Tab Selector */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleTabChange('events')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all border-b-2 whitespace-nowrap ${
                tab === 'events'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => handleTabChange('communities')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                tab === 'communities'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Communities
            </button>
            <button
              onClick={() => handleTabChange('people')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 relative ${
                tab === 'people'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              People
              <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                App Only
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* Events Tab */}
            {tab === 'events' && (
              <div className="space-y-12">
                {/* Top Events Section - Only show if NOT searching */}
                {!searchQuery && topEvents.length > 0 && (
                  <section>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                      {user ? '✨ Recommended For You' : '🔥 Popular Events'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {topEvents.map(event => (
                        <EventCard
                          key={event._id}
                          event={event}
                          onFavorite={handleFavorite}
                          isSaved={savedEventIds.includes(event._id)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Main Events Grid */}
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'All Events'}
                  </h2>
                  {events.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {events.map(event => (
                          <EventCard
                            key={event._id}
                            event={event}
                            onFavorite={handleFavorite}                              isSaved={savedEventIds.includes(event._id)}                          />
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

                {/* CTA Section */}
                <section className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-center text-white">
                  <h3 className="text-3xl font-bold mb-3">Want to host your own event?</h3>
                  <p className="text-lg mb-6 text-white/90">
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
                </section>
              </div>
            )}

            {/* Communities Tab */}
            {tab === 'communities' && (
              <div className="space-y-12">
                {/* Featured Communities (Unlocked) */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    ✨ Featured Communities
                  </h2>
                  {featuredCommunities.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredCommunities.map(community => (
                          <CommunityCard
                            key={community._id}
                            community={community}
                            onFavorite={handleFavorite}
                          />
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      {communitiesPagination && communitiesPagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => setCommunitiesPage(Math.max(1, communitiesPage - 1))}
                            disabled={communitiesPage === 1}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          
                          {[...Array(communitiesPagination.totalPages)].map((_, i) => {
                            const page = i + 1;
                            // Show first, last, current, and adjacent pages
                            if (
                              page === 1 ||
                              page === communitiesPagination.totalPages ||
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
                            onClick={() => setCommunitiesPage(Math.min(communitiesPagination.totalPages, communitiesPage + 1))}
                            disabled={communitiesPage === communitiesPagination.totalPages}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          
                          <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                            Page {communitiesPage} of {communitiesPagination.totalPages}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-600 dark:text-gray-400">
                        No featured communities available
                      </p>
                    </div>
                  )}
                </section>

                {/* Locked Communities */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      🔒 More Communities
                    </h2>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Download app to view all
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lockedCommunities.map(community => (
                      <CommunityCard
                        key={community._id}
                        community={community}
                        isLocked={true}
                      />
                    ))}
                  </div>
                </section>

                {/* App Download CTA */}
                <section className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-center text-white">
                  <h3 className="text-3xl font-bold mb-3">Download IndulgeOut App</h3>
                  <p className="text-lg mb-6 text-white/90">
                    Join 50+ communities and connect with like-minded people
                  </p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <a
                      href="#"
                      className="bg-white text-purple-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      <span>📱</span>
                      <span>App Store</span>
                    </a>
                    <a
                      href="#"
                      className="bg-white text-purple-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      <span>🤖</span>
                      <span>Google Play</span>
                    </a>
                  </div>
                </section>
              </div>
            )}

            {/* People Tab (Locked) */}
            {tab === 'people' && (
              <div className="text-center py-20">
                <div className="h-24 w-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">🔒</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Download the App to Find People
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  Connect with amazing people who share your interests. Browse profiles, send messages, and build meaningful connections.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <a
                    href="#"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <span>📱</span>
                    <span>Download for iOS</span>
                  </a>
                  <a
                    href="#"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <span>🤖</span>
                    <span>Download for Android</span>
                  </a>
                </div>
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

