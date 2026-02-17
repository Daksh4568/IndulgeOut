import { useState, useEffect } from 'react';
import { DollarSign, MapPin, Calendar, Sparkles, Navigation, X, SlidersHorizontal } from 'lucide-react';

const FilterBar = ({ onFilterChange, activeFilters = {} }) => {
  const [filters, setFilters] = useState({
    price: activeFilters.price || 'all',
    city: activeFilters.city || 'all',
    showToday: activeFilters.showToday || false,
    showWeekend: activeFilters.showWeekend || false,
    mood: activeFilters.mood || 'all',
    useGeolocation: activeFilters.useGeolocation || false,
    userLocation: activeFilters.userLocation || null,
    sortBy: activeFilters.sortBy || 'popularity',
    genres: activeFilters.genres || []
  });

  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState('sortBy');
  const [tempFilters, setTempFilters] = useState({
    sortBy: filters.sortBy,
    genres: [...filters.genres]
  });

  const priceOptions = [
    { value: 'all', label: 'All Prices' },
    { value: 'free', label: 'Free' },
    { value: 'under500', label: 'Under ₹500' },
    { value: '500-2000', label: '₹500 - ₹2000' },
    { value: 'over2000', label: '₹2000+' }
  ];

  const cityOptions = [
    { value: 'all', label: 'All Cities' },
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Bengaluru', label: 'Bengaluru' },
    { value: 'Hyderabad', label: 'Hyderabad' },
    { value: 'Chennai', label: 'Chennai' },
    { value: 'Kolkata', label: 'Kolkata' },
    { value: 'Pune', label: 'Pune' },
    { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Jaipur', label: 'Jaipur' },
    { value: 'Goa', label: 'Goa' }
  ];

  const moodOptions = [
    { value: 'all', label: 'All Moods', icon: '🎭' },
    { value: 'chill', label: 'Chill', icon: '😌' },
    { value: 'energetic', label: 'Energetic', icon: '⚡' },
    { value: 'creative', label: 'Creative', icon: '🎨' },
    { value: 'social', label: 'Social', icon: '🎉' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️' }
  ];

  const sortByOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'price-low-high', label: 'Price : Low to High' },
    { value: 'price-high-low', label: 'Price : High to Low' },
    { value: 'date', label: 'Date' },
    { value: 'distance', label: 'Distance : Near to Far' }
  ];

  const genreOptions = ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'];

  // Get user's location
  const handleNearMe = () => {
    if (filters.useGeolocation && filters.userLocation) {
      // Turn off geolocation
      const newFilters = {
        ...filters,
        useGeolocation: false,
        userLocation: null
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
      return;
    }

    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newFilters = {
            ...filters,
            useGeolocation: true,
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          };
          setFilters(newFilters);
          onFilterChange(newFilters);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please enable location services.');
          setIsGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
    }
  };

  // Update filter
  const updateFilter = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const newFilters = {
      price: 'all',
      city: 'all',
      showToday: false,
      showWeekend: false,
      mood: 'all',
      useGeolocation: false,
      userLocation: null,
      sortBy: 'popularity',
      genres: []
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Open filter modal
  const openFilterModal = () => {
    setTempFilters({
      sortBy: filters.sortBy,
      genres: [...filters.genres]
    });
    setShowFilterModal(true);
  };

  // Apply filters from modal
  const applyModalFilters = () => {
    const newFilters = {
      ...filters,
      sortBy: tempFilters.sortBy,
      genres: tempFilters.genres
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setShowFilterModal(false);
  };

  // Clear modal filters
  const clearModalFilters = () => {
    setTempFilters({
      sortBy: 'popularity',
      genres: []
    });
  };

  // Toggle genre selection
  const toggleGenre = (genre) => {
    setTempFilters(prev => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres };
    });
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'userLocation') return false;
    if (typeof value === 'boolean') return value === true;
    return value !== 'all' && value !== null && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <>
      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-black rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Filter by</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content - Split Layout */}
            <div className="flex" style={{ height: '400px' }}>
              {/* Left Sidebar */}
              <div className="w-32 bg-black border-r border-zinc-800 p-4">
                <button
                  onClick={() => setActiveTab('sortBy')}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all mb-2 ${
                    activeTab === 'sortBy'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sort By
                </button>
                <button
                  onClick={() => setActiveTab('genre')}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'genre'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Genre
                </button>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 px-6 py-4 overflow-y-auto">
                {activeTab === 'sortBy' && (
                  <div className="space-y-3">
                    {sortByOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="relative flex items-center">
                          <input
                            type="radio"
                            name="sortBy"
                            value={option.value}
                            checked={tempFilters.sortBy === option.value}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                            className="w-5 h-5 text-purple-600 bg-zinc-800 border-gray-600 focus:ring-purple-500 focus:ring-2"
                          />
                        </div>
                        <span className="text-white group-hover:text-purple-400 transition-colors">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {activeTab === 'genre' && (
                  <div className="space-y-3">
                    {genreOptions.map((genre) => (
                      <label
                        key={genre}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={tempFilters.genres.includes(genre)}
                          onChange={() => toggleGenre(genre)}
                          className="w-5 h-5 text-purple-600 bg-zinc-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2 accent-purple-600"
                        />
                        <span className="text-white group-hover:text-purple-400 transition-colors">
                          {genre}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 pt-4 border-t border-zinc-800">
              <button
                onClick={clearModalFilters}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Clear filters
              </button>
              <button
                onClick={applyModalFilters}
                className="px-6 py-2.5 rounded-lg font-bold text-sm text-white transition-all"
                style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Button - Inline without wrapper */}
      <button
        onClick={openFilterModal}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
          filters.sortBy !== 'popularity' || filters.genres.length > 0
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600'
            : 'border-gray-700 hover:border-purple-600 text-white'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
        {(filters.sortBy !== 'popularity' || filters.genres.length > 0) && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
            {(filters.sortBy !== 'popularity' ? 1 : 0) + filters.genres.length}
          </span>
        )}
      </button>
    </>
  );
};

export default FilterBar;
