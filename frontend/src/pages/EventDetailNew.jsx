import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import ShareModal from '../components/ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { CATEGORY_ICONS } from '../constants/eventConstants';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryHelper';
import { convert24To12Hour } from '../utils/timeUtils';

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
  const [currentHighlight, setCurrentHighlight] = useState(null);
  
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

          // Use explicit Cashfree mode from environment variable, fallback to 'sandbox' for safety
          const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || 'sandbox';
          console.log('Initializing Cashfree in mode:', cashfreeMode);
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
  
  // Check if event has ended by considering both date and end time
  const isEventEnded = () => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (event.endTime) {
      // Parse end time (e.g., "08:30 PM")
      const timeMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        eventDate.setHours(hours, minutes, 0, 0);
        return eventDate < now;
      }
    }
    
    // If no end time, consider event lasts until end of day
    eventDate.setHours(23, 59, 59, 999);
    return eventDate < now;
  };
  
  const eventEnded = isEventEnded();
  
  // Prepare meta tags data
  const eventUrl = typeof window !== 'undefined' ? window.location.href : '';
  // Get full Cloudinary URL (not optimized) for better social media compatibility
  // If no image, og:image will simply not be set (handled below)
  const eventImage = event.images && event.images.length > 0 
    ? event.images[0] 
    : null;
  const eventLocation = typeof event.location === 'string' 
    ? event.location.split(',')[0] 
    : (event.location?.city || 'Location TBA');
  const eventDescription = event.description 
    ? event.description.substring(0, 160) + '...'
    : `Join us for ${event.title} on ${formatDate(event.date)}`;

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{event.title} | IndulgeOut</title>
        <meta name="description" content={eventDescription} />
        
        {/* Open Graph Meta Tags (Facebook, LinkedIn, WhatsApp) */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={eventUrl} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={eventDescription} />
        {eventImage && (
          <>
            <meta property="og:image" content={eventImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}
        <meta property="og:site_name" content="IndulgeOut" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={eventUrl} />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={eventDescription} />
        {eventImage && <meta name="twitter:image" content={eventImage} />}
      </Helmet>
      
      <div className="min-h-screen bg-black">
      <NavigationBar />

      {/* Banner Section - Mobile (portrait with blur) - Keep for mobile */}
      <div className="block md:hidden relative w-full h-[65vh] overflow-hidden bg-black">
        {event.images && event.images.length > 0 ? (
          <>
            {/* Blurred background layer */}
            <div className="absolute inset-0 -z-10">
              <img
                src={getOptimizedCloudinaryUrl(event.images[0])}
                alt=""
                className="w-full h-full object-cover blur-3xl scale-125"
                style={{ opacity: 0.4 }}
              />
            </div>
            {/* Sharp foreground image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={getOptimizedCloudinaryUrl(event.images[0])}
                alt={event.title}
                className="w-full h-full object-contain max-h-full"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
            <div className="text-8xl">{getCategoryIcon(event.categories?.[0])}</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Save and Share Buttons - Glass Effect */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20 pointer-events-auto">
          <button 
            onClick={handleSaveEvent}
            disabled={isSaving}
            className={`p-2 rounded-full backdrop-blur-md transition-all flex items-center justify-center ${
              isSaved 
                ? 'bg-white/10 text-red-500 border border-white/20' 
                : 'bg-black/10 text-white border border-white/20 hover:bg-white/20'
            } disabled:opacity-50`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-black/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-8">
        
        {/* ========== MOBILE CONTENT ========== */}
        <div className="md:hidden space-y-6">
          
          {/* Event Name & Category */}
          <div>
            <h1 
              className="text-2xl font-bold text-white leading-tight mb-3"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {event.categories?.map((cat, idx) => (
                <span key={idx} className="bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-medium text-indigo-300">
                  {cat}
                </span>
              )) || (
                <span className="bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-medium text-indigo-300">
                  Event
                </span>
              )}
            </div>
          </div>

          {/* Date, Time, Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-400 flex-shrink-0" />
              <p className="text-sm font-medium text-white" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                {formatDate(event.date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-indigo-400 flex-shrink-0" />
              <p className="text-sm font-medium text-white" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                {event.startTime && event.endTime 
                  ? `${convert24To12Hour(event.startTime || event.startTime)} - ${convert24To12Hour(event.endTime || event.endTime)}` 
                  : event.time || '08:00'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0" />
              <p className="text-sm font-medium text-white" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                {event.venue 
                  ? event.venue 
                  : typeof event.location === 'string' 
                    ? (() => {
                        const parts = event.location.split(',').map(s => s.trim());
                        return parts[0] || 'Location TBA';
                      })()
                    : event.location?.address 
                      ? event.location.address.split(',')[0].trim()
                      : event.location?.city || 'Location TBA'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-800" />

          {/* About the Event */}
          <section>
            <h2 
              className="text-xl font-bold text-white mb-3"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              About the Event
            </h2>
            <div className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {(() => {
                const desc = event.description || '';
                if (!desc) return <p>Details coming soon.</p>;
                
                // Split by double newlines for paragraphs, then handle single newlines
                const paragraphs = desc.split(/\n\s*\n/).filter(p => p.trim());
                const visibleParagraphs = showMore ? paragraphs : paragraphs.slice(0, 1);
                
                return visibleParagraphs.map((paragraph, idx) => (
                  <div key={idx} className={idx < visibleParagraphs.length - 1 ? 'mb-4' : ''}>
                    {paragraph.split('\n').map((line, lineIdx) => (
                      <React.Fragment key={lineIdx}>
                        {line.trim()}
                        {lineIdx < paragraph.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                ));
              })()}
              {event.description && event.description.length > 200 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-indigo-400 hover:text-indigo-300 mt-3 flex items-center gap-1 text-sm font-medium"
                >
                  {showMore ? 'Show less' : 'Show more'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </section>

          {/* Host */}
          <section>
            <h2 
              className="text-lg font-bold text-white mb-2"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Host
            </h2>
            <div className="flex items-center gap-3 bg-zinc-900 rounded-xl px-3 py-2.5 border border-gray-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {event.host?.profilePicture ? (
                  <img 
                    src={event.host.profilePicture} 
                    alt={event.host.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-white font-bold">
                    {event.host?.name?.charAt(0) || 'H'}
                  </span>
                )}
              </div>
              <h3 
                className="text-sm font-bold text-white"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {event.host?.name || 'Event Organizer'}
              </h3>
            </div>
          </section>

          {/* Venue */}
          <section>
            <h2 
              className="text-xl font-bold text-white mb-3"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Venue
            </h2>
            <div className="bg-zinc-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 
                    className="text-base font-bold text-white mb-1"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    {event.venue }
                  </h3>
                  <p 
                    className="text-gray-400 text-sm leading-relaxed"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    {typeof event.location === 'string' 
                      ? event.location 
                      : (() => {
                          const loc = event.location;
                          if (!loc) return 'Venue address not available';
                          if (loc.address) return loc.address;
                          const parts = [loc.city, loc.state, loc.zipCode].filter(Boolean);
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors border border-gray-700"
              >
                <Navigation className="h-4 w-4" />
                <span className="text-sm font-medium" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                  Get Directions
                </span>
              </button>
            </div>
          </section>

          {/* Highlights Grid */}
          {highlights.length > 0 && (
            <section>
              <h2 
                className="text-xl font-bold text-white mb-3"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Highlights
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {highlights.map((image, index) => (
                  <div 
                    key={index}
                    onClick={() => setCurrentHighlight(index)}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={getOptimizedCloudinaryUrl(image)}
                      alt={`Highlight ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Terms and Conditions */}
          <section>
            <div className="bg-zinc-900 rounded-xl border border-gray-800">
              <button
                onClick={() => setOpenFAQ(openFAQ === 'terms' ? null : 'terms')}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <span 
                  className="font-semibold text-base text-white"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  Terms And Conditions
                </span>
                <ChevronDown 
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    openFAQ === 'terms' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFAQ === 'terms' && (
                <div 
                  className="px-5 pb-4 text-gray-400 leading-relaxed space-y-2 text-sm"
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

        {/* ========== DESKTOP CONTENT ========== */}
        {/* Desktop: Two Column Layout - Content Left, Sticky Card Right */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-8">
          {/* Left Column - Banner + All Content Sections */}
          <div className="md:col-span-2 space-y-8">
            {/* Banner Image */}
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
              {event.images && event.images.length > 0 ? (
                <>
                  {/* Blurred background layer - subtle */}
                  <div className="absolute inset-0">
                    <img
                      src={getOptimizedCloudinaryUrl(event.images[0])}
                      alt=""
                      className="w-full h-full object-cover blur-3xl scale-125"
                    />
                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40"></div>
                  </div>
                  {/* Main image - centered, showing at least 80% of photo */}
                  <div className="relative w-full h-full flex items-center justify-center z-10 px-4">
                    <img
                      src={getOptimizedCloudinaryUrl(event.images[0])}
                      alt={event.title}
                      className="max-w-full max-h-full object-contain"
                      style={{ maxWidth: '95%', maxHeight: '95%' }}
                    />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                  <div className="text-8xl">{getCategoryIcon(event.categories?.[0])}</div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Save and Share Buttons - Glass Effect */}
              <div className="absolute top-6 right-6 flex items-center gap-3 z-20 pointer-events-auto">
                <button 
                  onClick={handleSaveEvent}
                  disabled={isSaving}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                    isSaved 
                      ? 'bg-white/20 text-red-500 border border-white/30' 
                      : 'bg-black/20 text-white border border-white/20 hover:bg-white/30'
                  } disabled:opacity-50`}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* About the Event */}
            <section>
              <h2 
                className="text-2xl font-bold text-white mb-4"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                About the Event
              </h2>
              <div className="text-gray-400 leading-relaxed" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                {(() => {
                  const desc = event.description || '';
                  if (!desc) return <p>Details coming soon.</p>;
                  
                  const paragraphs = desc.split(/\n\s*\n/).filter(p => p.trim());
                  const visibleParagraphs = showMore ? paragraphs : paragraphs.slice(0, 1);
                  
                  return visibleParagraphs.map((paragraph, idx) => (
                    <div key={idx} className={idx < visibleParagraphs.length - 1 ? 'mb-4' : ''}>
                      {paragraph.split('\n').map((line, lineIdx) => (
                        <React.Fragment key={lineIdx}>
                          {line.trim()}
                          {lineIdx < paragraph.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  ));
                })()}
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
                className="text-xl font-bold text-white mb-3"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Host
              </h2>
              <div className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 border border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {event.host?.profilePicture ? (
                    <img 
                      src={event.host.profilePicture} 
                      alt={event.host.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg text-white font-bold">
                      {event.host?.name?.charAt(0) || 'H'}
                    </span>
                  )}
                </div>
                <h3 
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {event.host?.name || 'Event Organizer'}
                </h3>
              </div>
            </section>

            {/* Venue */}
            <section>
              <h2 
                className="text-2xl font-bold text-white mb-4"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Venue
              </h2>
              <div className="bg-zinc-900 rounded-xl p-6 border border-gray-800">
                {/* Desktop Layout */}
                <div className="hidden md:flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 
                        className="text-xl font-bold text-white mb-1"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        {event.venue}
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

                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 
                        className="text-xl font-bold text-white mb-2"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        {event.venue}
                      </h3>
                      <p 
                        className="text-gray-400 leading-relaxed"
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors border border-gray-700"
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

            {/* Highlights Grid */}
            {highlights.length > 0 && (
              <section>
                <h2 
                  className="text-2xl font-bold text-white mb-4"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  Highlights
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {highlights.map((image, index) => (
                    <div 
                      key={index}
                      onClick={() => setCurrentHighlight(index)}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={getOptimizedCloudinaryUrl(image)}
                        alt={`Highlight ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    </div>
                  ))}
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
          <div className="md:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-800">
                
                {/* Event Name */}
                <div className="mb-5">
                  <h1 
                    className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-3"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    {event.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs font-medium text-white">
                      {event.categories?.[0] || 'Event'}
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4 mb-5 pb-5 border-b border-gray-200 dark:border-gray-800">
                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p 
                        className="text-xs text-gray-500 dark:text-gray-400 mb-0.5"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        Date
                      </p>
                      <p 
                        className="font-semibold text-sm text-gray-900 dark:text-white"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p 
                        className="text-xs text-gray-500 dark:text-gray-400 mb-0.5"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        Time
                      </p>
                      <p 
                        className="font-semibold text-sm text-gray-900 dark:text-white"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        {event.startTime && event.endTime 
                          ? `${convert24To12Hour(event.startTime || event.startTime)} - ${convert24To12Hour(event.endTime || event.endTime)}` 
                          : event.time || '08:00'}
                      </p>
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p 
                        className="text-xs text-gray-500 dark:text-gray-400 mb-0.5"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        Venue
                      </p>
                      <p 
                        className="font-semibold text-sm text-gray-900 dark:text-white mb-1"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        {event.venue}
                      </p>
                      <p 
                        className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        {typeof event.location === 'string' 
                          ? (() => {
                              const parts = event.location.split(',').map(s => s.trim());
                              const addressParts = parts.filter(part => 
                                !part.toLowerCase().includes('bangalore') && 
                                !part.toLowerCase().includes('bengaluru') &&
                                !part.toLowerCase().includes('karnataka') &&
                                !part.toLowerCase().includes('india')
                              ).slice(0, 3);
                              return addressParts.length > 0 ? addressParts.join(', ') : parts.slice(0, 2).join(', ');
                            })()
                          : (() => {
                              const loc = event.location;
                              if (!loc) return 'Address details coming soon';
                              if (loc.address) {
                                const parts = loc.address.split(',').map(s => s.trim());
                                const addressParts = parts.filter(part => 
                                  !part.toLowerCase().includes('bangalore') && 
                                  !part.toLowerCase().includes('bengaluru') &&
                                  !part.toLowerCase().includes('karnataka') &&
                                  !part.toLowerCase().includes('india')
                                ).slice(0, 3);
                                return addressParts.length > 0 ? addressParts.join(', ') : parts.slice(0, 2).join(', ');
                              }
                              const parts = [loc.city, loc.state].filter(Boolean);
                              return parts.length > 0 ? parts.join(', ') : 'Address details coming soon';
                            })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5 text-center py-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <p 
                    className="text-xs text-gray-500 dark:text-gray-400 mb-0.5"
                    style={{ fontFamily: 'Source Serif Pro, serif' }}
                  >
                    Starting from
                  </p>
                  {(event.price?.amount === 0 || !event.price) ? (
                    <p 
                      className="text-2xl font-bold text-green-600"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      FREE
                    </p>
                  ) : (
                    <p 
                      className="text-2xl font-bold text-gray-900 dark:text-white"
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
                    className="w-full py-3 rounded-xl font-semibold text-base transition-all transform hover:scale-105 hover:opacity-90 shadow-lg text-white"
                    style={{ 
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                      fontFamily: 'Oswald, sans-serif'
                    }}
                  >
                    <Ticket className="inline h-5 w-5 mr-2" />
                    View Ticket
                  </button>
                ) : user && user.role !== 'user' ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-center">
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
                    className={`w-full py-3 rounded-xl font-semibold text-base transition-all transform shadow-lg ${
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
                        Book Tickets
                      </>
                    )}
                  </button>
                )}
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
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        event={event}
        onShare={shareToSocial}
        onCopyLink={copyEventLink}
      />

      {/* Mobile Sticky Bottom Bar - District Style */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #7878E9 0%, #3D3DD4 100%)', paddingTop: '3px' }}>
        <div className="bg-zinc-900 rounded-t-3xl px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Price */}
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              Starts from
            </p>
            {(event.price?.amount === 0 || !event.price) ? (
              <p className="text-xl font-bold text-green-500" style={{ fontFamily: 'Oswald, sans-serif' }}>
                FREE
              </p>
            ) : (
              <p className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                ₹{event.price?.amount}
              </p>
            )}
          </div>

          {/* CTA Button */}
          {isRegistered ? (
            <button
              onClick={() => navigate('/user/dashboard')}
              className="flex-1 max-w-[220px] py-3 rounded-lg font-bold text-sm text-white text-center transition-all uppercase tracking-wide"
              style={{ 
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                fontFamily: 'Oswald, sans-serif'
              }}
            >
              VIEW TICKET
            </button>
          ) : user && user.role !== 'user' ? (
            <button
              disabled
              className="flex-1 max-w-[220px] py-3 rounded-lg font-bold text-sm bg-gray-700 text-gray-500 cursor-not-allowed uppercase tracking-wide"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              NOT AVAILABLE
            </button>
          ) : (
            <button
              onClick={() => navigate(`/billing/${event._id}`)}
              disabled={spotsLeft === 0 || eventEnded}
              className={`flex-1 max-w-[220px] py-3 rounded-lg font-bold text-sm text-center transition-all uppercase tracking-wide ${
                eventEnded || spotsLeft === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'text-white'
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
              {eventEnded ? 'EVENT ENDED' : spotsLeft === 0 ? 'EVENT FULL' : 'BOOK TICKETS'}
            </button>
          )}
        </div>
        </div>
        </div>
      </div>

      {/* Highlight Image Lightbox */}
      {currentHighlight !== null && highlights.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setCurrentHighlight(null)}
        >
          <button
            onClick={() => setCurrentHighlight(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all z-10"
          >
            <XCircle className="h-6 w-6" />
          </button>
          
          {/* Navigation Arrows */}
          {highlights.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentHighlight((prev) => prev === 0 ? highlights.length - 1 : prev - 1);
                }}
                className="absolute left-6 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentHighlight((prev) => prev === highlights.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-6 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          
          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
            {currentHighlight + 1} / {highlights.length}
          </div>
          
          <img
            src={getOptimizedCloudinaryUrl(highlights[currentHighlight])}
            alt={`Highlight ${currentHighlight + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
    </>
  );
};

export default EventDetail;
