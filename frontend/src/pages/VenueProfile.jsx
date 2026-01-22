import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin, Users, Calendar, Clock, Wifi, Car, Wind, Music,
  Projector, Utensils, Wine, Home, Activity, CheckCircle,
  ArrowLeft, MessageCircle, Star, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import API_URL from '../config/api';

const VenueProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchVenueDetail();
  }, [id]);

  const fetchVenueDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/venues/${id}`);
      setVenue(response.data);
    } catch (error) {
      console.error('Error fetching venue detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCollaboration = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/venue/${id}/request-collaboration`);
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      wifi: Wifi,
      parking: Car,
      ac: Wind,
      'sound system': Music,
      projector: Projector,
      kitchen: Utensils,
      bar: Wine,
      'outdoor seating': Home,
      stage: Activity,
      'dance floor': Activity
    };
    const Icon = icons[amenity.toLowerCase()] || CheckCircle;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Venue not found
          </h2>
          <button
            onClick={() => navigate('/browse/venues')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Back to Browse Venues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/browse/venues')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Browse Venues</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {venue.photos && venue.photos.length > 0 ? (
                <>
                  <div className="relative h-96 bg-gray-200 dark:bg-gray-700">
                    <img
                      src={venue.photos[selectedImage]}
                      alt={venue.venueName}
                      className="w-full h-full object-cover"
                    />
                    {venue.availability === 'open_for_collaborations' && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-medium">
                        Available for Collaborations
                      </div>
                    )}
                  </div>
                  {venue.photos.length > 1 && (
                    <div className="p-4 flex space-x-2 overflow-x-auto">
                      {venue.photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index
                              ? 'border-primary-600'
                              : 'border-transparent'
                          }`}
                        >
                          <img
                            src={photo}
                            alt={`${venue.venueName} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-96 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                  <ImageIcon className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Overview Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {venue.description || 'No description available.'}
              </p>
            </div>

            {/* Space Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Space Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Capacity */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Capacity Range
                  </h3>
                  <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">{venue.capacityRange || 'Not specified'}</span>
                  </div>
                </div>

                {/* Layout */}
                {venue.layout && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Layout
                    </h3>
                    <p className="text-gray-900 dark:text-white">{venue.layout}</p>
                  </div>
                )}

                {/* Operating Hours */}
                {venue.operatingHours && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Operating Hours
                    </h3>
                    <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                      <Clock className="h-5 w-5" />
                      <span>{venue.operatingHours}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {venue.amenities && venue.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {venue.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                      >
                        {getAmenityIcon(amenity)}
                        <span className="capitalize">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules & Restrictions */}
              {venue.rulesAndRestrictions && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Rules & Restrictions
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{venue.rulesAndRestrictions}</p>
                </div>
              )}
            </div>

            {/* Event Suitability */}
            {venue.eventSuitabilityTags && venue.eventSuitabilityTags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Suitable For
                </h2>
                <div className="flex flex-wrap gap-2">
                  {venue.eventSuitabilityTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {venue.pastEvents && venue.pastEvents.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Past Events & Community Partners
                </h2>
                <div className="space-y-4">
                  {venue.pastEvents.map((event, index) => (
                    <div key={index} className="border-l-4 border-primary-600 pl-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {event.eventName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.community} • {event.eventType}
                      </p>
                      {event.feedback && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          "{event.feedback}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {venue.eventsHosted > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {venue.eventsHosted}
                      </span>{' '}
                      events hosted successfully
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Commercial Terms */}
            {venue.commercialTerms && Object.keys(venue.commercialTerms).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Commercial Terms
                </h2>
                <div className="space-y-3">
                  {venue.commercialTerms.type && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Pricing Model:{' '}
                      </span>
                      <span className="text-gray-900 dark:text-white capitalize">
                        {venue.commercialTerms.type.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {venue.commercialTerms.details && (
                    <p className="text-gray-700 dark:text-gray-300">
                      {venue.commercialTerms.details}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Collaboration Preferences */}
            {venue.collaborationPreferences && venue.collaborationPreferences.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Looking to Collaborate On
                </h2>
                <div className="flex flex-wrap gap-2">
                  {venue.collaborationPreferences.map((pref, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium"
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Venue Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {venue.venueName}
                </h1>

                {/* Location */}
                <div className="flex items-start space-x-3 mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-900 dark:text-white">{venue.locality}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{venue.city}</p>
                  </div>
                </div>

                {/* Venue Type */}
                <div className="flex items-center space-x-2 mb-4">
                  <Home className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white capitalize">
                    {venue.venueType?.replace('_', ' ')}
                  </span>
                </div>

                {/* Secure Contact Notice */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Secure Communication</p>
                      <p className="text-blue-600 dark:text-blue-400">
                        All communication is managed through IndulgeOut for your security and protection.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleRequestCollaboration}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Request Venue</span>
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  Send a collaboration request to the venue owner
                </p>
              </div>

              {/* Stats Card */}
              {venue.eventsHosted > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Venue Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Events Hosted</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {venue.eventsHosted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {venue.rating || '4.8'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueProfile;
