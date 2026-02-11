import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../config/api';
import FieldReviewCard from '../../components/counter/FieldReviewCard';

const CommunityCounterToBrandForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  
  const [fieldResponses, setFieldResponses] = useState({});
  const [deliverables, setDeliverables] = useState({
    socialMediaPosts: 'accept',
    eventBranding: 'accept',
    emailMarketing: 'accept',
    influencerCollabs: 'accept'
  });
  const [generalNotes, setGeneralNotes] = useState('');

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

  const handleDeliverableChange = (deliverable, value) => {
    setDeliverables(prev => ({ ...prev, [deliverable]: value }));
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
        deliverables,
        generalNotes
      };

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
          tab: 'sent'
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
            <h1 className="text-3xl font-bold">COMMUNITY RESPONSE FORM</h1>
            <button onClick={() => navigate('/collaborations')} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400">Community to Brand • Review and respond to brand sponsorship proposal</p>
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>From:</strong> {proposal.proposerId?.name || 'Unknown'} (Brand)
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Section 1: Campaign Objectives */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">1</div>
            <div>
              <h2 className="text-xl font-bold">CAMPAIGN OBJECTIVES REVIEW</h2>
              <p className="text-sm text-gray-400">Review brand's campaign goals and target metrics</p>
            </div>
          </div>

          {formData.campaignObjectives && Object.keys(formData.campaignObjectives).length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Campaign Objectives</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">BRAND PROPOSED</p>
                <div className="space-y-1">
                  {Object.entries(formData.campaignObjectives).map(([key, value]) => (
                    value && (
                      <p key={key} className="text-white text-sm flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </p>
                    )
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFieldResponseChange('campaignObjectives', { action: 'accept' })}
                  className="py-2 px-3 rounded text-sm font-medium transition-all bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={() => handleFieldResponseChange('campaignObjectives', { action: 'decline' })}
                  className="py-2 px-3 rounded text-sm font-medium transition-all bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Decline
                </button>
              </div>
            </div>
          )}

          {formData.targetAudience && (
            <FieldReviewCard
              fieldName="Target Audience"
              originalValue={formData.targetAudience}
              proposedLabel="BRAND PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('targetAudience', response)}
            />
          )}

          {formData.preferredFormats && formData.preferredFormats.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Preferred Event Formats</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">BRAND PROPOSED</p>
                <div className="flex flex-wrap gap-2">
                  {formData.preferredFormats.map((format, index) => (
                    <span key={index} className="px-3 py-1 bg-indigo-900/30 text-indigo-300 border border-indigo-700 rounded-full text-sm">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFieldResponseChange('preferredFormats', { action: 'accept' })}
                  className="py-2 px-3 rounded text-sm font-medium transition-all bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={() => handleFieldResponseChange('preferredFormats', { action: 'decline' })}
                  className="py-2 px-3 rounded text-sm font-medium transition-all bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Brand Offerings */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">2</div>
            <div>
              <h2 className="text-xl font-bold">BRAND OFFERINGS REVIEW</h2>
              <p className="text-sm text-gray-400">Review what the brand will provide</p>
            </div>
          </div>

          {formData.brandOffers && Object.keys(formData.brandOffers).length > 0 && (
            <div className="space-y-4">
              {Object.entries(formData.brandOffers).map(([offerId, offerData]) => {
                const offerLabels = {
                  cash: 'Cash Sponsorship',
                  barter: 'Barter / In-Kind',
                  coMarketing: 'Co-Marketing',
                  content: 'Content Support'
                };
                
                return offerData.selected && (
                  <div key={offerId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-gray-300 text-sm font-medium mb-2">{offerLabels[offerId] || offerId}</h4>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">BRAND OFFERED</p>
                      {offerData.subOptions && Object.keys(offerData.subOptions).length > 0 && (
                        <div className="space-y-1">
                          {Object.entries(offerData.subOptions).map(([subId, subData]) => (
                            subData.selected && (
                              <p key={subId} className="text-white text-sm flex items-center">
                                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {subId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </p>
                            )
                          ))}
                        </div>
                      )}
                      {offerData.comment && (
                        <p className="text-gray-400 text-sm mt-2 italic">"{offerData.comment}"</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleFieldResponseChange(`brandOffers_${offerId}`, { action: 'accept' })}
                        className="py-2 px-3 rounded text-sm font-medium transition-all bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => handleFieldResponseChange(`brandOffers_${offerId}`, { action: 'decline' })}
                        className="py-2 px-3 rounded text-sm font-medium transition-all bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Brand Expectations */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">3</div>
            <div>
              <h2 className="text-xl font-bold">BRAND EXPECTATIONS</h2>
              <p className="text-sm text-gray-400">Review what brand expects from community</p>
            </div>
          </div>

          {formData.brandExpectations && Object.keys(formData.brandExpectations).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(formData.brandExpectations).map(([expectId, expectData]) => {
                const expectLabels = {
                  branding: 'Branding Rights',
                  speaking: 'Speaking / Presentation Slot',
                  leadCapture: 'Lead Capture',
                  exclusivity: 'Category Exclusivity',
                  contentRights: 'Content Rights'
                };
                
                return expectData.selected && (
                  <div key={expectId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-gray-300 text-sm font-medium mb-2">{expectLabels[expectId] || expectId}</h4>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">BRAND EXPECTS</p>
                      {expectData.subOptions && Object.keys(expectData.subOptions).length > 0 && (
                        <div className="space-y-1">
                          {Object.entries(expectData.subOptions).map(([subId, subData]) => (
                            subData.selected && (
                              <p key={subId} className="text-white text-sm flex items-center">
                                <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {subId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </p>
                            )
                          ))}
                        </div>
                      )}
                      {expectData.comment && (
                        <p className="text-gray-400 text-sm mt-2 italic">"{expectData.comment}"</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleFieldResponseChange(`brandExpectations_${expectId}`, { action: 'accept' })}
                        className="py-2 px-3 rounded text-sm font-medium transition-all bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => handleFieldResponseChange(`brandExpectations_${expectId}`, { action: 'decline' })}
                        className="py-2 px-3 rounded text-sm font-medium transition-all bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No specific expectations mentioned by the brand</p>
            </div>
          )}
        </div>

        {/* Section 4: Community Deliverables (Custom Response) */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">4</div>
            <div>
              <h2 className="text-xl font-bold">COMMUNITY DELIVERABLES</h2>
              <p className="text-sm text-gray-400">Specify what community will deliver to brand</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Social Media Posts */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Social Media Posts & Mentions</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">BRAND REQUESTED</p>
                <p className="text-white text-sm">{formData.socialMediaRequired || 'Yes - Brand promotion across community channels'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDeliverableChange('socialMediaPosts', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.socialMediaPosts === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Can Provide
                </button>
                <button
                  onClick={() => handleDeliverableChange('socialMediaPosts', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.socialMediaPosts === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Can't Provide
                </button>
              </div>
            </div>

            {/* Event Branding */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Event Branding & Logo Placement</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">BRAND REQUESTED</p>
                <p className="text-white text-sm">{formData.brandingRequired || 'Yes - Prominent logo placement'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDeliverableChange('eventBranding', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.eventBranding === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Can Provide
                </button>
                <button
                  onClick={() => handleDeliverableChange('eventBranding', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.eventBranding === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Can't Provide
                </button>
              </div>
            </div>

            {/* Email Marketing */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Email Marketing to Community</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">BRAND REQUESTED</p>
                <p className="text-white text-sm">{formData.emailMarketingRequired || 'Yes - Brand feature in newsletters'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDeliverableChange('emailMarketing', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.emailMarketing === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Can Provide
                </button>
                <button
                  onClick={() => handleDeliverableChange('emailMarketing', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.emailMarketing === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Can't Provide
                </button>
              </div>
            </div>

            {/* Influencer Collaborations */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Influencer Collaborations</h4>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">BRAND REQUESTED</p>
                <p className="text-white text-sm">{formData.influencerRequired || 'Yes - Influencer endorsements'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDeliverableChange('influencerCollabs', 'accept')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.influencerCollabs === 'accept'
                      ? 'bg-green-700 text-white border-2 border-green-500'
                      : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Can Provide
                </button>
                <button
                  onClick={() => handleDeliverableChange('influencerCollabs', 'decline')}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    deliverables.influencerCollabs === 'decline'
                      ? 'bg-red-700 text-white border-2 border-red-500'
                      : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Can't Provide
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Timeline & Expectations */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold mr-3">4</div>
            <div>
              <h2 className="text-xl font-bold">TIMELINE & EXPECTATIONS</h2>
              <p className="text-sm text-gray-400">Review campaign timeline and deliverable deadlines</p>
            </div>
          </div>

          {formData.campaignDuration && (
            <FieldReviewCard
              fieldName="Campaign Duration"
              originalValue={formData.campaignDuration}
              proposedLabel="BRAND PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('campaignDuration', response)}
            />
          )}

          {formData.contentDeadlines && (
            <FieldReviewCard
              fieldName="Content Submission Deadlines"
              originalValue={formData.contentDeadlines}
              proposedLabel="BRAND PROPOSED"
              onResponseChange={(response) => handleFieldResponseChange('contentDeadlines', response)}
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
            placeholder="Add any additional comments or clarifications about the collaboration..."
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
                Submit Response to Brand
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityCounterToBrandForm;
