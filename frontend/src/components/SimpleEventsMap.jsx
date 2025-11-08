import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SimpleEventsMap = ({ events = [], userLocation, onEventSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  // Helper function to validate coordinates
  const isValidCoordinate = (coord) => {
    return typeof coord === 'number' && 
           !isNaN(coord) && 
           isFinite(coord) &&
           coord >= -180 && coord <= 180;
  };

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      try {
        // Validate user location before using it
        const hasValidUserLocation = userLocation && 
          typeof userLocation.lat === 'number' && 
          typeof userLocation.lng === 'number' &&
          !isNaN(userLocation.lat) && 
          !isNaN(userLocation.lng);
        
        // Default center to India if no valid user location
        const defaultCenter = hasValidUserLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];
        
        mapInstanceRef.current = L.map(mapRef.current, {
          center: defaultCenter,
          zoom: hasValidUserLocation ? 13 : 6,
          zoomControl: true,
          scrollWheelZoom: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);

        setMapReady(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []); // Remove userLocation dependency to prevent reinitialization

  // Add user location marker
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && userLocation) {
      try {
        // Validate user location coordinates
        if (!isValidCoordinate(userLocation.lat) || !isValidCoordinate(userLocation.lng)) {
          console.warn('Invalid user location coordinates:', userLocation);
          return;
        }

        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('Your Location');
      } catch (error) {
        console.error('Error adding user location marker:', error);
      }
    }
  }, [mapReady, userLocation]);

  // Add event markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !events) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        mapInstanceRef.current.removeLayer(marker);
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    });
    markersRef.current = [];

    // Validate and filter events with coordinates
    const validEvents = events.filter(event => {
      if (!event) return false;
      
      const coords = event.coordinates || event.location?.coordinates;
      if (!coords) return false;
      
      const lat = coords.lat || coords.latitude;
      const lng = coords.lng || coords.longitude;
      
      return lat !== undefined && lng !== undefined && 
             lat !== null && lng !== null && 
             !isNaN(lat) && !isNaN(lng) &&
             lat >= -90 && lat <= 90 && 
             lng >= -180 && lng <= 180;
    });

    console.log(`Adding ${validEvents.length} valid events to map`);

    // Add markers for valid events
    validEvents.forEach((event, index) => {
      try {
        const coords = event.coordinates || event.location?.coordinates;
        const lat = coords.lat || coords.latitude;
        const lng = coords.lng || coords.longitude;

        // Get event category for color
        const category = event.categories?.[0] || 'other';
        const markerColor = getMarkerColor(category);
        
        // Check if event is completed
        const eventDate = new Date(event.date);
        const isCompleted = eventDate < new Date();

        // Create custom marker
        const markerIcon = L.divIcon({
          className: 'event-marker',
          html: `<div style="width: 30px; height: 30px; background: ${markerColor}; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); ${isCompleted ? 'opacity: 0.7;' : ''} cursor: pointer;"><span style="color: white; font-size: 12px; font-weight: bold;">${getEventIcon(category)}</span></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15]
        });

        const marker = L.marker([lat, lng], { icon: markerIcon });
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${event.title || 'Untitled Event'}</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${event.description ? event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : 'No description'}</p>
            <div style="font-size: 12px; color: #888;">
              <div>📅 ${formatDate(event.date)}</div>
              <div>📍 ${event.venue || event.location?.city || 'Location TBD'}</div>
              ${event.price?.amount ? `<div>💰 ₹${event.price.amount}</div>` : '<div>💰 Free</div>'}
            </div>
            <button onclick="window.selectEvent('${event._id}')" style="margin-top: 8px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">View Details</button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);

        // Handle event selection
        marker.on('click', () => {
          if (onEventSelect) {
            onEventSelect(event);
          }
        });
      } catch (error) {
        console.error('Error adding event marker:', error, event);
      }
    });

    // Fit map to show all markers if there are events
    if (validEvents.length > 0) {
      try {
        const group = new L.featureGroup(markersRef.current);
        
        // Include user location in bounds if coordinates are valid
        if (userLocation && 
            isValidCoordinate(userLocation.lat) && 
            isValidCoordinate(userLocation.lng)) {
          const userMarker = L.marker([userLocation.lat, userLocation.lng]);
          group.addLayer(userMarker);
        }
        
        if (group.getLayers().length > 0) {
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [mapReady, events, onEventSelect]);

  // Global function for popup buttons
  useEffect(() => {
    window.selectEvent = (eventId) => {
      const event = events.find(e => e._id === eventId);
      if (event && onEventSelect) {
        onEventSelect(event);
      }
    };

    return () => {
      delete window.selectEvent;
    };
  }, [events, onEventSelect]);

  // Helper functions
  const getMarkerColor = (category) => {
    const colors = {
      'Sip & Savor': '#ef4444',
      'Sweat & Play': '#22c55e', 
      'Art & DIY': '#8b5cf6',
      'Skill & Growth': '#f59e0b',
      'Adventure & Outdoors': '#06b6d4',
      'Music & Dance': '#ec4899',
      'Tech & Innovation': '#6366f1',
      'Social & Networking': '#84cc16',
      'default': '#6b7280'
    };
    return colors[category] || colors.default;
  };

  const getEventIcon = (category) => {
    const icons = {
      'Sip & Savor': '🍷',
      'Sweat & Play': '🏃',
      'Art & DIY': '🎨',
      'Skill & Growth': '📚',
      'Adventure & Outdoors': '🏔️',
      'Music & Dance': '🎵',
      'Tech & Innovation': '💻',
      'Social & Networking': '🤝',
      'default': '📍'
    };
    return icons[category] || icons.default;
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date TBD';
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700 dark:text-gray-300">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700 dark:text-gray-300">Upcoming Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white opacity-70"></div>
            <span className="text-gray-700 dark:text-gray-300">Past Events</span>
          </div>
        </div>
      </div>

      {/* Event Count Display */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg z-[1000]">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {events?.length || 0} Events
        </span>
      </div>
    </div>
  );
};

export default SimpleEventsMap;