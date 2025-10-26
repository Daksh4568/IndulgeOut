import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Share2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const EventDiscovery = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyInterested, setShowOnlyInterested] = useState(false);

  const categories = [
    { id: 'all', name: 'All Events', icon: '🎉' },
    { id: 'sip-savor', name: 'Sip & Savor', icon: '🍷' },
    { id: 'sweat-play', name: 'Sweat & Play', icon: '⚽' },
    { id: 'art-diy', name: 'Art & DIY', icon: '🎨' },
    { id: 'mind-soul', name: 'Mind & Soul', icon: '🧘' },
    { id: 'music-dance', name: 'Music & Dance', icon: '🎵' },
    { id: 'adventure', name: 'Adventure', icon: '🏔️' },
    { id: 'tech-innovation', name: 'Tech & Innovation', icon: '💻' },
    { id: 'culture', name: 'Culture & Learning', icon: '📚' }
  ];

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
  }, [events, searchTerm, selectedCategory, selectedLocation, priceRange, showOnlyInterested]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      // Backend returns { events: [...], totalPages, currentPage, total }
      const eventsData = response.data.events || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Error fetching events:', error);
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

  // Helper function to check if event matches user interests
  const matchesUserInterests = (event) => {
    return user?.interests && event.categories?.some(cat => user.interests.includes(cat));
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
        location: { city: 'Mumbai' },
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
        categories: ['Mind & Soul'],
        date: new Date('2024-11-12'),
        time: '6:30 AM',
        location: { city: 'Bangalore' },
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
        location: { city: 'Delhi' },
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

    // Sort by interest relevance: events matching user interests appear first
    if (user?.interests && user.interests.length > 0) {
      filtered.sort((a, b) => {
        const aMatches = a.categories?.some(cat => user.interests.includes(cat)) ? 1 : 0;
        const bMatches = b.categories?.some(cat => user.interests.includes(cat)) ? 1 : 0;
        return bMatches - aMatches; // Events with matching interests first
      });
    }

    setFilteredEvents(filtered);
  };

  const handleEventRegister = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to register for events');
        navigate('/login');
        return;
      }

      await axios.post(`http://localhost:5000/api/events/${eventId}/register`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert('Successfully registered for the event!');
      fetchEvents(); // Refresh events to update participant count
    } catch (error) {
      console.error('Error registering for event:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to register for event. Please try again.');
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Discover Events</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome back, {user?.name}!
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, activities, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
            {user?.interests && user.interests.length > 0 && (
              <button
                onClick={() => setShowOnlyInterested(!showOnlyInterested)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  showOnlyInterested
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-5 w-5 ${showOnlyInterested ? 'fill-current' : ''}`} />
                My Interests
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    }}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
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
          <p className="text-gray-600">
            Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} 
            {user?.interests && user.interests.length > 0 && (
              <span> matching your interests</span>
            )}
          </p>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or explore different categories.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
                setPriceRange('all');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Show All Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Image */}
                <div className="relative h-48 bg-gray-200">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {categories.find(cat => cat.id === event.category)?.icon || '🎉'}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {/* Interest Match Indicator */}
                    {matchesUserInterests(event) && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Heart className="h-3 w-3 fill-current" />
                        Match
                      </div>
                    )}
                    <button className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all">
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all">
                      <Share2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  {event.price === 0 && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      FREE
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {categories.find(cat => cat.id === event.category)?.name}
                    </span>
                    {event.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{event.rating}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {event.venue ? `${event.venue}, ` : ''}{typeof event.location === 'string' ? event.location : event.location?.city || event.location?.address || 'Location TBD'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {event.currentParticipants || 0}/{event.maxParticipants} participants
                    </div>
                    {(event.price?.amount || event.price) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        ₹{event.price?.amount || event.price}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      by {event.host?.name}
                    </span>
                    <button
                      onClick={() => !isUserRegistered(event) && handleEventRegister(event._id)}
                      disabled={event.currentParticipants >= event.maxParticipants || isUserRegistered(event)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        event.currentParticipants >= event.maxParticipants
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isUserRegistered(event)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {event.currentParticipants >= event.maxParticipants
                        ? 'Full'
                        : isUserRegistered(event)
                        ? 'Registered ✓'
                        : 'Register'
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDiscovery;