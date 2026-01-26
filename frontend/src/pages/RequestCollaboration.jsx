import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Send, Calendar, Users, DollarSign, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import API_URL from '../config/api';

const RequestCollaboration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine if this is a venue or brand request from URL
  const isVenueRequest = location.pathname.includes('/venue/');
  const isBrandRequest = location.pathname.includes('/brand/');
  
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    expectedAttendees: '',
    message: '',
    // Venue specific
    timeSlot: '',
    eventType: '',
    budgetRange: '',
    // Brand specific
    sponsorshipType: [],
    collaborationFormat: [],
    expectedReach: '',
    targetAudience: '',
    budgetProposed: '',
    deliverables: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPartnerDetail();
  }, [id, user]);

  const fetchPartnerDetail = async () => {
    try {
      setLoading(true);
      const endpoint = isVenueRequest ? 'venues' : 'brands';
      const response = await api.get(`/${endpoint}/${id}`);
      setPartner(response.data);
    } catch (error) {
      console.error('Error fetching partner detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    } else {
      const selectedDate = new Date(formData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.eventDate = 'Event date must be in the future';
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 50) {
      newErrors.message = 'Message must be at least 50 characters';
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Message must not exceed 1000 characters';
    }

    // Venue specific validation
    if (isVenueRequest) {
      if (!formData.timeSlot) {
        newErrors.timeSlot = 'Time slot is required';
      }
      if (!formData.expectedAttendees) {
        newErrors.expectedAttendees = 'Expected attendees is required';
      }
      if (!formData.eventType) {
        newErrors.eventType = 'Event type is required';
      }
    }

    // Brand specific validation
    if (isBrandRequest) {
      if (formData.sponsorshipType.length === 0) {
        newErrors.sponsorshipType = 'Select at least one sponsorship type';
      }
      if (formData.collaborationFormat.length === 0) {
        newErrors.collaborationFormat = 'Select at least one collaboration format';
      }
      if (!formData.expectedReach) {
        newErrors.expectedReach = 'Expected reach is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const endpoint = isVenueRequest 
        ? `${API_URL}/api/venues/${id}/request-collaboration`
        : `${API_URL}/api/brands/${id}/propose-collaboration`;

      const payload = {
        eventName: formData.eventName,
        eventDate: formData.eventDate,
        message: formData.message,
        ...(isVenueRequest && {
          timeSlot: formData.timeSlot,
          expectedAttendees: parseInt(formData.expectedAttendees),
          eventType: formData.eventType,
          budgetRange: formData.budgetRange
        }),
        ...(isBrandRequest && {
          sponsorshipType: formData.sponsorshipType,
          collaborationFormat: formData.collaborationFormat,
          expectedReach: parseInt(formData.expectedReach),
          targetAudience: formData.targetAudience,
          budgetProposed: formData.budgetProposed ? parseInt(formData.budgetProposed) : undefined,
          deliverables: formData.deliverables
        })
      };

      await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Success - navigate back with success message
      navigate(isVenueRequest ? `/venue/${id}` : `/brand/${id}`, {
        state: { message: 'Collaboration request sent successfully!' }
      });
    } catch (error) {
      console.error('Error submitting collaboration request:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to send request. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <NavigationBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Partner not found
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const partnerName = isVenueRequest ? partner.venueName : partner.brandName;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isVenueRequest ? 'Request Venue' : 'Propose Collaboration'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send a collaboration request to <span className="font-semibold">{partnerName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Event Details
            </h2>

            {/* Event Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                  errors.eventName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Tech Meetup: AI & Machine Learning"
              />
              {errors.eventName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventName}</p>
              )}
            </div>

            {/* Event Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                    errors.eventDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {errors.eventDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventDate}</p>
              )}
            </div>

            {/* Venue-Specific Fields */}
            {isVenueRequest && (
              <>
                {/* Time Slot */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Time Slot *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="timeSlot"
                      value={formData.timeSlot}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                        errors.timeSlot ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select time slot</option>
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 9 PM)</option>
                      <option value="night">Night (9 PM onwards)</option>
                      <option value="full_day">Full Day</option>
                    </select>
                  </div>
                  {errors.timeSlot && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.timeSlot}</p>
                  )}
                </div>

                {/* Expected Attendees */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expected Attendees *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="expectedAttendees"
                      value={formData.expectedAttendees}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                        errors.expectedAttendees ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., 50"
                    />
                  </div>
                  {errors.expectedAttendees && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expectedAttendees}</p>
                  )}
                </div>

                {/* Event Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Type *
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                      errors.eventType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select event type</option>
                    <option value="workshop">Workshop</option>
                    <option value="meetup">Meetup</option>
                    <option value="social">Social Gathering</option>
                    <option value="networking">Networking Event</option>
                    <option value="launch">Product Launch</option>
                    <option value="activation">Brand Activation</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.eventType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventType}</p>
                  )}
                </div>

                {/* Budget Range */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget Range (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select budget range</option>
                      <option value="0-5000">₹0 - ₹5,000</option>
                      <option value="5000-10000">₹5,000 - ₹10,000</option>
                      <option value="10000-25000">₹10,000 - ₹25,000</option>
                      <option value="25000-50000">₹25,000 - ₹50,000</option>
                      <option value="50000+">₹50,000+</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Brand-Specific Fields */}
            {isBrandRequest && (
              <>
                {/* Sponsorship Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sponsorship Type * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['barter', 'paid_monetary', 'product_sampling', 'co-marketing'].map(type => (
                      <label key={type} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.sponsorshipType.includes(type)}
                          onChange={() => handleCheckboxChange('sponsorshipType', type)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {type.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.sponsorshipType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sponsorshipType}</p>
                  )}
                </div>

                {/* Collaboration Format */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collaboration Format * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['sponsorship', 'sampling', 'popups', 'experience_partnerships', 'brand_activation', 'content_creation'].map(format => (
                      <label key={format} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.collaborationFormat.includes(format)}
                          onChange={() => handleCheckboxChange('collaborationFormat', format)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {format.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.collaborationFormat && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.collaborationFormat}</p>
                  )}
                </div>

                {/* Expected Reach */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expected Reach *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="expectedReach"
                      value={formData.expectedReach}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                        errors.expectedReach ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., 5000"
                    />
                  </div>
                  {errors.expectedReach && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expectedReach}</p>
                  )}
                </div>

                {/* Target Audience */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience (Optional)
                  </label>
                  <input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Tech professionals, 25-35 years"
                  />
                </div>

                {/* Budget Proposed */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget Proposed (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      name="budgetProposed"
                      value={formData.budgetProposed}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>

                {/* Deliverables */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deliverables (Optional)
                  </label>
                  <textarea
                    name="deliverables"
                    value={formData.deliverables}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="What you'll provide in return (e.g., social media posts, product placements, booth space)"
                  />
                </div>
              </>
            )}
          </div>

          {/* Message Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your {isVenueRequest ? 'Request' : 'Pitch'} *
            </h2>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="8"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                  errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={isVenueRequest 
                  ? "Describe your event in detail, why this venue is a good fit, and any special requirements..."
                  : "Describe your event, why this brand partnership makes sense, and how it aligns with their values..."}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              {errors.message && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.message}</p>
              )}
              <p className={`text-sm ml-auto ${
                formData.message.length < 50 
                  ? 'text-red-600 dark:text-red-400' 
                  : formData.message.length > 1000
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formData.message.length} / 1000 characters (min. 50)
              </p>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestCollaboration;

