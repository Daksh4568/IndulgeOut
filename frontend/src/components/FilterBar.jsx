import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, SlidersHorizontal } from 'lucide-react';

const FilterBar = ({ onFilterChange, activeFilters = {}, mode = 'events' }) => {
  const isEvents = mode === 'events';

  const [filters, setFilters] = useState({
    price: activeFilters.price || 'all',
    city: activeFilters.city || 'all',
    showToday: activeFilters.showToday || false,
    showWeekend: activeFilters.showWeekend || false,
    mood: activeFilters.mood || 'all',
    useGeolocation: activeFilters.useGeolocation || false,
    userLocation: activeFilters.userLocation || null,
    sortBy: activeFilters.sortBy || 'popularity',
    genres: activeFilters.genres || [],
    categories: activeFilters.categories || [],
    cities: activeFilters.cities || []
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState(isEvents ? 'sortBy' : 'category');
  const [tempFilters, setTempFilters] = useState(
    isEvents
      ? { sortBy: filters.sortBy, genres: [...filters.genres] }
      : { categories: [...filters.categories], cities: [...filters.cities] }
  );

  const sortByOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'price-low-high', label: 'Price : Low to High' },
    { value: 'price-high-low', label: 'Price : High to Low' },
    { value: 'date', label: 'Date' },
    { value: 'distance', label: 'Distance : Near to Far' }
  ];

  const genreOptions = ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'];

  const cityOptions = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Goa'
  ];

  // Open filter modal
  const openFilterModal = () => {
    if (isEvents) {
      setTempFilters({ sortBy: filters.sortBy, genres: [...filters.genres] });
      setActiveTab('sortBy');
    } else {
      setTempFilters({ categories: [...filters.categories], cities: [...filters.cities] });
      setActiveTab('category');
    }
    setShowFilterModal(true);
  };

  // Apply filters from modal
  const applyModalFilters = () => {
    if (isEvents) {
      const newFilters = {
        ...filters,
        sortBy: tempFilters.sortBy,
        genres: tempFilters.genres
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    } else {
      const newFilters = {
        ...filters,
        categories: tempFilters.categories,
        cities: tempFilters.cities
      };
      setFilters(newFilters);
      onFilterChange({ categories: tempFilters.categories, cities: tempFilters.cities });
    }
    setShowFilterModal(false);
  };

  // Clear modal filters
  const clearModalFilters = () => {
    if (isEvents) {
      setTempFilters({ sortBy: 'popularity', genres: [] });
    } else {
      setTempFilters({ categories: [], cities: [] });
    }
  };

  // Toggle selection in an array
  const toggleItem = (key, item) => {
    setTempFilters(prev => {
      const arr = prev[key] || [];
      const updated = arr.includes(item)
        ? arr.filter(i => i !== item)
        : [...arr, item];
      return { ...prev, [key]: updated };
    });
  };

  // Check if filters are active
  const hasActiveFilters = isEvents
    ? (filters.sortBy !== 'popularity' || filters.genres.length > 0)
    : (filters.categories.length > 0 || filters.cities.length > 0);

  const activeCount = isEvents
    ? (filters.sortBy !== 'popularity' ? 1 : 0) + filters.genres.length
    : filters.categories.length + filters.cities.length;

  // Render tabs based on mode
  const renderTabs = () => {
    if (isEvents) {
      return (
        <>
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
        </>
      );
    }
    return (
      <>
        <button
          onClick={() => setActiveTab('category')}
          className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all mb-2 ${
            activeTab === 'category'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Category
        </button>
        <button
          onClick={() => setActiveTab('city')}
          className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'city'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          City
        </button>
      </>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'sortBy') {
      return (
        <div className="space-y-3">
          {sortByOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
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
              <span className="text-white group-hover:text-purple-400 transition-colors">{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (activeTab === 'genre') {
      return (
        <div className="space-y-3">
          {genreOptions.map((genre) => (
            <label key={genre} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={(tempFilters.genres || []).includes(genre)}
                onChange={() => toggleItem('genres', genre)}
                className="w-5 h-5 text-purple-600 bg-zinc-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2 accent-purple-600"
              />
              <span className="text-white group-hover:text-purple-400 transition-colors">{genre}</span>
            </label>
          ))}
        </div>
      );
    }

    if (activeTab === 'category') {
      return (
        <div className="space-y-3">
          {genreOptions.map((category) => (
            <label key={category} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={(tempFilters.categories || []).includes(category)}
                onChange={() => toggleItem('categories', category)}
                className="w-5 h-5 text-purple-600 bg-zinc-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2 accent-purple-600"
              />
              <span className="text-white group-hover:text-purple-400 transition-colors">{category}</span>
            </label>
          ))}
        </div>
      );
    }

    if (activeTab === 'city') {
      return (
        <div className="space-y-3">
          {cityOptions.map((city) => (
            <label key={city} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={(tempFilters.cities || []).includes(city)}
                onChange={() => toggleItem('cities', city)}
                className="w-5 h-5 text-purple-600 bg-zinc-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2 accent-purple-600"
              />
              <span className="text-white group-hover:text-purple-400 transition-colors">{city}</span>
            </label>
          ))}
        </div>
      );
    }

    return null;
  };

  // Modal rendered via portal to fix iOS Safari position:fixed issues inside overflow containers
  const filterModal = showFilterModal && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
      onClick={() => setShowFilterModal(false)}
    >
      <div
        className="bg-black rounded-2xl w-full max-w-lg mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
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
            {renderTabs()}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            {renderContent()}
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
    </div>,
    document.body
  );

  return (
    <>
      {filterModal}

      {/* Filters Button */}
      <button
        onClick={openFilterModal}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
          hasActiveFilters
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600'
            : 'border-gray-700 hover:border-purple-600 text-white'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
        {activeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
            {activeCount}
          </span>
        )}
      </button>
    </>
  );
};

export default FilterBar;
