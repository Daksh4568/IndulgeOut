import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { API_URL } from '../config/api';

const SearchBar = ({ onSearch, placeholder = "Search events, communities, people...", searchType = 'events' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    
    console.log('🔍 Searching for:', q, 'Type:', searchType);
    setIsSearching(true);
    try {
      // Choose endpoint based on search type
      const endpoint = searchType === 'communities' 
        ? `${API_URL}/api/explore/communities/search?q=${encodeURIComponent(q)}&limit=5`
        : `${API_URL}/api/explore/events/search?q=${encodeURIComponent(q)}&limit=5`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      // Extract suggestions based on type
      let suggestionsList = [];
      if (searchType === 'communities' && data.communities) {
        suggestionsList = data.communities.map(c => c.name).slice(0, 5);
      } else if (data.suggestions) {
        suggestionsList = data.suggestions;
      }
      
      console.log('✅ Search results:', suggestionsList.length, 'suggestions');
      setSuggestions(suggestionsList);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchType]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounce
    timeoutRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 300);
  };

  // Handle search submission
  const handleSearch = (searchQuery) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      // Save to recent searches
      const recent = [finalQuery, ...recentSearches.filter(s => s !== finalQuery)].slice(0, 5);
      setRecentSearches(recent);
      localStorage.setItem('recentSearches', JSON.stringify(recent));
      
      // Execute search
      onSearch(finalQuery);
      setShowSuggestions(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    console.log('🧹 Clearing search');
    setQuery('');
    setSuggestions([]);
    onSearch(''); // Notify parent that search is cleared
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all text-lg"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length >= 2 || recentSearches.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {!isSearching && suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Suggestions
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  <Search className="inline h-4 w-4 mr-2 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length < 2 && recentSearches.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Recent Searches
              </p>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  <Clock className="inline h-4 w-4 mr-2 text-gray-400" />
                  {search}
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
