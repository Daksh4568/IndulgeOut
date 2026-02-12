import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import NavigationBar from '../components/NavigationBar';
import TicketViewer from '../components/TicketViewer';
import { CATEGORY_ICONS } from '../constants/eventConstants';
import { 
  Calendar, MapPin, Clock, Users, Heart, Star, 
  TrendingUp, Gift, Crown, Award, UserPlus, 
  MapPinned, MessageCircle, Ticket, ChevronRight,
  Sparkles, Trophy, Target, Lock, ChevronLeft,
  LayoutDashboard, HelpCircle, BarChart3, Download, User
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, saved
  const [myEvents, setMyEvents] = useState({ upcoming: [], past: [], saved: [] });
  const [myInterests, setMyInterests] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [peopleRecommendations, setPeopleRecommendations] = useState([]);
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketViewer, setShowTicketViewer] = useState(false);
  
  // Carousel refs
  const upcomingScrollRef = useRef(null);
  const pastScrollRef = useRef(null);
  const savedScrollRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Force refresh when coming from payment
  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh === 'true') {
      console.log('🔄 Force refreshing dashboard after payment...');
      fetchDashboardData();
      // Remove refresh param after triggering reload
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      setSearchParams(newParams);
    }
  }, [searchParams]);

  // Auto-open ticket viewer if eventId is in URL (from notification or payment)
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && !loading) {
      console.log('🎫 Auto-opening ticket for event:', eventId);
      setSelectedTicket(eventId);
      setShowTicketViewer(true);
      setActiveTab('upcoming'); // Switch to upcoming tab
      // Don't remove eventId immediately to allow ticket viewer to use it
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('eventId');
        setSearchParams(newParams);
      }, 1000);
    }
  }, [searchParams, loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [eventsRes, interestsRes, communitiesRes, peopleRes, rewardsRes] = await Promise.all([
        api.get('/users/my-events'),
        api.get('/users/my-interests'),
        api.get('/users/my-communities'),
        api.get('/users/people-recommendations'),
        api.get('/users/my-rewards')
      ]);

      console.log('📊 Dashboard data loaded:', {
        events: eventsRes.data,
        upcoming: eventsRes.data?.upcoming?.length || 0,
        past: eventsRes.data?.past?.length || 0,
        saved: eventsRes.data?.saved?.length || 0
      });

      // Set events with fallback to empty structure
      setMyEvents({
        upcoming: eventsRes.data?.upcoming || [],
        past: eventsRes.data?.past || [],
        saved: eventsRes.data?.saved || []
      });
      setMyInterests(interestsRes.data?.interests || []);
      setMyCommunities(communitiesRes.data?.communities || []);
      setPeopleRecommendations(peopleRes.data?.people || []);
      setRewards(rewardsRes.data || { points: 0, tier: 'Bronze' });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty states on error to prevent crashes
      setMyEvents({ upcoming: [], past: [], saved: [] });
      setMyInterests([]);
      setMyCommunities([]);
      setPeopleRecommendations([]);
      setRewards({ points: 0, tier: 'Bronze' });
    } finally {
      setLoading(false);
    }
  };

  // Event status badge colors
  const getStatusBadge = (status) => {
    const badges = {
      booked: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rsvpd: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      waitlisted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      attended: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return badges[status.toLowerCase()] || badges.booked;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Carousel scroll functions
  const scrollCarousel = (direction) => {
    let scrollRef;
    if (activeTab === 'upcoming') scrollRef = upcomingScrollRef;
    else if (activeTab === 'past') scrollRef = pastScrollRef;
    else scrollRef = savedScrollRef;

    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // ===== MY EVENTS SECTION =====
  const MyEventsSection = () => {
    const currentEvents = myEvents[activeTab] || [];

    const getEmptyStateMessage = () => {
      switch(activeTab) {
        case 'upcoming':
          return {
            icon: <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />,
            title: "Nothing planned yet",
            message: "Explore events happening this week",
            cta: "Explore Events",
            action: () => navigate('/explore')
          };
        case 'past':
          return {
            icon: <Clock className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />,
            title: "No past events",
            message: "Your memories will live here",
            cta: null,
            action: null
          };
        case 'saved':
          return {
            icon: <Heart className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />,
            title: "No saved events",
            message: "Save events to plan later",
            cta: "Discover Events",
            action: () => navigate('/explore')
          };
        default:
          return null;
      }
    };

    const EventCard = ({ event }) => {
      const isPast = activeTab === 'past';
      const isSaved = activeTab === 'saved';
      const isUpcoming = activeTab === 'upcoming';
      const [imageError, setImageError] = useState(false);

      // Get gradient based on category or default
      const getEventGradient = (category) => {
        const gradients = {
          'Music & Concerts': 'from-purple-500 to-pink-500',
          'Clubbing': 'from-orange-500 to-red-500',
          'Comedy': 'from-yellow-500 to-orange-500',
          'Sports & Fitness': 'from-green-500 to-teal-500',
          'Food & Dining': 'from-red-500 to-pink-500',
          'Art & Culture': 'from-indigo-500 to-purple-500'
        };
        return gradients[category] || 'from-purple-500 to-pink-500';
      };

      return (
        <div 
          onClick={() => navigate(`/events/${event._id}`)}
          className="flex-shrink-0 w-[calc(100vw-3rem)] sm:w-64 md:w-72 bg-zinc-900 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all cursor-pointer group snap-center"
        >
          {/* Event Image */}
          <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${getEventGradient(event.categories?.[0])}`}>
            {event.images && event.images.length > 0 && !imageError ? (
              <img
                src={event.images[0]}
                alt={event.title}
                className="w-full h-full object-cover opacity-80"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Calendar className="h-16 w-16 text-white/60" />
              </div>
            )}
            {event.status && isUpcoming && (
              <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">
                Booked
              </span>
            )}
          </div>

          {/* Event Details */}
          <div className="p-4">
            <h3 className="font-bold text-white mb-3 line-clamp-1 text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {event.title}
            </h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{event.location?.city || event.city}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Users className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span>{event.categories?.[0] || 'Event'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isUpcoming && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTicket(event._id);
                    setShowTicketViewer(true);
                  }}
                  className="flex-1 bg-white text-black px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm font-semibold flex items-center justify-center gap-1"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  <Ticket className="h-4 w-4" />
                  View Ticket
                </button>
              )}
              {isPast && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${event._id}/review`);
                  }}
                  className="flex-1 bg-white text-black px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm font-semibold flex items-center justify-center gap-1"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  <Star className="h-4 w-4" />
                  Leave Review
                </button>
              )}
              {isSaved && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${event._id}`);
                  }}
                  className="flex-1 text-white px-3 py-2 rounded transition-colors text-sm font-semibold"
                  style={{ 
                    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    fontFamily: 'Oswald, sans-serif'
                  }}
                >
                  Book Now
                </button>
              )}
            </div>
          </div>
        </div>
      );
    };

    if (currentEvents.length === 0) {
      const emptyState = getEmptyStateMessage();
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {emptyState.icon}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {emptyState.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {emptyState.message}
          </p>
          {emptyState.cta && (
            <button 
              onClick={emptyState.action}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {emptyState.cta}
            </button>
          )}
        </div>
      );
    }

    // Get appropriate scroll ref
    let scrollRef;
    if (activeTab === 'upcoming') scrollRef = upcomingScrollRef;
    else if (activeTab === 'past') scrollRef = pastScrollRef;
    else scrollRef = savedScrollRef;

    return (
      <div className="relative">
        {/* Navigation Buttons - Desktop Only */}
        {currentEvents.length > 2 && (
          <>
            <button
              onClick={() => scrollCarousel('left')}
              className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors -ml-4"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors -mr-4"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
            </button>
          </>
        )}

        {/* Carousel Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {currentEvents.map(event => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      </div>
    );
  };

  // ===== MY PEOPLE & INTERESTS SECTION =====
  const MyPeopleInterestsSection = () => {
    return (
      <div className="space-y-8">
        {/* My Interests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
              My Interests
            </h3>
            <button 
              onClick={() => navigate('/interests')}
              className="flex items-center gap-2 px-4 py-2 bg-transparent text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-semibold border border-gray-700"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              <ChevronRight className="h-4 w-4" />
              Edit Interests
            </button>
          </div>
          
          {myInterests.length === 0 ? (
            <div className="text-center py-8 bg-zinc-800 rounded-lg border border-gray-700">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">
                Tell us what you're interested in
              </p>
              <button 
                onClick={() => navigate('/interests')}
                className="px-6 py-3 text-white rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ 
                  background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                  fontFamily: 'Oswald, sans-serif'
                }}
              >
                Add Interests
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {myInterests.map((interest, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/explore?category=${interest}`)}
                  className="px-6 py-3 text-white rounded-lg font-semibold transition-all hover:opacity-90"
                  style={{ 
                    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    fontFamily: 'Oswald, sans-serif'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* My Communities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
              My Communities
            </h3>
            <button 
              onClick={() => navigate('/explore?tab=communities')}
              className="flex items-center gap-2 px-4 py-2 bg-transparent text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-semibold border border-gray-700"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              <UserPlus className="h-4 w-4" />
              Join More
            </button>
          </div>

          {myCommunities.length === 0 ? (
            <div className="text-center py-8 bg-zinc-800 rounded-lg border border-gray-700">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">
                Join communities that match your vibe
              </p>
              <button 
                onClick={() => navigate('/explore?tab=communities')}
                className="px-6 py-3 text-white rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ 
                  background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                  fontFamily: 'Oswald, sans-serif'
                }}
              >
                Explore Communities
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop Grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {myCommunities.map((community) => (
                  <div 
                    key={community._id}
                    className="bg-zinc-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-all relative"
                  >
                    {/* Joined Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-teal-500/20 text-teal-400 text-xs font-semibold rounded-lg border border-teal-500/30">
                        Joined
                      </span>
                    </div>

                    {/* Community Icon */}
                    <div className="flex justify-center mb-4 mt-2">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ 
                        background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                      }}>
                        <Users className="h-8 w-8" />
                      </div>
                    </div>

                    {/* Community Name */}
                    <h4 className="text-lg font-bold text-white text-center mb-2 line-clamp-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {community.name}
                    </h4>
                    
                    {/* Category */}
                    <p className="text-sm text-gray-400 text-center mb-4">
                      {community.category}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-6 mb-4 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{community.upcomingEventsCount || 0} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{community.membersCount || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/communities/${community._id}`)}
                        className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        View
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle leave community
                        }}
                        className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors text-sm font-semibold"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Horizontal Scroll */}
              <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {myCommunities.map((community) => (
                  <div 
                    key={community._id}
                    className="bg-zinc-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-all relative flex-shrink-0 w-[calc(100vw-3rem)] snap-center"
                  >
                    {/* Joined Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-teal-500/20 text-teal-400 text-xs font-semibold rounded-lg border border-teal-500/30">
                        Joined
                      </span>
                    </div>

                    {/* Community Icon */}
                    <div className="flex justify-center mb-4 mt-2">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ 
                        background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                      }}>
                        <Users className="h-8 w-8" />
                      </div>
                    </div>

                    {/* Community Name */}
                    <h4 className="text-lg font-bold text-white text-center mb-2 line-clamp-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {community.name}
                    </h4>
                    
                    {/* Category */}
                    <p className="text-sm text-gray-400 text-center mb-4">
                      {community.category}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-6 mb-4 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{community.upcomingEventsCount || 0} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{community.membersCount || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/communities/${community._id}`)}
                        className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        View
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle leave community
                        }}
                        className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors text-sm font-semibold"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* My Friends / People Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              People You May Know
            </h3>
          </div>

          {/* Fake Blurred Profiles with App Download CTA */}
          <div className="bg-zinc-900 rounded-lg border border-gray-700 p-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Connect with people attending similar events
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                See who's going to your favorite events and build your tribe. Available on mobile app!
              </p>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-4 gap-4 mb-6">
              {[
                { name: 'John D.', events: 5 },
                { name: 'Sarah M.', events: 8 },
                { name: 'Mike R.', events: 3 },
                { name: 'Emma K.', events: 6 }
              ].map((person, i) => (
                <div key={i} className="relative bg-zinc-800 rounded-lg p-4 border border-gray-700">
                  {/* Blur Overlay */}
                  <div className="absolute inset-0 backdrop-blur-md bg-black/30 rounded-lg flex items-center justify-center z-10">
                    <Lock className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  {/* Profile Content (blurred) */}
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-3"></div>
                    <div className="h-4 w-20 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Horizontal Scroll */}
            <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { name: 'John D.', events: 5 },
                { name: 'Sarah M.', events: 8 },
                { name: 'Mike R.', events: 3 },
                { name: 'Emma K.', events: 6 }
              ].map((person, i) => (
                <div key={i} className="relative bg-zinc-800 rounded-lg p-4 border border-gray-700 flex-shrink-0 w-[calc(100vw-3rem)] snap-center">
                  {/* Blur Overlay */}
                  <div className="absolute inset-0 backdrop-blur-md bg-black/30 rounded-lg flex items-center justify-center z-10">
                    <Lock className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  {/* Profile Content (blurred) */}
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-3"></div>
                    <div className="h-4 w-20 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Download App CTA */}
            <div className="text-center">
              <button 
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout', '_blank')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ 
                  background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                  fontFamily: 'Oswald, sans-serif'
                }}
              >
                <Download className="h-5 w-5" />
                Download App
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== REWARDS & STATUS SECTION =====
  const RewardsStatusSection = () => {
    if (!rewards) {
      return <div className="text-center py-8">Loading rewards...</div>;
    }

    return (
      <div className="space-y-6">
        {/* Credits & VIP Status Cards */}
        <div>
          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Credit Balance */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Gift className="h-8 w-8 opacity-80" />
                <span className="text-sm opacity-80">Available</span>
              </div>
              <div className="text-3xl font-bold mb-1">₹{rewards.credits || 0}</div>
              <p className="text-sm opacity-90">Credits Balance</p>
            </div>

            {/* VIP Status */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Crown className="h-8 w-8 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {rewards.tier || 'Silver'}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">{rewards.points || 0} pts</div>
              <p className="text-sm opacity-90">VIP Points</p>
            </div>

            {/* Referral Count */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="h-8 w-8 opacity-80" />
                <span className="text-sm opacity-80">Invited</span>
              </div>
              <div className="text-3xl font-bold mb-1">{rewards.referrals || 0}</div>
              <p className="text-sm opacity-90">Friends Referred</p>
            </div>

            {/* Events Attended */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-8 w-8 opacity-80" />
                <span className="text-sm opacity-80">Total</span>
              </div>
              <div className="text-3xl font-bold mb-1">{rewards.eventsAttended || 0}</div>
              <p className="text-sm opacity-90">Events Attended</p>
            </div>
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Credit Balance */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white flex-shrink-0 w-[calc(100vw-3rem)] snap-center">
              <div className="flex items-center justify-between mb-2">
                <Gift className="h-8 w-8 opacity-80" />
                <span className="text-sm opacity-80">Available</span>
              </div>
              <div className="text-3xl font-bold mb-1">₹{rewards.credits || 0}</div>
              <p className="text-sm opacity-90">Credits Balance</p>
            </div>

            {/* VIP Status */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white flex-shrink-0 w-[calc(100vw-3rem)] snap-center">
              <div className="flex items-center justify-between mb-2">
                <Crown className="h-8 w-8 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {rewards.tier || 'Silver'}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">{rewards.points || 0} pts</div>
              <p className="text-sm opacity-90">VIP Points</p>
            </div>

            {/* Referral Count */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white flex-shrink-0 w-[calc(100vw-3rem)] snap-center">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="h-8 w-8 opacity-80" />
                <span className="text-sm opacity-80">Invited</span>
              </div>
              <div className="text-3xl font-bold mb-1">{rewards.referrals || 0}</div>
              <p className="text-sm opacity-90">Friends Referred</p>
            </div>

            {/* Events Attended */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white flex-shrink-0 w-[calc(100vw-3rem)] snap-center">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-8 w-8 opacity-80" />
                <span className="text-sm opacity-80">Total</span>
              </div>
              <div className="text-3xl font-bold mb-1">{rewards.eventsAttended || 0}</div>
              <p className="text-sm opacity-90">Events Attended</p>
            </div>
          </div>
        </div>

        {/* Referral Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Referral Progress
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {rewards.referrals || 0} / 10 friends
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((rewards.referrals || 0) / 10 * 100, 100)}%` }}
            ></div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Refer {10 - (rewards.referrals || 0)} more friends to unlock ₹500 bonus credits!
          </p>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            <UserPlus className="h-4 w-4 inline mr-2" />
            Refer Friends
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Redeem Credits
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use your credits on events and experiences
            </p>
          </button>

          <button className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Upgrade to VIP
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get exclusive perks and early access
            </p>
          </button>
        </div>

        {/* Expiry Reminder */}
        {rewards.expiringCredits && rewards.expiringCredits > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                  Credits Expiring Soon!
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ₹{rewards.expiringCredits} credits will expire on {formatDate(rewards.expiryDate)}. Use them before they're gone!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <NavigationBar />
      
      <div className="flex overflow-x-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block w-20 bg-zinc-900 border-r border-gray-800 min-h-screen pt-20">
          <nav className="flex flex-col items-center space-y-6">
            {/* Dashboard */}
            <button
              onClick={() => {
                setActiveSidebarItem('dashboard');
                window.scrollTo(0, 0);
              }}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'dashboard'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={activeSidebarItem === 'dashboard' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="Dashboard"
            >
              <LayoutDashboard className="h-6 w-6" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>

            {/* My Events */}
            <button
              onClick={() => {
                setActiveSidebarItem('events');
                document.getElementById('my-events')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'events'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={activeSidebarItem === 'events' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="My Events"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-xs font-medium">My Events</span>
            </button>

            {/* My People & Interests */}
            <button
              onClick={() => {
                setActiveSidebarItem('people');
                document.getElementById('my-people-interests')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'people'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={activeSidebarItem === 'people' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="My People & Interests"
            >
              <Users className="h-6 w-6" />
              <span className="text-xs font-medium">People</span>
            </button>

            {/* Rewards & Status */}
            <button
              onClick={() => {
                setActiveSidebarItem('rewards');
                document.getElementById('rewards-status')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === 'rewards'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={activeSidebarItem === 'rewards' ? {
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
              } : {}}
              title="Rewards & Status"
            >
              <Gift className="h-6 w-6" />
              <span className="text-xs font-medium">Rewards</span>
            </button>

            {/* Help */}
            <button
              onClick={() => navigate('/contact')}
              className="flex flex-col items-center space-y-1 p-3 rounded-lg text-gray-400 hover:text-white transition-all"
              title="Help"
            >
              <HelpCircle className="h-6 w-6" />
              <span className="text-xs font-medium">Help</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-8 max-w-full">
              <div className="flex items-center justify-between mb-4 max-w-full">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 rounded-lg border border-gray-800">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      Hello, {user?.name?.split(' ')[0] || 'User'}
                    </h1>
                    <p className="text-sm text-gray-400">Welcome Back !</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-transparent text-white rounded-lg hover:bg-zinc-800 transition-colors border border-gray-700"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  <ChevronRight className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="space-y-8">
              {/* MY EVENTS */}
              <section id="my-events">
                <div className="bg-zinc-900 rounded-xl border border-gray-800">
                  <div className="border-b border-gray-800 px-6 py-4">
                    <div className="flex items-center mb-4">
                      <Calendar className="h-5 w-5 text-white mr-2" />
                      <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        My Events
                      </h2>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          activeTab === 'upcoming'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => setActiveTab('past')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          activeTab === 'past'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        Past
                      </button>
                      <button
                        onClick={() => setActiveTab('saved')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          activeTab === 'saved'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        Saved
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <MyEventsSection />
                  </div>
                </div>
              </section>

              {/* MY PEOPLE & INTERESTS */}
              <section id="my-people-interests">
                <div className="bg-zinc-900 rounded-xl border border-gray-800 p-6">
                  <div className="flex items-center mb-6">
                    <Users className="h-5 w-5 text-white mr-2" />
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      My People & Interests
                    </h2>
                  </div>
                  <MyPeopleInterestsSection />
                </div>
              </section>

              {/* REWARDS & STATUS */}
              <section id="rewards-status">
                <div className="bg-zinc-900 rounded-xl border border-gray-800 p-6">
                  <div className="flex items-center mb-6">
                    <Gift className="h-5 w-5 text-white mr-2" />
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      Rewards & Status
                    </h2>
                  </div>
                  <RewardsStatusSection />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Viewer Modal */}
      {showTicketViewer && (
        <TicketViewer
          eventId={selectedTicket}
          onClose={() => {
            setShowTicketViewer(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;

