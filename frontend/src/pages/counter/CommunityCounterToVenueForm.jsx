import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import FieldReviewCard from '../../components/counter/FieldReviewCard';

const CommunityCounterToVenueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  
  const [fieldResponses, setFieldResponses] = useState({});
  const [venueServices, setVenueServices] = useState({
    audioVisual: 'accept',
    seating: 'accept',
    barFood: 'accept',
    production: 'accept'
  });
  const [generalNotes, setGeneralNotes] = useState('');

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/collaborations/${id}`);
      setProposal(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError('Failed to load proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldResponseChange = (fieldName, response) => {
    setFieldResponses(prev => ({ ...prev, [fieldName]: response }));
  };

  const handleServiceChange = (service, value) => {
    setVenueServices(prev => ({ ...prev, [service]: value }));
  };

  const handleSubmit = async () => {
    const hasResponses = Object.keys(fieldResponses).length > 0;
    if (!hasResponses) {
      alert('Please respond to at least one field');
      return;
    }

    const incompleteResponses = Object.entries(fieldResponses).filter(
      ([key, response]) => !response.action
    );
    if (incompleteResponses.length > 0) {
      alert('Please select an action (Accept/Modify/Decline) for all fields');
      return;
    }

    const modifiedWithoutValue = Object.entries(fieldResponses).filter(
      ([key, response]) => response.action === 'modify' && !response.modifiedValue
    );
    if (modifiedWithoutValue.length > 0) {
      alert('Please provide modified values for all fields marked as "Modify"');
      return;
    }

    try {
      setSubmitting(true);
      const counterData = {
        fieldResponses,
        venueServices,
        generalNotes
      };

      await api.post(`/collaborations/${id}/counter`, { counterData });
      alert('Counter-proposal submitted successfully! It will be reviewed by admin.');
      navigate('/collaborations');
    } catch (err) {
      console.error('Error submitting counter:', err);
      alert(err.response?.data?.message || 'Failed to submit counter-proposal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Proposal not found'}</p>
          <button onClick={() => navigate('/collaborations')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Back to Collaborations
          </button>
        </div>
      </div>
    );
  }

  const formData = proposal.formData || {};

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">COMMUNITY RESPONSE FORM</h1>
            <button onClick={() => navigate('/collaborations')} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400">Community to Venue • Review and respond to venue hosting proposal</p>
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>From:</strong> {proposal.proposerId?.name || 'Unknown'} (Venue)
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Section 1: Venue Services Review */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">1</div>
            <div>
              <h2 className="text-xl font-bold">VENUE SERVICES REVIEW</h2>
              <p className="text-sm text-gray-400">Review what the venue is offering to provide</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Audio/Visual Support */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Audio/Visual Support</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">VENUE OFFERED</p>
                <p className="text-white text-sm">{formData.audioVisualSupport || 'Yes - Full A/V equipment provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleServiceChange('audioVisual', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.audioVisual === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={() => handleServiceChange('audioVisual', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.audioVisual === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Not Required
                </button>
              </div>
            </div>

            {/* Seating/Layout */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Seating & Layout Support</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">VENUE OFFERED</p>
                <p className="text-white text-sm">{formData.seatingSupport || 'Yes - Flexible seating arrangements'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleServiceChange('seating', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.seating === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={() => handleServiceChange('seating', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.seating === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Not Required
                </button>
              </div>
            </div>

            {/* Bar/Food Service */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Bar & Food Service</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">VENUE OFFERED</p>
                <p className="text-white text-sm">{formData.barFoodService || 'Yes - Full kitchen and bar service available'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleServiceChange('barFood', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.barFood === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={() => handleServiceChange('barFood', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.barFood === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Not Required
                </button>
              </div>
            </div>

            {/* Production/Setup Support */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Production & Setup Support</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">VENUE OFFERED</p>
                <p className="text-white text-sm">{formData.productionSupport || 'Yes - Technical crew and setup assistance'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleServiceChange('production', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.production === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={() => handleServiceChange('production', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    venueServices.production === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Not Required
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Venue Pricing Review */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">2</div>
            <div>
              <h2 className="text-xl font-bold">VENUE PRICING REVIEW</h2>
              <p className="text-sm text-gray-400">Review venue's pricing model and costs</p>
            </div>
          </div>

          {formData.pricingModel && (
            <FieldReviewCard
              fieldName="Pricing Model"
              originalValue={formData.pricingModel}
              proposedLabel="VENUE PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('pricingModel', response)}
            />
          )}

          {formData.venuePrice && (
            <FieldReviewCard
              fieldName="Venue Price / Fee"
              originalValue={formData.venuePrice}
              proposedLabel="VENUE PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('venuePrice', response)}
            />
          )}
        </div>

        {/* Section 3: Event Requirements */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">3</div>
            <div>
              <h2 className="text-xl font-bold">EVENT REQUIREMENTS</h2>
              <p className="text-sm text-gray-400">Review and confirm event details</p>
            </div>
          </div>

          {formData.eventDate && (
            <FieldReviewCard
              fieldName="Event Date"
              originalValue={formData.eventDate}
              proposedLabel="VENUE PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('eventDate', response)}
            />
          )}

          {formData.eventDuration && (
            <FieldReviewCard
              fieldName="Event Duration"
              originalValue={formData.eventDuration}
              proposedLabel="VENUE PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('eventDuration', response)}
            />
          )}

          {formData.expectedAttendance && (
            <FieldReviewCard
              fieldName="Expected Attendance"
              originalValue={formData.expectedAttendance}
              proposedLabel="VENUE PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('expectedAttendance', response)}
            />
          )}
        </div>

        {/* Section 4: Venue Policies & Setup */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">4</div>
            <div>
              <h2 className="text-xl font-bold">VENUE POLICIES & SETUP</h2>
              <p className="text-sm text-gray-400">Review venue's house rules and policies</p>
            </div>
          </div>

          {formData.alcoholPolicy && (
            <FieldReviewCard
              fieldName="Alcohol Policy"
              originalValue={formData.alcoholPolicy}
              proposedLabel="VENUE POLICY"
              allowModify={false}
              onResponseChange={(response) => handleFieldResponseChange('alcoholPolicy', response)}
            />
          )}

          {formData.soundLimits && (
            <FieldReviewCard
              fieldName="Sound Limits & Restrictions"
              originalValue={formData.soundLimits}
              proposedLabel="VENUE POLICY"
              allowModify={false}
              onResponseChange={(response) => handleFieldResponseChange('soundLimits', response)}
            />
          )}

          {formData.setupTeardown && (
            <FieldReviewCard
              fieldName="Setup & Teardown Windows"
              originalValue={formData.setupTeardown}
              proposedLabel="VENUE POLICY"
              onResponseChange={(response) => handleFieldResponseChange('setupTeardown', response)}
            />
          )}
        </div>

        {/* General Notes */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">General Notes (Optional)</label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            maxLength={500}
            placeholder="Add any additional comments or requirements for the venue..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
            rows="4"
          />
          <p className="text-xs text-gray-500 mt-1">{generalNotes.length}/500</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
          <button
            onClick={() => navigate('/collaborations')}
            className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Response to Venue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityCounterToVenueForm;
