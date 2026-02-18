import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Sparkles, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import EventCard from '../components/EventCard';
import LoginPromptModal from '../components/LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryBySlug } from '../constants/categories';
import { api } from '../config/api';

const CategoryDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const carouselRef = useRef(null);
  
  // Get category from hardcoded constants (no API fetch needed)
  const category = getCategoryBySlug(slug);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalParticipants: 0
  });

  // If category not found, redirect to categories page
  useEffect(() => {
    if (!category) {
      navigate('/categories');
    }
  }, [category, navigate]);

  // Fetch events for this category
  useEffect(() => {
    if (category) {
      fetchCategoryData();
    }
  }, [category]);

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      // Fetch events for this category using category name
      const eventsResponse = await api.get(`/events?category=${category.name}&status=published`);
      
      // Handle response - could be array or object with data property
      let filteredEvents = Array.isArray(eventsResponse.data) 
        ? eventsResponse.data 
        : (eventsResponse.data?.events || []);
      
      setEvents(filteredEvents);

      // Calculate stats
      const now = new Date();
      const upcoming = filteredEvents.filter(event => new Date(event.date) >= now);
      const totalParticipants = filteredEvents.reduce((sum, event) => sum + (event.currentParticipants || 0), 0);

      setStats({
        totalEvents: filteredEvents.length,
        upcomingEvents: upcoming.length,
        totalParticipants
      });
      
    } catch (error) {
      console.error('Error fetching category data:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      if (direction === 'left') {
        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
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
    <div className="min-h-screen bg-black text-white">
      <NavigationBar />

      {/* Hero Image Section */}
      <section className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={`/images/${category.slug}.jpg`}
            alt={category.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/images/postercard1.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black"></div>
        </div>

        {/* Back Button - Overlaid on image */}
        <div className="absolute top-4 sm:top-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1 transition-transform" />
            <span style={{ fontFamily: 'Source Serif Pro, serif' }}>Back to Categories</span>
          </button>
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <h1 
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            {(() => {
              // Handle different category name formats - preserve original case and commas
              if (category.name.includes(',')) {
                // For "Wellness, Fitness & Sports" or "Art, Music & Dance"
                const parts = category.name.split(', ');
                return (
                  <>
                    {parts[0]},{' '}
                    <span 
                      className="bg-gradient-to-r from-[#7878E9] to-[#B794F6] bg-clip-text text-transparent"
                    >
                      {parts[1]}
                    </span>
                  </>
                );
              } else if (category.name.includes('&')) {
                // For "Food & Beverage" -> "FOOD & BEVERAGE" (keep the &)
                const parts = category.name.split(' & ');
                return (
                  <>
                    {parts[0].toUpperCase()} <span className="text-purple-400">&</span>{' '}
                    <span 
                      className="bg-gradient-to-r from-[#7878E9] to-[#B794F6] bg-clip-text text-transparent"
                    >
                      {parts[1].toUpperCase()}
                    </span>
                  </>
                );
              } else if (category.name.includes(' ')) {
                // For "Social Mixers" -> "SOCIAL" + gradient "MIXERS"
                const parts = category.name.split(' ');
                return (
                  <>
                    {parts[0].toUpperCase()}{' '}
                    <span 
                      className="bg-gradient-to-r from-[#7878E9] to-[#B794F6] bg-clip-text text-transparent"
                    >
                      {parts.slice(1).join(' ').toUpperCase()}
                    </span>
                  </>
                );
              } else {
                // For single word categories like "Games" or "Immersive"
                return category.name;
              }
            })()}
          </h1>
        </div>
      </section>

      {/* Category Info Bar */}
      <section className="bg-gray-900 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg sm:bg-transparent sm:p-0">
              <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-bold mb-1">Category</p>
                <p className="font-bold text-sm sm:text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{category.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg sm:bg-transparent sm:p-0">
              <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-bold mb-1">Who it's for</p>
                <p className="font-bold text-sm sm:text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>Everyone</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg sm:bg-transparent sm:p-0">
              <Sparkles className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-bold mb-1">What you'll find here</p>
                <p className="font-bold text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{category.description}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg sm:bg-transparent sm:p-0">
              <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-bold mb-1">Age Restriction</p>
                <p className="font-bold text-sm sm:text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>18 yrs & above</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Must Attend Events - Horizontal Carousel */}
      <section className="py-8 sm:py-12 lg:py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Events Under this category
              </h2>
              <p 
                className="text-gray-400 font-bold text-sm sm:text-base"
                style={{ fontFamily: 'Source Serif Pro, serif' }}
              >
                Don't miss these popular experiences
              </p>
            </div>
            
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-none w-[280px] h-[450px] bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {events.map((event) => (
                <div 
                  key={event._id}
                  className="flex-none w-[280px] h-[450px] snap-start"
                  style={{ minHeight: '450px', maxHeight: '450px' }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Highlights
            </h2>
            
            <div className="hidden sm:flex gap-2">
              <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative h-[250px] sm:h-[300px] md:h-[400px] rounded-xl overflow-hidden">
              <img 
                src="/images/Media (10).jpg" 
                alt="Highlight 1" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative h-[120px] sm:h-[145px] md:h-[196px] rounded-xl overflow-hidden">
                <img 
                  src="/images/Media (11).jpg" 
                  alt="Highlight 2" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative h-[120px] sm:h-[145px] md:h-[196px] rounded-xl overflow-hidden">
                <img 
                  src="/images/Media (12).jpg" 
                  alt="Highlight 3" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative h-[120px] sm:h-[145px] md:h-[196px] rounded-xl overflow-hidden col-span-2">
                <img 
                  src="/images/Media (13).jpg" 
                  alt="Highlight 4" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
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

