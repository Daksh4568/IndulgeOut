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
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
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
          reject(new Error(`Location error: ${error.message}`));
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
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
   * Search for locations based on query
   */
  async searchLocations(query) {
    const cacheKey = `search:${query}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
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
      
      const results = data.map(item => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        type: item.type,
        importance: item.importance,
        address: item.address,
        class: item.class,
        formatted: item.display_name
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