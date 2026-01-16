import { useState, useEffect } from 'react';
import { DollarSign, MapPin, Calendar, Sparkles, Navigation, X } from 'lucide-react';

const FilterBar = ({ onFilterChange, activeFilters = {} }) => {
  const [filters, setFilters] = useState({
    price: activeFilters.price || 'all',
    city: activeFilters.city || 'all',
    showToday: activeFilters.showToday || false,
    showWeekend: activeFilters.showWeekend || false,
    mood: activeFilters.mood || 'all',
    useGeolocation: activeFilters.useGeolocation || false,
    userLocation: activeFilters.userLocation || null
  });

  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  // Get user's location
  const handleNearMe = () => {
    if (filters.useGeolocation && filters.userLocation) {
      // Turn off geolocation
      setFilters(prev => ({
        ...prev,
        useGeolocation: false,
        userLocation: null
      }));
      return;
    }

    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters(prev => ({
            ...prev,
            useGeolocation: true,
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
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
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      price: 'all',
      city: 'all',
      showToday: false,
      showWeekend: false,
      mood: 'all',
      useGeolocation: false,
      userLocation: null
    });
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'userLocation') return false;
    if (typeof value === 'boolean') return value === true;
    return value !== 'all' && value !== null;
  }).length;

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Price Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPriceDropdown(!showPriceDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                filters.price !== 'all'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 text-gray-900 dark:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">
                {priceOptions.find(o => o.value === filters.price)?.label}
              </span>
            </button>
            {showPriceDropdown && (
              <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                {priceOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFilter('price', option.value);
                      setShowPriceDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-sm text-gray-900 dark:text-white"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Filter */}
          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                filters.city !== 'all'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 text-gray-900 dark:text-white'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                {cityOptions.find(o => o.value === filters.city)?.label}
              </span>
            </button>
            {showCityDropdown && (
              <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                {cityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFilter('city', option.value);
                      setShowCityDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-sm text-gray-900 dark:text-white"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Today Toggle */}
          <button
            onClick={() => updateFilter('showToday', !filters.showToday)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              filters.showToday
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 text-gray-900 dark:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Today</span>
          </button>

          {/* Weekend Toggle */}
          <button
            onClick={() => updateFilter('showWeekend', !filters.showWeekend)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              filters.showWeekend
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 text-gray-900 dark:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">This Weekend</span>
          </button>

          {/* Mood Filter */}
          <div className="relative">
            <button
              onClick={() => setShowMoodDropdown(!showMoodDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                filters.mood !== 'all'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 text-gray-900 dark:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                {moodOptions.find(o => o.value === filters.mood)?.label}
              </span>
            </button>
            {showMoodDropdown && (
              <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                {moodOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFilter('mood', option.value);
                      setShowMoodDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-sm flex items-center gap-2 text-gray-900 dark:text-white"
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Near Me Button */}
          <button
            onClick={handleNearMe}
            disabled={isGettingLocation}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              filters.useGeolocation
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 text-gray-900 dark:text-white'
            } ${isGettingLocation ? 'opacity-50 cursor-wait' : ''}`}
          >
            <Navigation className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isGettingLocation ? 'Getting location...' : 'Near Me'}
            </span>
          </button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500 transition-all text-sm font-medium text-gray-900 dark:text-white"
            >
              <X className="h-4 w-4" />
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
