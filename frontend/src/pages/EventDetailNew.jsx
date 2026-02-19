import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Heart,
  Ticket,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Navigation,
  XCircle
} from 'lucide-react';
import { api } from '../config/api.js';
import NavigationBar from '../components/NavigationBar';
import LoginPromptModal from '../components/LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { CATEGORY_ICONS } from '../constants/eventConstants';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useContext(ToastContext);
  
  // Event data
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Registration
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // UI states
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [currentHighlight, setCurrentHighlight] = useState(0);
  
  const viewTracked = useRef(false);

  // Mock data for highlights carousel (replace with actual data from event)
  const highlights = event?.images || [];

  useEffect(() => {
    fetchEvent();
    
    if (!viewTracked.current) {
      trackEventView();
      viewTracked.current = true;
    }
    
    // Removed auto-refresh interval that was causing page reloads
    // const refreshInterval = setInterval(() => {
    //   fetchEvent();
    // }, 30000);
    // return () => clearInterval(refreshInterval);
  }, [id]);

  useEffect(() => {
    if (user && event?._id) {
      checkIfEventSaved();
    }
  }, [user, event?._id]);

  const trackEventView = async () => {
    try {
      await api.post(`/events/${id}/view`);
    } catch (error) {
      console.warn('Failed to track event view:', error);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event);
      
      if (user && response.data.event.participants) {
        const isUserRegistered = response.data.event.participants.some(
          (p) => p.user?.toString() === user._id?.toString() || p.user?._id?.toString() === user._id?.toString()
        );
        setIsRegistered(isUserRegistered);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error.response?.data?.message || 'Failed to fetch event');
      setLoading(false);
    }
  };

  const checkIfEventSaved = async () => {
    try {
      const response = await api.get('/users/my-events');
      const savedEvents = response.data.saved || [];
      const isEventSaved = savedEvents.some(e => e._id === id);
      setIsSaved(isEventSaved);
    } catch (error) {
      console.error('Error checking if event is saved:', error);
    }
  };

  const handleSaveEvent = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    setIsSaving(true);
    try {
      if (isSaved) {
        await api.delete(`/users/unsave-event/${id}`);
        setIsSaved(false);
        toast?.info('Event removed from saved');
      } else {
        await api.post(`/users/save-event/${id}`);
        setIsSaved(true);
        toast?.success('Event saved successfully!');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast?.error(error.response?.data?.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const shareToSocial = (platform) => {
    const eventUrl = window.location.href;
    const eventTitle = encodeURIComponent(event?.title || 'Check out this event');
    
    let shareUrl;
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${eventTitle}%20${eventUrl}`;
        break;
      case 'instagram':
        toast?.info('Please share manually on Instagram');
        window.open('https://www.instagram.com/', '_blank');
        setShowShareModal(false);
        return;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${eventUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${eventUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${eventUrl}&text=${eventTitle}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${eventUrl}&text=${eventTitle}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const copyEventLink = () => {
    const eventUrl = window.location.href;
    navigator.clipboard.writeText(eventUrl).then(() => {
      toast?.success('Link copied!');
      setShowShareModal(false);
    }).catch(err => {
      console.error('Failed to copy link:', err);
      toast?.error('Failed to copy link');
    });
  };

  const handleRegister = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (user.role !== 'user') {
      toast?.error('Only regular users can register for events');
      return;
    }

    setIsRegistering(true);

    try {
      const ticketPrice = event.price?.amount || 0;
      
      if (ticketPrice === 0) {
        // Free event - direct registration
        await api.post(`/events/${id}/register`, { quantity });
        setIsRegistered(true);
        toast?.success('Registration successful!');
        fetchEvent();
      } else {
        // Paid event - payment flow
        const paymentResponse = await api.post('/payments/create-order', { 
          eventId: id,
          quantity 
        });

        if (paymentResponse.data.success) {
          sessionStorage.setItem('payment_event_id', id);

          if (!window.Cashfree) {
            throw new Error('Cashfree SDK not loaded. Please refresh the page.');
          }

          const cashfreeMode = import.meta.env.MODE === 'production' ? 'production' : 'sandbox';
          const cashfree = window.Cashfree({ mode: cashfreeMode });

          const checkoutOptions = {
            paymentSessionId: paymentResponse.data.payment_session_id,
            returnUrl: `${window.location.origin}/payment-callback?order_id=${paymentResponse.data.order_id}`,
            redirectTarget: '_self'
          };

          cashfree.checkout(checkoutOptions);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast?.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (categoryName) => {
    return CATEGORY_ICONS[categoryName] || '🎉';
  };

  const nextHighlight = () => {
    setCurrentHighlight((prev) => (prev + 1) % highlights.length);
  };

  const prevHighlight = () => {
    setCurrentHighlight((prev) => (prev - 1 + highlights.length) % highlights.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Event Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-white px-6 py-2 rounded-md transition-colors"
            style={{ 
              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
              fontFamily: 'Oswald, sans-serif'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const spotsLeft = event.maxParticipants - (event.currentParticipants || 0);
  const eventEnded = new Date(event.date) < new Date();

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />

      {/* Banner Section */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {event.images && event.images.length > 0 ? (
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
            <div className="text-8xl">{getCategoryIcon(event.categories?.[0])}</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        {/* Banner Text Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-600 px-3 py-1 rounded-full text-sm font-medium text-white">
                {event.categories?.[0] || 'Event'}
              </span>
            </div>
            <h1 
              className="text-3xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About the Event */}
            <section>
              <h2 
                className="text-3xl font-bold text-white mb-4"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                About the Event
              </h2>
              <div className="text-gray-400">
                {(event.description || 'Get ready to step into experiences where conversations flow naturally and connections feel effortless. From lively social mixers filled with energy, to meaningful conversations that stay with you. Mingle & Meet brings together moments that turn strangers into connections and interactions into lasting memories.')
                  .split('\n\n')
                  .filter(para => para.trim())
                  .map((paragraph, idx, arr) => (
                    <p 
                      key={idx}
                      className={`${showMore || idx === 0 ? '' : 'hidden'} ${idx < arr.length - 1 ? 'mb-4' : ''}`}
                      style={{ fontFamily: 'Source Serif Pro, serif', lineHeight: '1.6' }}
                    >
                      {paragraph.trim()}
                    </p>
                  ))}
                {event.description && event.description.length > 200 && (
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="text-indigo-400 hover:text-indigo-300 mt-2 flex items-center gap-1"
                  >
                    {showMore ? 'Show less' : 'Show more'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </section>

            {/* Event Guide - 4 Column Grid */}
            {/* <section>
              <h2 
                className="text-3xl font-bold text-white mb-6"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Event Guide
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                    <h3 
                      className="text-sm font-semibold text-gray-400"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      Category
                    </h3>
                  </div>
                  <p 
                    className="text-white font-medium"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    {event.categories?.[0] || 'Meet & Mingle'}
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                    <h3 
                      className="text-sm font-semibold text-gray-400"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      Who it's for
                    </h3>
                  </div>
                  <p 
                    className="text-white font-medium"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    Everyone
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="h-5 w-5 text-indigo-400" />
                    <h3 
                      className="text-sm font-semibold text-gray-400"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      What you'll find here
                    </h3>
                  </div>
                  <p 
                    className="text-white font-medium"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    Ice-breaker events & group activities
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-indigo-400" />
                    <h3 
                      className="text-sm font-semibold text-gray-400"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      Age Restriction
                    </h3>
                  </div>
                  <p 
                    className="text-white font-medium"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    18 yrs & above
                  </p>
                </div>
              </div>
            </section> */}

            {/* Host */}
            <section>
              <h2 
                className="text-3xl font-bold text-white mb-4"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Host
              </h2>
              <div className="flex items-start gap-4 bg-zinc-900 rounded-xl p-6 border border-gray-800">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {event.host?.profilePicture ? (
                    <img 
                      src={event.host.profilePicture} 
                      alt={event.host.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-white font-bold">
                      {event.host?.name?.charAt(0) || 'H'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold text-white mb-1"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    {event.host?.name || 'Event Organizer'}
                  </h3>
                  <p 
                    className="text-sm text-indigo-400 mb-2"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    {event.host?.hostPartnerType === 'community_organizer' ? 'Musical Band' : 'Event Organizer'}
                  </p>
                  <p 
                    className="text-gray-400"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    {event.host?.bio || 'Passionate about creating memorable experiences and bringing people together.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Venue */}
            <section>
              <h2 
                className="text-3xl font-bold text-white mb-4"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Venue
              </h2>
              <div className="bg-zinc-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 
                        className="text-xl font-bold text-white mb-1"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        {event.venue || 'Event Venue'}
                      </h3>
                      <p 
                        className="text-gray-400"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        {typeof event.location === 'string' 
                          ? event.location 
                          : (() => {
                              const loc = event.location;
                              if (!loc) return 'Venue address not available';
                              // If address field exists and looks complete (has commas), just show it
                              if (loc.address) {
                                return loc.address;
                              }
                              // Otherwise build from components
                              const parts = [];
                              if (loc.city) parts.push(loc.city);
                              if (loc.state) parts.push(loc.state);
                              if (loc.zipCode) parts.push(loc.zipCode);
                              return parts.length > 0 ? parts.join(', ') : 'Venue address not available';
                            })()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const address = typeof event.location === 'string' 
                        ? event.location 
                        : event.location?.address || event.location?.city || '';
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                    }}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Navigation className="h-4 w-4" />
                    <span 
                      className="text-sm font-medium"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Get Directions
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* Highlights Carousel */}
            {highlights.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Highlights
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevHighlight}
                      className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextHighlight}
                      className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={highlights[currentHighlight]}
                    alt={`Highlight ${currentHighlight + 1}`}
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {highlights.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentHighlight(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentHighlight 
                            ? 'bg-white w-8' 
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Terms and Conditions */}
            <section>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setOpenFAQ(openFAQ === 'terms' ? null : 'terms')}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span 
                    className="font-semibold text-lg text-gray-900 dark:text-white"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Terms And Conditions
                  </span>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform ${
                      openFAQ === 'terms' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {openFAQ === 'terms' && (
                  <div 
                    className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed space-y-3"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    <p>1. All registrations are subject to availability and confirmation.</p>
                    <p>2. Tickets once booked cannot be cancelled or refunded.</p>
                    <p>3. Entry is subject to valid ticket and photo ID verification.</p>
                    <p>4. Organizers reserve the right to deny entry without refund.</p>
                    <p>5. Participants are expected to maintain decorum and respect fellow attendees.</p>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Column - Sticky Event Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl lg:sticky lg:top-24 border border-gray-200 dark:border-gray-800">
              
              {/* Host Profile Small */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {event.host?.profilePicture ? (
                    <img 
                      src={event.host.profilePicture} 
                      alt={event.host.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl text-white font-bold">
                      {event.host?.name?.charAt(0) || 'H'}
                    </span>
                  )}
                </div>
                <div>
                  <p 
                    className="text-sm text-gray-500 dark:text-gray-400"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    Hosted by
                  </p>
                  <p 
                    className="font-semibold text-gray-900 dark:text-white"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    {event.host?.name || 'Event Organizer'}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4 mb-6">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p 
                      className="text-sm text-gray-500 dark:text-gray-400"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Date
                    </p>
                    <p 
                      className="font-medium text-gray-900 dark:text-white"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p 
                      className="text-sm text-gray-500 dark:text-gray-400"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Time
                    </p>
                    <p 
                      className="font-medium text-gray-900 dark:text-white"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      {event.startTime && event.endTime 
                        ? `${event.startTime} - ${event.endTime}` 
                        : event.time || '08:00'}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p 
                      className="text-sm text-gray-500 dark:text-gray-400 mb-1"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Location
                    </p>
                    <p 
                      className="font-medium text-gray-900 dark:text-white text-sm leading-relaxed"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      {typeof event.location === 'string' 
                        ? event.location 
                        : (() => {
                            const loc = event.location;
                            if (!loc) return event.venue || 'Venue TBD';
                            // If address exists, just show it (it should be complete)
                            if (loc.address) {
                              return loc.address;
                            }
                            // Otherwise build from city/state/zipCode
                            const parts = [loc.city, loc.state, loc.zipCode].filter(Boolean);
                            return parts.length > 0 ? parts.join(', ') : (event.venue || 'Venue TBD');
                          })()}
                    </p>
                  </div>
                </div>

                {/* Participants */}
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p 
                      className="text-sm text-gray-500 dark:text-gray-400"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      Participants
                    </p>
                    <p 
                      className="font-medium text-gray-900 dark:text-white"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      {event.currentParticipants || 0}/{event.maxParticipants} joined
                    </p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 text-center py-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                <p 
                  className="text-sm text-gray-500 dark:text-gray-400 mb-1"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  Starting from
                </p>
                {(event.price?.amount === 0 || !event.price) ? (
                  <p 
                    className="text-3xl font-bold text-green-600"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    FREE
                  </p>
                ) : (
                  <p 
                    className="text-3xl font-bold text-gray-900 dark:text-white"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    ₹{event.price?.amount}
                  </p>
                )}
              </div>



              {/* CTA Button */}
              {isRegistered ? (
                <button
                  onClick={() => navigate('/user/dashboard')}
                  className="w-full py-3 rounded-md font-semibold text-lg transition-all transform hover:scale-105 hover:opacity-90 shadow-2xl text-white"
                  style={{ 
                    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    fontFamily: 'Oswald, sans-serif'
                  }}
                >
                  <Ticket className="inline h-5 w-5 mr-2" />
                  View Ticket
                </button>
              ) : user && user.role !== 'user' ? (
                <div className="w-full py-3 px-4 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-center">
                  <p 
                    className="text-sm text-gray-600 dark:text-gray-400"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    Only regular users can register
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/billing/${event._id}`)}
                  disabled={spotsLeft === 0 || eventEnded}
                  className={`w-full py-3 rounded-md font-semibold text-lg transition-all transform shadow-2xl ${
                    eventEnded || spotsLeft === 0
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'hover:scale-105 hover:opacity-90 text-white'
                  }`}
                  style={
                    eventEnded || spotsLeft === 0
                      ? { fontFamily: 'Oswald, sans-serif' }
                      : { 
                          background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                          fontFamily: 'Oswald, sans-serif'
                        }
                  }
                >
                  {eventEnded ? (
                    <>
                      <Clock className="inline h-5 w-5 mr-2" />
                      Event Ended
                    </>
                  ) : spotsLeft === 0 ? (
                    <>
                      <XCircle className="inline h-5 w-5 mr-2" />
                      Event Full
                    </>
                  ) : (
                    <>
                      <Ticket className="inline h-5 w-5 mr-2" />
                      Book your Tickets
                    </>
                  )}
                </button>
              )}

              {/* Availability Alert */}
              {!eventEnded && spotsLeft > 0 && (
                <div className={`mt-4 p-3 rounded-lg ${
                  spotsLeft === 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                  spotsLeft <= 10 ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 animate-pulse' :
                  spotsLeft <= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                  'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                }`}>
                  <p 
                    className={`text-sm font-medium text-center ${
                      spotsLeft === 0 ? 'text-red-800 dark:text-red-200' :
                      spotsLeft <= 10 ? 'text-orange-800 dark:text-orange-200' :
                      spotsLeft <= 50 ? 'text-yellow-800 dark:text-yellow-200' :
                      'text-green-800 dark:text-green-200'
                    }`}
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    {spotsLeft === 0 ? '🚫 Event is Full' :
                     spotsLeft <= 10 ? `⚡ Only ${spotsLeft} spots left!` :
                     `✅ ${spotsLeft} spots available`}
                  </p>
                </div>
              )}

              {/* Limited seats notice */}
              {!eventEnded && spotsLeft > 0 && spotsLeft <= event.maxParticipants * 0.2 && (
                <p 
                  className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  ⚠️ Limited seats available - Book now!
                </p>
              )}

              {/* Save and Share */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={handleSaveEvent}
                    disabled={isSaving}
                    className={`flex items-center gap-2 transition-colors ${
                      isSaved 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
                    } disabled:opacity-50`}
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    <Share2 className="h-5 w-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          eventTitle={event?.title}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 
                className="text-xl font-bold text-gray-900 dark:text-white"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Share Event
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 
                className="font-semibold text-gray-900 dark:text-white mb-1"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {event?.title}
              </h4>
              <p 
                className="text-sm text-gray-600 dark:text-gray-400"
                style={{ fontFamily: 'Source Serif Pro, serif' }}
              >
                {formatDate(event?.date)} • {typeof event?.location === 'string' ? event?.location : event?.location?.city || 'Location TBA'}
              </p>
            </div>
            
            <div className="space-y-3">
              {/* WhatsApp */}
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="w-full flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <span 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  Share on WhatsApp
                </span>
              </button>

              {/* Instagram */}
              <button
                onClick={() => shareToSocial('instagram')}
                className="w-full flex items-center gap-3 p-4 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  Share on Instagram
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => shareToSocial('facebook')}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  Share on Facebook
                </span>
              </button>

              {/* Twitter */}
              <button
                onClick={() => shareToSocial('twitter')}
                className="w-full flex items-center gap-3 p-4 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
                <span 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  Share on Twitter
                </span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => shareToSocial('linkedin')}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <span 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  Share on LinkedIn
                </span>
              </button>

              {/* Copy Link */}
              <button
                onClick={copyEventLink}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border-2 border-gray-200 dark:border-gray-600"
              >
                <div className="w-10 h-10 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  Copy Link
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
