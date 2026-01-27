import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Heart,
  Star,
  CheckCircle,
  XCircle,
  MessageCircle,
  ThumbsUp,
  Award,
  Ticket,
  User
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
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [quantity, setQuantity] = useState(1); // Number of slots to book
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    fetchEvent();
    fetchReviews();
    
    // Track event view only once
    if (!viewTracked.current) {
      trackEventView();
      viewTracked.current = true;
    }
    
    // Auto-refresh event data every 30 seconds to show real-time availability
    const refreshInterval = setInterval(() => {
      fetchEvent();
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [id]);

  // Fetch attendees when user is registered
  useEffect(() => {
    if (isRegistered && user) {
      fetchAttendees();
    }
  }, [isRegistered, user]);

  const trackEventView = async () => {
    try {
      await api.post(`/events/${id}/view`);
      console.log('Event view tracked successfully');
    } catch (error) {
      console.warn('Failed to track event view:', error);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event); // Backend returns { event: ... }
      
      // Check if user is already registered
      if (user && response.data.event.participants) {
        console.log('Event participants:', response.data.event.participants);
        console.log('Current user ID:', user._id);
        
        const isUserRegistered = response.data.event.participants.some(p => {
          // Participants are objects with { user: {_id, name, ...}, registeredAt, status }
          const participantUserId = p.user?._id || p.user;
          const currentUserId = user._id || user.id;
          return participantUserId === currentUserId || 
                 participantUserId?.toString() === currentUserId?.toString();
        });
        
        console.log('Is user registered:', isUserRegistered);
        setIsRegistered(isUserRegistered);
      }
      
      // Check if event is saved
      if (user) {
        checkIfEventSaved();
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };
  
  // Re-check saved state when user or event changes
  useEffect(() => {
    if (user && event) {
      checkIfEventSaved();
    }
  }, [user, event?._id]);
  
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
    const eventDescription = encodeURIComponent(event?.description || '');
    
    let shareUrl;
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${eventUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${eventUrl}&text=${eventTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${eventUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${eventTitle}%20${eventUrl}`;
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
      toast?.success('Event link copied to clipboard!');
      setShowShareModal(false);
    }).catch(err => {
      console.error('Failed to copy link:', err);
      toast?.error('Failed to copy link');
    });
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await api.get(`/events/${id}/reviews?limit=20`);
      setReviews(response.data.reviews || []);
      setReviewStats(response.data.statistics || {});
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      setAttendeesLoading(true);
      const response = await api.get(`/events/${id}/attendees`);
      setAttendees(response.data.attendees || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      // Don't show error toast, just log it
      if (error.response?.status !== 403) {
        console.warn('Could not fetch attendees:', error.response?.data?.message);
      }
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleRegister = async (retryCount = 0) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // Check if event date has passed
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    if (eventDate < currentDate) {
      toast.warning('Cannot register for past events');
      return;
    }

    // Check if event is full before attempting registration
    if (event.currentParticipants >= event.maxParticipants) {
      toast.error('Sorry, this event is now full!');
      await fetchEvent(); // Refresh to show current state
      return;
    }

    setIsRegistering(true);
    try {
      // Get ticket price from either ticketPrice field or price.amount
      const ticketPrice = event.ticketPrice || event.price?.amount || 0;
      
      // Debug logging
      console.log('Event details:', {
        ticketPrice: ticketPrice,
        eventTicketPrice: event.ticketPrice,
        priceAmount: event.price?.amount,
        hasTicketPrice: ticketPrice > 0,
        eventId: id
      });
      
      // Check if event has ticket price - if yes, initiate payment
      if (ticketPrice > 0) {
        console.log('Paid event detected. Initiating payment flow...');
        
        try {
          // Create payment order
          const paymentResponse = await api.post(
            '/payments/create-order',
            { eventId: id }
          );

          console.log('Payment order response:', paymentResponse.data);

          if (paymentResponse.data.success) {
            // Store event ID for callback
            sessionStorage.setItem('payment_event_id', id);
            
            // Track if from recommendation
            const isFromRecommendation = sessionStorage.getItem('recommendationSource') === 'true';
            if (isFromRecommendation) {
              sessionStorage.setItem('payment_from_recommendation', 'true');
            }

            // Check if Cashfree SDK is loaded
            if (!window.Cashfree) {
              throw new Error('Cashfree SDK not loaded. Please refresh the page.');
            }

            // Initialize Cashfree Checkout
            console.log('Initializing Cashfree checkout...');
            
            // Determine Cashfree mode based on environment
            const cashfreeMode = import.meta.env.MODE === 'production' ? 'production' : 'sandbox';
            console.log('Cashfree mode:', cashfreeMode);
            
            const cashfree = window.Cashfree({
              mode: cashfreeMode
            });

            const checkoutOptions = {
              paymentSessionId: paymentResponse.data.payment_session_id,
              returnUrl: `${window.location.origin}/payment-callback?order_id=${paymentResponse.data.order_id}`,
              redirectTarget: '_self'
            };

            console.log('Opening payment checkout...', checkoutOptions);
            cashfree.checkout(checkoutOptions);
            
            setIsRegistering(false);
            return; // Exit here as payment will redirect
          } else {
            throw new Error('Failed to create payment order');
          }
        } catch (paymentError) {
          console.error('Payment initiation error:', paymentError);
          console.error('Backend error response:', paymentError.response?.data);
          setIsRegistering(false);
          const errorMessage = paymentError.response?.data?.message || 'Failed to initiate payment. Please try again.';
          toast.error(errorMessage);
          return; // Don't proceed with free registration
        }
      } else {
        console.log('Free event detected. Proceeding with direct registration...');
        // Free event - proceed with direct registration
        const response = await api.post(
          `/events/${id}/register`, 
          { quantity }, // Send quantity
          {
            timeout: 10000 // 10 second timeout
          }
        );
        
        // Track if this was from a recommendation
        const isFromRecommendation = sessionStorage.getItem('recommendationSource') === 'true';
        if (isFromRecommendation) {
          try {
            await api.post('/recommendations/track/register', 
              { eventId: id }
            );
            sessionStorage.removeItem('recommendationSource'); // Clean up
          } catch (trackingError) {
            console.error('Failed to track recommendation registration:', trackingError);
          }
        }
        
        console.log('Registration response:', response.data);
        setIsRegistered(true);
        
        // Show success message
        toast.success(`Successfully registered for ${quantity} spot${quantity > 1 ? 's' : ''}!`);
        
        // Refresh event data to show View Ticket button
        await fetchEvent();
      }
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      const errorMessage = error.response?.data?.message;
      
      // Handle specific error cases
      if (errorMessage === 'Event is full') {
        toast.error('Sorry, this event just filled up! Refreshing...');
        await fetchEvent();
      } else if (errorMessage === 'Already registered for this event') {
        toast.warning('You are already registered for this event');
        setIsRegistered(true);
        await fetchEvent();
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Retry on timeout (up to 2 retries)
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s
          toast.warning(`Connection timeout. Retrying in ${delay/1000} seconds...`);
          setTimeout(() => handleRegister(retryCount + 1), delay);
          return; // Don't set isRegistering to false yet
        } else {
          toast.error('Registration timed out. Please check your connection and try again.');
        }
      } else if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        toast.error(errorMessage || 'Registration failed. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (categoryName) => {
    return CATEGORY_ICONS[categoryName] || '🎉';
  };

  const averageRating = reviewStats?.avgRating || event?.avgRating || 0;
  const totalReviews = reviewStats?.totalReviews || event?.totalReviews || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <NavigationBar />

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        {event.images && event.images.length > 0 ? (
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-8xl mb-4">
                {getCategoryIcon(event.categories?.[0])}
              </div>
              <div className="text-2xl font-semibold">
                {event.categories?.[0] || 'Event'}
              </div>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Content over image */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                {event.categories?.[0] || 'Event'}
              </span>
              {(event.price?.amount === 0 || !event.price) ? (
                <span className="bg-green-500 px-3 py-1 rounded-full text-sm font-medium">FREE</span>
              ) : (
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-medium">₹{event.price?.amount || event.price}</span>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4 animate-fadeInUp">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatDate(event.date)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {event.time}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {event.venue || event.location?.city || 'Online'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
              {['overview', 'reviews', ...(isRegistered ? ['attendees'] : [])].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'reviews' && (
                    <span className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                      {reviews.length}
                    </span>
                  )}
                  {tab === 'attendees' && (
                    <span className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                      {attendees.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="animate-fadeIn">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About This Event</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {event.description || 'No description available for this event.'}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Date</div>
                          <div className="text-gray-600 dark:text-gray-400">{formatDate(event.date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Time</div>
                          <div className="text-gray-600 dark:text-gray-400">{event.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Location</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {event.venue ? `${event.venue}, ` : ''}
                            {typeof event.location === 'string' 
                              ? event.location 
                              : event.location?.city || event.location?.address || 'Location TBD'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Participants</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {event.currentParticipants || 0}/{event.maxParticipants} joined
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Host Information */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hosted By</h2>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{event.host?.name || 'Event Host'}</div>
                        <div className="text-gray-600 dark:text-gray-400">Event Organizer</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reviews</h2>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">({totalReviews} reviews)</span>
                      </div>
                    </div>
                    
                    {/* Rating breakdown */}
                    {reviewStats?.ratingDistribution && (
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviewStats.ratingDistribution[rating] || 0;
                          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                          return (
                            <div key={rating} className="flex items-center gap-3">
                              <span className="text-sm w-8">{rating}★</span>
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Individual Reviews */}
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review, index) => (
                        <div 
                          key={review._id} 
                          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-slideInLeft"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg">
                                {review.user?.profilePicture ? (
                                  <img src={review.user.profilePicture} alt={review.user.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  review.user?.name?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900 dark:text-white">{review.user?.name}</div>
                                  {review.isVerifiedAttendee && (
                                    <CheckCircle className="h-4 w-4 text-green-500" title="Verified Attendee" />
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString('en-IN')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{review.comment}</p>
                          
                          {/* Review Photos */}
                          {review.photos && review.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {review.photos.map((photo, idx) => (
                                <img 
                                  key={idx} 
                                  src={photo} 
                                  alt={`Review photo ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                              <ThumbsUp className="h-4 w-4" />
                              Helpful ({review.helpfulCount || 0})
                            </button>
                          </div>

                          {/* Host Response */}
                          {review.response && (
                            <div className="mt-4 ml-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-2 border-indigo-500">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="font-medium text-sm text-indigo-600 dark:text-indigo-400">Host Response</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{review.response.text}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {new Date(review.response.respondedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                      <Star className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Be the first to review this event!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attendees' && (
                <div className="space-y-6">
                  {/* Attendees Header */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Who's Coming</h2>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {attendees.length} {attendees.length === 1 ? 'Attendee' : 'Attendees'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect with other attendees and make the most of this event!
                    </p>
                  </div>

                  {/* Attendees List */}
                  {attendeesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading attendees...</p>
                    </div>
                  ) : attendees.length > 0 ? (
                    <div className="space-y-4">
                      {attendees.map((attendee, index) => (
                        <div 
                          key={attendee.userId} 
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 animate-slideInLeft"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {attendee.profilePicture ? (
                                <img 
                                  src={attendee.profilePicture} 
                                  alt={attendee.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                                  {attendee.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                  {attendee.name}
                                </h3>
                                {attendee.status === 'attended' && (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" title="Attended" />
                                )}
                              </div>
                              {attendee.bio && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                  {attendee.bio}
                                </p>
                              )}
                              {attendee.interests && attendee.interests.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {attendee.interests.slice(0, 3).map((interest, idx) => (
                                    <span 
                                      key={idx}
                                      className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                  {attendee.interests.length > 3 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      +{attendee.interests.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Registered {new Date(attendee.registeredAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                      <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No attendees yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Be the first to register for this event!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Registration Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg lg:sticky lg:top-8">
              {/* Price */}
              <div className="text-center mb-4 sm:mb-6">
                {(event.price?.amount === 0 || !event.price) ? (
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">FREE</div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    ₹{event.price?.amount || event.price}
                    <span className="text-base font-normal text-gray-600 dark:text-gray-400"> per person</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector - Only show if not registered, user role is 'user', and spots available */}
              {!isRegistered && user?.role === 'user' && new Date(event.date) >= new Date() && event.currentParticipants < event.maxParticipants && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Spots
                  </label>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">
                      {quantity}
                    </div>
                    <button
                      onClick={() => {
                        const availableSpots = event.maxParticipants - (event.participants?.length || 0);
                        setQuantity(Math.min(10, availableSpots, quantity + 1));
                      }}
                      className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors"
                      disabled={quantity >= 10 || quantity >= (event.maxParticipants - (event.participants?.length || 0))}
                    >
                      +
                    </button>
                  </div>
                  {quantity > 1 && event.price?.amount > 0 && (
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Total: ₹{(event.price.amount * quantity).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}

              {/* Registration Button */}
              {isRegistered ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-2.5 sm:py-3 rounded-lg font-medium text-base sm:text-lg transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Ticket className="h-5 w-5" />
                  View Ticket
                </button>
              ) : user && user.role !== 'user' ? (
                // Non-user accounts cannot register
                <div className="w-full py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <Users className="inline h-4 w-4 mr-1" />
                    Only regular users can register for events
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering || event.currentParticipants >= event.maxParticipants || new Date(event.date) < new Date()}
                  className={`w-full py-3 rounded-lg font-medium text-lg transition-all duration-300 ${
                    new Date(event.date) < new Date()
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : event.currentParticipants >= event.maxParticipants
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                  } ${isRegistering ? 'animate-pulse' : ''}`}
                >
                  {isRegistering ? (
                    'Registering...'
                  ) : new Date(event.date) < new Date() ? (
                    <>
                      <Clock className="inline h-5 w-5 mr-2" />
                      Event Ended
                    </>
                  ) : event.currentParticipants >= event.maxParticipants ? (
                    <>
                      <XCircle className="inline h-5 w-5 mr-2" />
                      Event Full
                    </>
                  ) : (
                    <>
                      <Ticket className="inline h-5 w-5 mr-2" />
                      {quantity > 1 ? `Book ${quantity} Spots` : 'Register Now'}
                    </>
                  )}
                </button>
              )}

              {/* Availability Alert */}
              {(() => {
                const spotsLeft = event.maxParticipants - (event.currentParticipants || 0);
                const percentFilled = ((event.currentParticipants || 0) / event.maxParticipants) * 100;
                
                if (spotsLeft === 0) {
                  return (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 text-center">
                        🚫 Event is Full
                      </p>
                    </div>
                  );
                } else if (spotsLeft <= 10) {
                  return (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg animate-pulse">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200 text-center">
                        ⚡ Only {spotsLeft} spots left!
                      </p>
                    </div>
                  );
                } else if (percentFilled >= 50) {
                  return (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 text-center">
                        ⏰ {spotsLeft} spots available
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 text-center">
                        ✅ {spotsLeft} spots available
                      </p>
                    </div>
                  );
                }
              })()}

              {/* Quick Info */}
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Registered</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {event.currentParticipants || 0} / {event.maxParticipants}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      ((event.currentParticipants || 0) / event.maxParticipants) >= 0.9 
                        ? 'bg-red-600' 
                        : ((event.currentParticipants || 0) / event.maxParticipants) >= 0.7 
                        ? 'bg-orange-500' 
                        : 'bg-blue-600'
                    }`}
                    style={{ 
                      width: `${Math.min(((event.currentParticipants || 0) / event.maxParticipants) * 100, 100)}%` 
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">2-3 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Language</span>
                  <span className="font-medium text-gray-900 dark:text-white">English, Hindi</span>
                </div>
              </div>

              {/* Save and Share */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={handleSaveEvent}
                    disabled={isSaving}
                    className={`flex items-center gap-2 transition-colors ${
                      isSaved 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
                    } disabled:opacity-50`}
                  >
                    <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
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

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }
      `}</style>

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share Event</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            {/* Event Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{event?.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(event?.date).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })} • {typeof event?.location === 'string' ? event?.location : event?.location?.city || event?.location?.address || 'Location TBA'}
              </p>
            </div>
            
            {/* Social Media Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="w-full flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Share on WhatsApp</span>
              </button>
              
              <button
                onClick={() => shareToSocial('facebook')}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Share on Facebook</span>
              </button>
              
              <button
                onClick={() => shareToSocial('twitter')}
                className="w-full flex items-center gap-3 p-4 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Share on Twitter</span>
              </button>
              
              <button
                onClick={() => shareToSocial('linkedin')}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Share on LinkedIn</span>
              </button>
              
              <button
                onClick={() => shareToSocial('telegram')}
                className="w-full flex items-center gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Share on Telegram</span>
              </button>
              
              {/* Copy Link Button */}
              <button
                onClick={copyEventLink}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group border-2 border-gray-200 dark:border-gray-600"
              >
                <div className="w-10 h-10 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
