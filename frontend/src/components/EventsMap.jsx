import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Clock, Users, Star, Navigation } from 'lucide-react';
import locationService from '../services/locationService';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';

const EventsMap = ({ events = [], onEventClick, className = '' }) => {
  const mapRef = useRef(null);
  const { user } = useAuth();
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [mapMode, setMapMode] = useState('events'); // 'events', 'heatmap', 'recommendations'

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return; // Prevent re-initialization

    // Dynamic import for Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Check if map container is already initialized
      if (mapRef.current._leaflet_id) {
        return;
      }

      // Create map instance
      const mapInstance = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // India center

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance);

      setMap(mapInstance);

      // Get user location
      getUserLocation(mapInstance);
    }).catch((error) => {
      console.error('Error loading Leaflet:', error);
    });

    // Cleanup function
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, []); // Empty dependency array to run only once

  // Get user's current location
  const getUserLocation = async (mapInstance) => {
    try {
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      
      if (mapInstance) {
        // Add user location marker
        import('leaflet').then((L) => {
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 20px; 
                height: 20px; 
                background: #3b82f6; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [20, 20]
          });

          L.marker([location.latitude, location.longitude], { icon: userIcon })
            .addTo(mapInstance)
            .bindPopup('<b>Your Location</b>')
            .openPopup();

          // Center map on user location
          mapInstance.setView([location.latitude, location.longitude], 12);
        });
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  // Add events to map
  useEffect(() => {
    if (!map || !events.length) return;

    import('leaflet').then((L) => {
      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !layer.options.isUserLocation) {
          map.removeLayer(layer);
        }
      });

      // Add event markers
      events.forEach((event) => {
        if (!event.location?.coordinates) return;

        const { latitude, longitude } = event.location.coordinates;
        const isCompleted = new Date(event.date) < new Date();
        
        // Create custom marker based on event status
        const markerColor = isCompleted ? '#6b7280' : getEventCategoryColor(event.categories?.[0]);
        const markerIcon = L.divIcon({
          className: 'event-marker',
          html: `
            <div style="
              width: 30px; 
              height: 30px; 
              background: ${markerColor}; 
              border: 3px solid white; 
              border-radius: 50%; 
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ${isCompleted ? 'opacity: 0.7;' : ''}
            ">
              <span style="color: white; font-size: 12px; font-weight: bold;">
                ${isCompleted ? '✓' : '🎉'}
              </span>
            </div>
          `,
          iconSize: [30, 30]
        });

        const marker = L.marker([latitude, longitude], { icon: markerIcon })
          .addTo(map);

        // Create popup content
        const popupContent = createEventPopup(event, isCompleted);
        marker.bindPopup(popupContent, { maxWidth: 300 });

        // Add click handler
        marker.on('click', () => {
          setSelectedEvent(event);
          if (onEventClick) {
            onEventClick(event);
          }
        });
      });

      // Add heatmap if enabled
      if (showHeatmap) {
        addHeatmapLayer(L);
      }
    });
  }, [map, events, showHeatmap]);

  // Create event popup content
  const createEventPopup = (event, isCompleted) => {
    const distance = userLocation ? 
      locationService.calculateDistance(
        userLocation.latitude, 
        userLocation.longitude,
        event.location.coordinates.latitude,
        event.location.coordinates.longitude
      ).toFixed(1) : null;

    return `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
          ${event.title}
        </h3>
        ${isCompleted ? 
          '<div style="color: #ef4444; font-size: 12px; margin-bottom: 8px;">🕐 Event Completed</div>' :
          '<div style="color: #10b981; font-size: 12px; margin-bottom: 8px;">📅 Upcoming Event</div>'
        }
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #6b7280;">
          <div style="display: flex; align-items: center; gap: 4px;">
            📅 ${new Date(event.date).toLocaleDateString()}
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            🕒 ${event.time || 'TBA'}
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            📍 ${event.location?.city || 'Location TBA'}
          </div>
          ${distance ? `<div style="display: flex; align-items: center; gap: 4px;">📏 ${distance} km away</div>` : ''}
          <div style="display: flex; align-items: center; gap: 4px;">
            👥 ${event.currentParticipants || 0}/${event.maxParticipants || 0} participants
          </div>
        </div>
        <button 
          onclick="window.location.href='/event/${event._id}'" 
          style="
            margin-top: 8px; 
            padding: 6px 12px; 
            background: #3b82f6; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            font-size: 12px; 
            cursor: pointer;
          "
        >
          ${isCompleted ? 'View Details' : 'View & Register'}
        </button>
      </div>
    `;
  };

  // Add heatmap layer
  const addHeatmapLayer = (L) => {
    const heatmapData = locationService.generateHeatmapData(events);
    
    if (heatmapData.length === 0) return;

    // Create heatmap points
    const heatPoints = heatmapData.map(point => [
      point.latitude,
      point.longitude,
      point.intensity
    ]);

    // Add heatmap using circle markers for visualization
    heatPoints.forEach(([lat, lon, intensity]) => {
      const radius = Math.max(intensity * 50, 20);
      const opacity = Math.min(intensity * 0.1, 0.6);
      
      L.circle([lat, lon], {
        radius: radius,
        fillColor: '#ff6b6b',
        color: '#ff6b6b',
        weight: 1,
        opacity: 0.8,
        fillOpacity: opacity
      }).addTo(map);
    });
  };

  // Get color for event category
  const getEventCategoryColor = (category) => {
    const colors = {
      'Art & DIY': '#f59e0b',
      'Sip & Savor': '#ef4444',
      'Social Mixers': '#3b82f6',
      'Outdoors & Adventure': '#10b981',
      'Learning & Development': '#8b5cf6',
      'Wellness & Fitness': '#06b6d4',
      'Music & Entertainment': '#f97316',
      'Sports & Games': '#84cc16'
    };
    return colors[category] || '#6b7280';
  };

  // Get nearby recommended events
  const getNearbyRecommendations = async () => {
    if (!userLocation || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/events?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Filter recommendations by proximity
        const nearbyRecommendations = await locationService.getEventsNearLocation(
          userLocation.latitude,
          userLocation.longitude,
          25, // 25km radius
          data.data?.map(item => item.event) || []
        );

        setRecommendations(nearbyRecommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [map]);

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-200 shadow-md"
        style={{ minHeight: '400px' }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showHeatmap 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
        
        <button
          onClick={getNearbyRecommendations}
          className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Get Recommendations
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
        <h4 className="font-medium text-sm mb-2">Map Legend</h4>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Upcoming Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full opacity-70"></div>
            <span>Past Events</span>
          </div>
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full opacity-60"></div>
              <span>Event Hotspots</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Event Card */}
      {selectedEvent && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(selectedEvent.date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {selectedEvent.time || 'TBA'}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {selectedEvent.location?.city || 'Location TBA'}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {selectedEvent.currentParticipants || 0}/{selectedEvent.maxParticipants || 0} participants
            </div>
          </div>
          <button
            onClick={() => window.location.href = `/event/${selectedEvent._id}`}
            className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            View Event
          </button>
        </div>
      )}

      {/* Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-md">
          <h3 className="font-semibold text-lg mb-3">Recommended Near You</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recommendations.slice(0, 3).map((event) => (
              <div 
                key={event._id} 
                className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => window.location.href = `/event/${event._id}`}
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs text-gray-500">
                  {userLocation && event.location?.coordinates && 
                    `${locationService.calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      event.location.coordinates.latitude,
                      event.location.coordinates.longitude
                    ).toFixed(1)} km away`
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsMap;