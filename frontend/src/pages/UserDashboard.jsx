import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import NavigationBar from '../components/NavigationBar';
import TicketViewer from '../components/TicketViewer';
import { CATEGORY_ICONS } from '../constants/eventConstants';
import { 
  Calendar, MapPin, Clock, Users, Heart, Star, 
  TrendingUp, Gift, Crown, Award, UserPlus, 
  MapPinned, MessageCircle, Ticket, ChevronRight,
  Sparkles, Trophy, Target, Lock, ChevronLeft
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
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

      setMyEvents(eventsRes.data);
      setMyInterests(interestsRes.data.interests || []);
      setMyCommunities(communitiesRes.data.communities || []);
      setPeopleRecommendations(peopleRes.data.people || []);
      setRewards(rewardsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

      return (
        <div 
          onClick={() => navigate(`/events/${event._id}`)}
          className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
        >
          {/* Event Image */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
            {event.images && event.images.length > 0 && !imageError ? (
              <img
                src={event.images[0]}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Calendar className="h-20 w-20 text-white/80" />
              </div>
            )}
            {event.status && (
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(event.status)}`}>
                {event.status}
              </span>
            )}
          </div>

          {/* Event Details */}
          <div className="p-5">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {event.title}
            </h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{formatDate(event.date)}</span>
                <Clock className="h-4 w-4 ml-4 mr-2 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{event.location?.address || event.venue || 'TBD'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPinned className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{event.location?.city || event.city}, {event.location?.state}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isUpcoming && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(event._id);
                      setShowTicketViewer(true);
                    }}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                  >
                    <Ticket className="h-4 w-4 inline mr-1" />
                    View Ticket
                  </button>
                </>
              )}
              {isPast && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${event._id}/review`);
                  }}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                >
                  <Star className="h-4 w-4 inline mr-1" />
                  Leave Review
                </button>
              )}
              {isSaved && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${event._id}`);
                  }}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
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
        {/* Navigation Buttons */}
        {currentEvents.length > 2 && (
          <>
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors -ml-4"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors -mr-4"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
            </button>
          </>
        )}

        {/* Carousel Container */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              My Interests
            </h3>
            <button 
              onClick={() => navigate('/interests')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium flex items-center gap-1"
            >
              Edit Interests
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {myInterests.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Target className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tell us what you're interested in
              </p>
              <button 
                onClick={() => navigate('/interests')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Add Interests
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {myInterests.map((interest, idx) => {
                const icon = CATEGORY_ICONS[interest] || '🎯';
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(`/explore?category=${interest}`)}
                    className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    {/* Icon */}
                    <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      {icon}
                    </div>
                    
                    {/* Category Name */}
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {interest}
                    </h4>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300"></div>
                    
                    {/* Arrow icon on hover */}
                    <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Communities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              My Communities
            </h3>
            <button 
              onClick={() => navigate('/explore?tab=communities')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium flex items-center gap-1"
            >
              Discover More
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {myCommunities.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join communities that match your vibe
              </p>
              <button 
                onClick={() => navigate('/explore?tab=communities')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Explore Communities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCommunities.map((community) => (
                <div 
                  key={community._id}
                  onClick={() => navigate(`/communities/${community._id}`)}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400"
                >
                  {/* Header/Cover */}
                  <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full">
                        {community.upcomingEventsCount || 0} events
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Community Name */}
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {community.name}
                    </h4>
                    
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">{CATEGORY_ICONS[community.category] || '🎯'}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {community.category}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {community.membersCount || 0} members
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle leave community
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium hover:underline"
                      >
                        Leave
                      </button>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 pointer-events-none transition-all duration-300"></div>
                </div>
              ))}
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

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Lock className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Connect with people attending similar events
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  See who's going to your favorite events, make new friends, and grow your network. Available on our mobile app!
                </p>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  Download App
                </a>
              </div>
            </div>

            {/* Sample locked profiles */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="relative">
                  <div className="aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg blur-sm"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your IndulgeOut journey
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="space-y-8">
          {/* MY EVENTS */}
          <section>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  My Events
                </h2>
                
                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'upcoming'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'past'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Past
                  </button>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'saved'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
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
          <section>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                My People & Interests
              </h2>
              <MyPeopleInterestsSection />
            </div>
          </section>

          {/* REWARDS & STATUS */}
          <section>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Rewards & Status
              </h2>
              <RewardsStatusSection />
            </div>
          </section>
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
