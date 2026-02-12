// Location service for handling geolocation and location APIs
class LocationService {
  constructor() {
    this.cache = new Map();
    this.userLocation = null;
  }

  /**
   * Get user's current location using browser geolocation API
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased to 15 seconds
        maximumAge: 0 // Don't use cached position
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          resolve(this.userLocation);
        },
        (error) => {
          let errorMessage = 'Unable to get your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  /**
   * Watch user's location for real-time updates
   */
  watchLocation(callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 60000 // 1 minute cache
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        callback(this.userLocation);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      options
    );
  }

  /**
   * Stop watching location
   */
  stopWatching(watchId) {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Reverse geocoding - convert coordinates to address
   */
  async reverseGeocode(latitude, longitude) {
    // Validate coordinates first
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates provided for reverse geocoding');
    }

    const cacheKey = `${latitude},${longitude}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Using Nominatim (OpenStreetMap) for free reverse geocoding
      // Adding countrycodes=in to prioritize Indian results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'IndulgeOut-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      const location = {
        formatted: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        country: data.address?.country || '',
        postcode: data.address?.postcode || '',
        latitude,
        longitude
      };

      // Cache the result
      this.cache.set(cacheKey, location);

      return location;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        formatted: `${latitude}, ${longitude}`,
        city: '',
        state: '',
        country: '',
        latitude,
        longitude
      };
    }
  }

  /**
   * Forward geocoding - convert address to coordinates
   */
  async geocodeAddress(address) {
    const cacheKey = `addr:${address}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Add India to the query if not already present to prioritize Indian results
      const searchQuery = address.toLowerCase().includes('india') ? address : `${address}, India`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'IndulgeOut-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data.length === 0) {
        return null;
      }

      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        formatted: data[0].display_name,
        city: data[0].address?.city || data[0].address?.town || data[0].address?.village || '',
        state: data[0].address?.state || '',
        country: data[0].address?.country || ''
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Search for locations based on query - prioritizing Bangalore locations
   * Supports both city searches and venue/POI searches (e.g., "Third Wave Coffee")
   */
  async searchLocations(query) {
    const cacheKey = `search:${query}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Smart query enhancement - default to Bangalore if no city context
      const hasCityContext = this.hasCityInQuery(query);
      const hasIndiaContext = query.toLowerCase().includes('india');

      let searchQuery;
      if (hasIndiaContext || hasCityContext) {
        searchQuery = query;
      } else {
        // Default to Bangalore for our primary audience
        searchQuery = `${query} Bangalore`;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=20&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'IndulgeOut-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search service unavailable');
      }

      const data = await response.json();

      // Filter to only include Indian locations
      const indianResults = data.filter(item => {
        const country = item.address?.country?.toLowerCase();
        return country === 'india' || country === 'भारत';
      });

      // Sort results to prioritize Bangalore locations
      const sortedResults = indianResults.sort((a, b) => {
        const aIsBangalore = this.isBangaloreLocation(a.address);
        const bIsBangalore = this.isBangaloreLocation(b.address);

        // Bangalore locations come first
        if (aIsBangalore && !bIsBangalore) return -1;
        if (!aIsBangalore && bIsBangalore) return 1;

        // Then sort by importance
        return (b.importance || 0) - (a.importance || 0);
      });

      const results = sortedResults.slice(0, 8).map(item => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        type: item.type,
        importance: item.importance,
        address: item.address,
        class: item.class,
        formatted: item.display_name,
        // Add venue/POI type for better display
        venueType: this.getVenueType(item.type, item.class),
        isBangalore: this.isBangaloreLocation(item.address)
      }));

      // Cache the results
      this.cache.set(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  }

  /**
   * Check if location is in Bangalore/Bengaluru
   */
  isBangaloreLocation(address) {
    if (!address) return false;

    const city = (address.city || address.town || address.village || '').toLowerCase();
    const state = (address.state || '').toLowerCase();

    return (
      city === 'bangalore' ||
      city === 'bengaluru' ||
      city === 'bengaluru urban' ||
      city.includes('bangalore') ||
      city.includes('bengaluru') ||
      state === 'karnataka'
    );
  }

  /**
   * Check if query contains Indian city names
   */
  hasCityInQuery(query) {
    const queryLower = query.toLowerCase();
    const majorCities = [
      'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
      'pune', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore',
      'thane', 'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad',
      'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai',
      'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai',
      'allahabad', 'howrah', 'ranchi', 'gwalior', 'jabalpur', 'coimbatore', 'vijayawada',
      'jodhpur', 'madurai', 'raipur', 'kota', 'chandigarh', 'guwahati', 'gurgaon', 'gurugram',
      'noida', 'greater noida', 'kochi', 'cochin', 'mysore', 'mysuru', 'mangalore', 'trivandrum'
    ];
    return majorCities.some(city => queryLower.includes(city));
  }

  /**
   * Get human-readable venue type
   */
  getVenueType(type, osmClass) {
    // Map OSM types to readable venue types
    const typeMap = {
      'cafe': '☕ Cafe',
      'restaurant': '🍽️ Restaurant',
      'bar': '🍺 Bar',
      'pub': '🍻 Pub',
      'fast_food': '🍔 Fast Food',
      'food_court': '🍽️ Food Court',
      'biergarten': '🍺 Beer Garden',
      'brewery': '🍺 Brewery',
      'nightclub': '🎵 Nightclub',
      'arts_centre': '🎨 Arts Centre',
      'theatre': '🎭 Theatre',
      'cinema': '🎬 Cinema',
      'community_centre': '🏛️ Community Centre',
      'conference_centre': '🏢 Conference Centre',
      'events_venue': '🎪 Events Venue',
      'hotel': '🏨 Hotel',
      'resort': '🏖️ Resort'
    };

    if (osmClass === 'amenity' && typeMap[type]) {
      return typeMap[type];
    }
    return null;
  }

  /**
   * Search specifically for venues/POIs (cafes, restaurants, etc.)
   * Defaults to Bangalore for our primary audience
   */
  async searchVenues(venueName, city = '') {
    try {
      // Build search query with venue name and city (default to Bangalore)
      const defaultCity = city || 'Bangalore';
      const searchQuery = `${venueName} ${defaultCity} India`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(searchQuery)}` +
        `&limit=20` +
        `&addressdetails=1` +
        `&countrycodes=in` +
        `&extratags=1`, // Get additional tags for more venue info
        {
          headers: {
            'User-Agent': 'IndulgeOut-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Venue search unavailable');
      }

      const data = await response.json();

      // Filter for amenities (cafes, restaurants, etc.)
      const venues = data
        .filter(item => {
          const country = item.address?.country?.toLowerCase();
          const isIndia = country === 'india' || country === 'भारत';
          // Prioritize amenities (actual venues) over just addresses
          const isVenue = item.class === 'amenity' ||
            item.class === 'tourism' ||
            item.type === 'cafe' ||
            item.type === 'restaurant' ||
            item.type === 'bar' ||
            item.type === 'pub';
          return isIndia && isVenue;
        })
        .map(item => ({
          place_id: item.place_id,
          name: item.name || item.display_name.split(',')[0],
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          type: item.type,
          class: item.class,
          address: item.address,
          venueType: this.getVenueType(item.type, item.class),
          road: item.address?.road || '',
          suburb: item.address?.suburb || item.address?.neighbourhood || '',
          city: item.address?.city || item.address?.town || item.address?.village || '',
          state: item.address?.state || '',
          formatted: item.display_name,
          isBangalore: this.isBangaloreLocation(item.address)
        }));

      // Sort to show Bangalore venues first
      venues.sort((a, b) => {
        if (a.isBangalore && !b.isBangalore) return -1;
        if (!a.isBangalore && b.isBangalore) return 1;
        return 0;
      });

      return venues.slice(0, 10);
    } catch (error) {
      console.error('Venue search error:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get events within a certain radius of a location
   */
  async getEventsNearLocation(centerLat, centerLon, radiusKm, events) {
    return events.filter(event => {
      if (!event.location?.coordinates) return false;

      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        event.location.coordinates.latitude,
        event.location.coordinates.longitude
      );

      return distance <= radiusKm;
    }).sort((a, b) => {
      // Sort by distance, closest first
      const distA = this.calculateDistance(centerLat, centerLon, a.location.coordinates.latitude, a.location.coordinates.longitude);
      const distB = this.calculateDistance(centerLat, centerLon, b.location.coordinates.latitude, b.location.coordinates.longitude);
      return distA - distB;
    });
  }

  /**
   * Get popular locations based on event density
   */
  generateHeatmapData(events) {
    const locationCounts = new Map();

    events.forEach(event => {
      if (event.location?.coordinates) {
        const key = `${event.location.coordinates.latitude.toFixed(3)},${event.location.coordinates.longitude.toFixed(3)}`;
        const count = locationCounts.get(key) || 0;
        locationCounts.set(key, count + 1);
      }
    });

    return Array.from(locationCounts.entries()).map(([coords, count]) => {
      const [lat, lon] = coords.split(',').map(parseFloat);
      return {
        latitude: lat,
        longitude: lon,
        intensity: count,
        weight: Math.min(count / 10, 1) // Normalize weight for heatmap
      };
    });
  }

  /**
   * Get user's cached location
   */
  getCachedLocation() {
    return this.userLocation;
  }

  /**
   * Clear location cache
   */
  clearCache() {
    this.cache.clear();
    this.userLocation = null;
  }
}

// Export singleton instance
export default new LocationService();