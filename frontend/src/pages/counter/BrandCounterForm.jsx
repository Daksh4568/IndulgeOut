import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../config/api';
import FieldReviewCard from '../../components/counter/FieldReviewCard';

const BrandCounterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  
  const [fieldResponses, setFieldResponses] = useState({});
  const [commercialCounter, setCommercialCounter] = useState({ model: '', value: '', note: '' });
  const [generalNotes, setGeneralNotes] = useState('');
  const [showCommercialCounter, setShowCommercialCounter] = useState(false);

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/collaborations/${id}`);
      const collaboration = res.data.data || res.data;
      console.log('Fetched collaboration for counter form:', {
        id: collaboration._id,
        type: collaboration.type,
        status: collaboration.status,
        proposerId: collaboration.proposerId,
        recipientId: collaboration.recipientId,
        hasCounter: collaboration.hasCounter,
        latestCounterId: collaboration.latestCounterId,
        formData: collaboration.formData
      });
      setProposal(collaboration);
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
      const counterData = { fieldResponses, generalNotes };

      if (showCommercialCounter && commercialCounter.model && commercialCounter.value) {
        counterData.commercialCounter = commercialCounter;
      }

      const response = await api.post(`/collaborations/${id}/counter`, { counterData });
      
      console.log('Counter submitted successfully:', {
        collaborationId: id,
        counterId: response.data.data?.id,
        status: response.data.data?.status
      });
      
      alert('Counter-proposal submitted successfully! It will be reviewed by admin.');
      navigate('/collaborations', {
        state: { 
          message: 'Your counter-proposal has been submitted and is under admin review.',
          tab: 'received'
        }
      });
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
            <h1 className="text-3xl font-bold">BRAND RESPONSE FORM</h1>
            <button onClick={() => navigate('/collaborations')} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400">Brand to Community • Review and respond to sponsorship proposal</p>
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>From:</strong> {proposal.proposerId?.name || 'Unknown'} ({proposal.proposerType})
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Section 1: Event Overview */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">1</div>
            <div>
              <h2 className="text-xl font-bold">EVENT OVERVIEW</h2>
              <p className="text-sm text-gray-400">Confirm event details and reach</p>
            </div>
          </div>

          {formData.eventCategory || formData.targetAudience || formData.expectedReach ? (
            <>
              {formData.eventCategory && (
                <FieldReviewCard
                  fieldName="Event Category"
                  originalValue={formData.eventCategory}
                  onResponseChange={(response) => handleFieldResponseChange('eventCategory', response)}
                />
              )}

              {formData.targetAudience && (
                <FieldReviewCard
                  fieldName="Target Audience"
                  originalValue={formData.targetAudience}
                  onResponseChange={(response) => handleFieldResponseChange('targetAudience', response)}
                />
              )}

              {formData.expectedReach && (
                <FieldReviewCard
                  fieldName="Expected Reach"
                  originalValue={formData.expectedReach}
                  onResponseChange={(response) => handleFieldResponseChange('expectedReach', response)}
                />
              )}
            </>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No event overview details provided</p>
            </div>
          )}
        </div>

        {/* Section 2: Brand Deliverables */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">2</div>
            <div>
              <h2 className="text-xl font-bold">WHAT COMMUNITY EXPECTS</h2>
              <p className="text-sm text-gray-400">Review and confirm what brand will provide</p>
            </div>
          </div>

          {formData.brandDeliverables ? (
            <>
              <FieldReviewCard
                fieldName="Social Media Coverage"
                originalValue={formData.brandDeliverables.socialMedia ? 'Brand posts, stories, mentions on social channels' : 'Not requested'}
                proposedLabel="Requested"
                allowModify={false}
                onResponseChange={(response) => handleFieldResponseChange('socialMedia', response)}
              />

              <FieldReviewCard
                fieldName="Event Sponsorship"
                originalValue={formData.brandDeliverables.eventSponsorship ? 'Title sponsor, presenting sponsor, or powered-by sponsor' : 'Not requested'}
                proposedLabel="Requested"
                allowModify={false}
                onResponseChange={(response) => handleFieldResponseChange('eventSponsorship', response)}
              />

              <FieldReviewCard
                fieldName="Product Placement"
                originalValue={formData.brandDeliverables.productPlacement ? 'Product samples, giveaways, or on-site activation' : 'Not requested'}
                proposedLabel="Requested"
                allowModify={false}
                onResponseChange={(response) => handleFieldResponseChange('productPlacement', response)}
              />

              <FieldReviewCard
                fieldName="Content Creation"
                originalValue={formData.brandDeliverables.contentCreation ? 'Co-create content, reels, stories with community' : 'Not requested'}
                proposedLabel="Requested"
                allowModify={false}
                onResponseChange={(response) => handleFieldResponseChange('contentCreation', response)}
              />

              {formData.supportingInfo?.note && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="text-gray-300 text-sm font-medium mb-2">Additional Deliverables</h4>
                  <p className="text-gray-400 text-sm">{formData.supportingInfo.note}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No specific deliverables mentioned in the proposal</p>
            </div>
          )}
        </div>

        {/* Section 3: Sponsorship Terms */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">3</div>
            <div>
              <h2 className="text-xl font-bold">SPONSORSHIP TERMS</h2>
              <p className="text-sm text-gray-400">Review and counter commercial proposal</p>
            </div>
          </div>

          {formData.pricing?.proposedValue ? (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Sponsorship Amount</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">COMMUNITY PROPOSED</p>
                <p className="text-white text-sm">{formData.pricing.proposedValue}</p>
                {formData.pricing.model && (
                  <p className="text-gray-400 text-sm mt-1">Model: {formData.pricing.model}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => setShowCommercialCounter(false)}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    !showCommercialCounter
                      ? 'bg-green-900/50 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>

                <button
                  onClick={() => setShowCommercialCounter(true)}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    showCommercialCounter
                      ? 'bg-yellow-900/50 text-white border-2 border-yellow-500'
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700 hover:bg-yellow-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Counter
                </button>

                <button className="py-2 px-3 rounded text-sm font-medium transition-all bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Can't provide
                </button>
              </div>

              <button className="text-blue-400 text-xs hover:text-blue-300 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Add note about sponsorship (optional)
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No sponsorship amount mentioned in the proposal</p>
            </div>
          )}

          {showCommercialCounter && (
            <div className="bg-gray-800 border border-yellow-600 rounded-lg p-4 mb-4">
              <h4 className="text-yellow-400 font-semibold mb-3">Counter-Offer</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Sponsorship Model</label>
                  <select
                    value={commercialCounter.model}
                    onChange={(e) => setCommercialCounter(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">Select model</option>
                    <option value="Cash Sponsorship">Cash Sponsorship</option>
                    <option value="In-Kind Support">In-Kind Support</option>
                    <option value="Product Exchange">Product Exchange</option>
                    <option value="Equity Partnership">Equity Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Value</label>
                  <input
                    type="text"
                    value={commercialCounter.value}
                    onChange={(e) => setCommercialCounter(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="e.g., ₹1,00,000 or Product worth ₹50,000"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Note</label>
                  <textarea
                    value={commercialCounter.note}
                    onChange={(e) => setCommercialCounter(prev => ({ ...prev, note: e.target.value }))}
                    maxLength={120}
                    placeholder="Additional details about counter-offer..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-yellow-500 resize-none"
                    rows="2"
                  />
                  <span className="text-xs text-gray-500">{commercialCounter.note.length}/120</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* General Notes */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">General Notes (Optional)</label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            maxLength={500}
            placeholder="Add any additional comments or requirements..."
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
                Submit Response to Community
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandCounterForm;
