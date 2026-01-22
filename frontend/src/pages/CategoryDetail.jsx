import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import EventCard from '../components/EventCard';
import CommunityCard from '../components/CommunityCard';
import FilterBar from '../components/FilterBar';
import LoginPromptModal from '../components/LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryBySlug } from '../constants/categories';
import { API_URL } from '../config/api';

const CategoryDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fallbackCategory = getCategoryBySlug(slug);

  const [category, setCategory] = useState(fallbackCategory);
  const [events, setEvents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch category from API
  useEffect(() => {
    if (slug) {
      fetchCategory();
    }
  }, [slug]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories/${slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }

      const data = await response.json();
      
      if (data.success && data.category) {
        setCategory(data.category);
        setUsingFallback(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching category, using fallback:', error);
      // Fallback to frontend constants
      if (fallbackCategory) {
        setCategory(fallbackCategory);
        setUsingFallback(true);
      } else {
        navigate('/categories');
      }
    }
  };

  // If category not found, redirect to categories page
  useEffect(() => {
    if (!category && !fallbackCategory) {
      navigate('/categories');
    }
  }, [category, fallbackCategory, navigate]);

  // Fetch events and communities for this category
  useEffect(() => {
    if (category) {
      fetchCategoryData();
    }
  }, [category, filters]);

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      // Fetch events for this category
      const eventsResponse = await fetch(`${API_URL}/api/explore/events/popular?limit=12`);
      
      if (!eventsResponse.ok) {
        console.error('Events API returned error:', eventsResponse.status);
        setEvents([]);
      } else {
        const eventsData = await eventsResponse.json();
        
        // Safely filter by category name
        let filteredEvents = [];
        if (eventsData && eventsData.events && Array.isArray(eventsData.events)) {
          filteredEvents = eventsData.events.filter(event =>
            event.categories?.includes(category.name)
          );

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
        }
        
        setEvents(filteredEvents);
      }

      // Fetch communities for this category
      const communitiesResponse = await fetch(`${API_URL}/api/explore/communities/featured?limit=6`);
      
      if (!communitiesResponse.ok) {
        console.error('Communities API returned error:', communitiesResponse.status);
        setCommunities([]);
      } else {
        const communitiesData = await communitiesResponse.json();
        
        // Safely filter by category
        let filteredCommunities = [];
        if (communitiesData && communitiesData.communities && Array.isArray(communitiesData.communities)) {
          filteredCommunities = communitiesData.communities.filter(community =>
            community.category === category.name
          );
        }
        
        setCommunities(filteredCommunities);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      setEvents([]);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleFavorite = (itemId) => {
    if (!user) {
      setShowLoginPrompt(true);
      return false;
    }
    console.log('Favorited:', itemId);
    return true;
  };

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <NavigationBar />

      {/* Fallback Mode Indicator */}
      {usingFallback && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
              ℹ️ Viewing cached category data (API unavailable)
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className={`relative bg-gradient-to-br ${category.color} pt-24 pb-16 overflow-hidden`}>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, white 2px, transparent 2px)`,
            backgroundSize: '30px 30px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-8 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Categories</span>
          </button>

          {/* Category Info */}
          <div className="text-center mb-12">
            <div className="text-7xl mb-4">{category.emoji}</div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {category.name}
            </h1>
            <p className="text-2xl text-white/90 mb-8">
              {category.descriptor}
            </p>
          </div>

          {/* Who is this for? & What you'll find */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Who is this for */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">WHO IS THIS FOR?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-white/70 mt-1">→</span>
                  <span>People passionate about {category.name.toLowerCase()}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/70 mt-1">→</span>
                  <span>Anyone looking to explore {category.subtext.toLowerCase()}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/70 mt-1">→</span>
                  <span>Community members who love to connect and share</span>
                </li>
              </ul>
            </div>

            {/* What you'll find */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">WHAT YOU'LL FIND HERE?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Curated events matching your interests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Active communities to join</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Like-minded people to connect with</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Opportunities to host your own events</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">{category.analytics?.eventCount || events.length}+</div>
              <div className="text-white/75">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{category.analytics?.communityCount || communities.length}+</div>
              <div className="text-white/75">Communities</div>
            </div>
            {category.analytics?.views > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold">{category.analytics.views}</div>
                <div className="text-white/75">Views</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar onFilterChange={handleFilterChange} activeFilters={filters} />

      {/* Upcoming Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Upcoming Events
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
            
            {events.length >= 12 && (
              <div className="text-center mt-8">
                <Link
                  to={`/explore?tab=events&category=${category.name}`}
                  className="inline-block bg-orange-500 text-white font-semibold py-3 px-8 rounded-full hover:bg-orange-600 transition-all"
                >
                  View All Events
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to host an event in this category!
            </p>
            <button
              onClick={() => navigate('/host-partner')}
              className="bg-orange-500 text-white font-semibold py-3 px-8 rounded-full hover:bg-orange-600 transition-all"
            >
              Host an Event
            </button>
          </div>
        )}
      </section>

      {/* Popular Communities Section */}
      {communities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Popular Communities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <CommunityCard
                key={community._id}
                community={community}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Want to host events in this category?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Share your passion and bring people together
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/host-partner')}
              className="bg-white text-orange-500 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105"
            >
              Become a Host
            </button>
            <button
              onClick={() => navigate('/host-partner')}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-full transition-all"
            >
              Partner With Us
            </button>
          </div>
        </div>
      </section>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
};

export default CategoryDetail;
