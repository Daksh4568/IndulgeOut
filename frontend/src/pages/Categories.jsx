import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';
import NavigationBar from '../components/NavigationBar';
import { API_URL } from '../config/api';

/**
 * All Categories Page
 * Displays all 6 hardcoded categories in a grid layout
 */
const Categories = () => {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const endpoint = `${API_URL}/api/explore/events/popular?limit=10&page=1`;
      console.log('📡 Fetching upcoming events from:', endpoint);
      
      const response = await fetch(endpoint);
      const data = await response.json();
      console.log('✅ Events received:', data.events?.length || 0, 'events');
      
      // Filter to only show upcoming events (future dates)
      const now = new Date();
      const upcoming = (data.events || []).filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now;
      }).slice(0, 6);
      
      console.log('✅ Upcoming events (future only):', upcoming.length, 'events');
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('❌ Error fetching upcoming events:', error);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/categories/${category.slug}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 650;
      if (direction === 'left') {
        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-24">
        {/* Upcoming Events Section - Commented out until we have trending and famous events
        {!loading && upcomingEvents.length > 0 && (
          <section className="mb-16 py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <h2 
                className="text-3xl sm:text-4xl font-bold mb-2 text-white"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Upcoming Events
              </h2>
              <p 
                className="text-gray-400 text-base font-bold"
                style={{ fontFamily: 'Source Serif Pro, serif' }}
              >
                Don't miss these popular experiences
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hidden sm:block"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>

              <div 
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth px-4 sm:px-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {upcomingEvents.map((event, index) => (
                  <div 
                    key={event._id} 
                    className="flex-none w-full sm:w-[550px] lg:w-[600px] snap-center"
                    style={{
                      animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className="bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                      <div className="flex flex-row min-h-[280px] max-h-[320px]">
                        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-gray-700 mb-3">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-bold" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                {formatDate(event.date)} · {event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time || '6:30 PM'}
                              </span>
                            </div>
                            
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
                              {event.title}
                            </h3>
                            
                            <p className="text-sm text-gray-700 mb-3 font-semibold" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                              {event.category || 'Live Performances'} · {event.type || 'Music'} · {event.genre || 'Alternative'}
                            </p>
                            
                            <div className="flex items-start gap-2 text-gray-700 mb-3">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="text-sm font-bold line-clamp-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                {event.location?.address || event.location?.venue || event.location?.city}, {event.location?.state || event.location?.city}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                ₹{event.price?.amount || 499} onwards
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => navigate(`/event/${event._id}`)}
                            className="w-full text-white px-8 py-2.5 rounded-md text-base font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-xl"
                            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                          >
                            Get your Ticket
                          </button>
                        </div>

                        <div className="w-[45%] p-4 flex items-center justify-center">
                          <div className="relative w-full max-w-[250px]">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg transform rotate-2 shadow-2xl"></div>
                            
                            <div className="relative bg-white rounded-lg overflow-hidden shadow-xl aspect-[3/4]">
                              {event.images && event.images.length > 0 ? (
                                <img
                                  src={event.images[0]}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                  <Calendar className="h-20 w-20 text-white opacity-50" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hidden sm:block"
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </button>
            </div>
          </section>
        )}
        */}

        {/* Section Title */}
        <div className="mb-8">
          {/* Categories Pill */}
          <div className="inline-block mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-full px-6 py-2">
              <p className="text-gray-300 text-sm uppercase tracking-wider font-medium" style={{ fontFamily: 'Oswald, sans-serif' }}>
                CATEGORIES
              </p>
            </div>
          </div>
          
          <h1 
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Curated For You
          </h1>
          <p 
            className="text-gray-400 text-base sm:text-lg font-bold"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          >
            Experience offline events in different interest categories
          </p>
        </div>

        {/* All Categories Heading */}
        <h2 
          className="text-2xl sm:text-3xl font-bold mb-6"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          All Categories
        </h2>

        {/* Categories Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
          {CATEGORIES.map((category, index) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="group relative bg-gray-900 rounded-2xl shadow-xl transition-all duration-300 ease-in-out cursor-pointer hover:scale-110 hover:shadow-2xl hover:z-10"
              style={{
                animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                transformOrigin: 'center'
              }}
            >
              {/* Card Content */}
              <div className="p-6 flex flex-col h-full">
                {/* Top Section - Category Image */}
                <div className="aspect-video mb-4 rounded-lg overflow-hidden relative bg-gray-800">
                  <img 
                    src={`/images/${category.slug}.jpg`}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback icon if image fails to load */}
                  <div className="absolute inset-0 items-center justify-center bg-gray-800" style={{ display: 'none' }}>
                    <span className="text-6xl opacity-60">{category.icon}</span>
                  </div>
                </div>

                {/* Category Name */}
                <h3 
                  className="text-xl sm:text-2xl font-bold mb-2"
                  style={{ 
                    fontFamily: 'Oswald, sans-serif',
                    color: '#7878E9'
                  }}
                >
                  {category.name}
                </h3>

                {/* Description */}
                <p 
                  className="text-gray-400 text-xs sm:text-sm mb-4 flex-grow font-semibold"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  {category.description}
                </p>

                {/* View All Button - Smaller size */}
                <button
                  className="text-white px-4 py-1.5 rounded text-xs font-bold transform hover:scale-105 hover:opacity-90 transition-all duration-300 w-fit"
                  style={{ 
                    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    fontFamily: 'Oswald, sans-serif'
                  }}
                >
                  View All
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section - Didn't find your Interest Match? */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
          {/* You can add a background image here */}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Didn't find your <span className="text-purple-400">Interest Match?</span>
          </h2>
          
          <p 
            className="text-gray-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto font-bold"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          >
            Be the change. Create your own event and bring people together around your unique passion.
          </p>

          <button
            onClick={() => navigate('/host-partner')}
            className="text-white px-8 sm:px-12 py-3 sm:py-3.5 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
            style={{ 
              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
              fontFamily: 'Oswald, sans-serif'
            }}
          >
            Host Your Event
          </button>
        </div>
      </section>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Categories;
