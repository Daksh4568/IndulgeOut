import React, { useState, useEffect, useContext } from 'react';
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
import API_BASE_URL from '../config/api.js';
import DarkModeToggle from '../components/DarkModeToggle';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { CATEGORY_ICONS } from '../constants/eventConstants';
import axios from 'axios';

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

  // Mock reviews data
  const [reviews] = useState([
    {
      id: 1,
      user: { name: 'Priya Sharma', avatar: '👩‍💼' },
      rating: 5,
      date: '2024-10-15',
      comment: 'Amazing event! The organization was top-notch and I learned so much. Definitely recommend to others.',
      helpful: 12,
      eventDate: '2024-10-10'
    },
    {
      id: 2,
      user: { name: 'Rahul Mehta', avatar: '👨‍💻' },
      rating: 4,
      date: '2024-10-14',
      comment: 'Great experience overall. The venue was perfect and the activities were engaging. Worth the money!',
      helpful: 8,
      eventDate: '2024-10-10'
    },
    {
      id: 3,
      user: { name: 'Sneha Patel', avatar: '👩‍🎨' },
      rating: 5,
      date: '2024-10-13',
      comment: 'Exceeded my expectations! The instructor was knowledgeable and the hands-on activities were fantastic.',
      helpful: 15,
      eventDate: '2024-10-10'
    }
  ]);

  useEffect(() => {
    fetchEvent();
    
    // Auto-refresh event data every 30 seconds to show real-time availability
    const refreshInterval = setInterval(() => {
      fetchEvent();
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/events/${id}`);
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
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (retryCount = 0) => {
    if (!user) {
      navigate('/login');
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
    if (event.participants && event.participants.length >= event.maxParticipants) {
      toast.error('Sorry, this event is now full!');
      await fetchEvent(); // Refresh to show current state
      return;
    }

    setIsRegistering(true);
    try {
      const token = localStorage.getItem('token');
      
      // Register for the event with timeout
      const response = await axios.post(
        `${API_BASE_URL}/api/events/${id}/register`, 
        {}, 
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );
      
      // Track if this was from a recommendation
      const isFromRecommendation = sessionStorage.getItem('recommendationSource') === 'true';
      if (isFromRecommendation) {
        try {
          await axios.post(`${API_BASE_URL}/api/recommendations/track/register`, 
            { eventId: id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          sessionStorage.removeItem('recommendationSource'); // Clean up
        } catch (trackingError) {
          console.error('Failed to track recommendation registration:', trackingError);
        }
      }
      
      console.log('Registration response:', response.data);
      setIsRegistered(true);
      
      // Show success message and refresh event data
      toast.success('Successfully registered for the event! Check your dashboard to see all registered events.');
      await fetchEvent();
      
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

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h2>
          <button
            onClick={() => navigate('/events')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/events')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Event Details</h1>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

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
            <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700 mb-6">
              {['overview', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 border-b-2 font-medium text-sm transition-colors ${
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
                        <span className="text-gray-600 dark:text-gray-400">({reviews.length} reviews)</span>
                      </div>
                    </div>
                    
                    {/* Rating breakdown */}
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews.filter(r => r.rating === rating).length;
                        const percentage = (count / reviews.length) * 100;
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
                  </div>

                  {/* Individual Reviews */}
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div 
                        key={review.id} 
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-slideInLeft"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg">
                              {review.user.avatar}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{review.user.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(review.date).toLocaleDateString('en-IN')}
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
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            Helpful ({review.helpful})
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            Reply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Registration Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg sticky top-8">
              {/* Price */}
              <div className="text-center mb-6">
                {(event.price?.amount === 0 || !event.price) ? (
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">FREE</div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₹{event.price?.amount || event.price}
                    <span className="text-base font-normal text-gray-600 dark:text-gray-400"> per person</span>
                  </div>
                )}
              </div>

              {/* Registration Button */}
              <button
                onClick={handleRegister}
                disabled={isRegistering || isRegistered || event.currentParticipants >= event.maxParticipants || new Date(event.date) < new Date()}
                className={`w-full py-3 rounded-lg font-medium text-lg transition-all duration-300 ${
                  isRegistered
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 cursor-not-allowed'
                    : new Date(event.date) < new Date()
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : event.currentParticipants >= event.maxParticipants
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                } ${isRegistering ? 'animate-pulse' : ''}`}
              >
                {isRegistering ? (
                  'Registering...'
                ) : isRegistered ? (
                  <>
                    <CheckCircle className="inline h-5 w-5 mr-2" />
                    Registered ✓
                  </>
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
                    Register Now
                  </>
                )}
              </button>

              {/* Availability Alert */}
              {(() => {
                const spotsLeft = event.maxParticipants - (event.participants?.length || 0);
                const percentFilled = ((event.participants?.length || 0) / event.maxParticipants) * 100;
                
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
                    {event.participants?.length || 0} / {event.maxParticipants}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      ((event.participants?.length || 0) / event.maxParticipants) >= 0.9 
                        ? 'bg-red-600' 
                        : ((event.participants?.length || 0) / event.maxParticipants) >= 0.7 
                        ? 'bg-orange-500' 
                        : 'bg-blue-600'
                    }`}
                    style={{ 
                      width: `${Math.min(((event.participants?.length || 0) / event.maxParticipants) * 100, 100)}%` 
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

              {/* Share */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-4">
                  <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
                    <Heart className="h-5 w-5" />
                    Save
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
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
    </div>
  );
};

export default EventDetail;