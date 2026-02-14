import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, X, Edit, AlertCircle, Send } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const CommunityCounterFormBrand = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collaboration, setCollaboration] = useState(null);
  const [error, setError] = useState(null);
  
  const [fieldResponses, setFieldResponses] = useState ({});
  const [communityCommitments, setCommunityCommitments] = useState({
    deliverables: [],
    audienceEngagement: '',
    contentCreation: '',
    timeline: ''
  });
  const [generalNotes, setGeneralNotes] = useState('');
  const [commercialCounter, setCommercialCounter] = useState(null);
  
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [modifyValue, setModifyValue] = useState(null);
  const [fieldNote, setFieldNote] = useState('');

  useEffect(() => {
    fetchCollaborationDetails();
  }, [id]);

  const fetchCollaborationDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/collaborations/${id}`);
      const collab = res.data.data;
      
      console.log('Loaded community counter form for brand proposal:', collab);
      console.log('Form data:', collab.formData);
      
      if (collab.type !== 'brandToCommunity') {
        setError('This form is only for community responses to brand campaign proposals');
        return;
      }
      
      if (!collab.formData) {
        console.warn('WARNING: No formData found in collaboration');
        setError('Proposal data is missing. Please contact support.');
        return;
      }
      
      setCollaboration(collab);
      setError(null);
    } catch (err) {
      console.error('Error fetching collaboration:', err);
      setError('Failed to load collaboration details');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldAction = (fieldName, action) => {
    if (action === 'modify') {
      setCurrentField(fieldName);
      setModifyValue(fieldResponses[fieldName]?.modifiedValue || null);
      setFieldNote(fieldResponses[fieldName]?.note || '');
      setShowModifyModal(true);
    } else {
      setFieldResponses(prev => ({
        ...prev,
        [fieldName]: {
          action,
          originalValue: getOriginalValue(fieldName),
          note: prev[fieldName]?.note || ''
        }
      }));
    }
  };

  const saveModification = () => {
    if (!modifyValue && currentField !== 'brandOffers') {
      alert('Please provide a value');
      return;
    }

    setFieldResponses(prev => ({
      ...prev,
      [currentField]: {
        action: 'modify',
        originalValue: getOriginalValue(currentField),
        modifiedValue: modifyValue,
        note: fieldNote
      }
    }));

    if (currentField === 'brandOffers') {
      setCommercialCounter(modifyValue);
    }

    setShowModifyModal(false);
    setCurrentField(null);
  };

  const getOriginalValue = (fieldName) => {
    const formData = collaboration?.formData || {};
    const fieldMap = {
      campaignObjectives: formData.campaignObjectives,
      targetAudience: formData.targetAudience,
      preferredFormats: formData.preferredFormats,
      cashOffer: formData.brandOffers?.cash,
      barterOffer: formData.brandOffers?.barter,
      coMarketingOffer: formData.brandOffers?.coMarketing,
      contentOffer: formData.brandOffers?.content,
      brandingExpectation: formData.brandExpectations?.branding,
      speakingExpectation: formData.brandExpectations?.speaking,
      leadCaptureExpectation: formData.brandExpectations?.leadCapture,
      exclusivityExpectation: formData.brandExpectations?.exclusivity,
      contentRightsExpectation: formData.brandExpectations?.contentRights
    };
    return fieldMap[fieldName];
  };

  const handleSubmitCounter = async () => {
    const requiredFields = ['campaignObjectives', 'targetAudience'];
    const missingResponses = requiredFields.filter(field => !fieldResponses[field]);
    
    if (missingResponses.length > 0) {
      alert(`Please respond to all required fields: ${missingResponses.join(', ')}`);
      return;
    }

    if (!window.confirm('Submit counter-proposal? This will be reviewed by admin before being sent to the brand.')) {
      return;
    }

    try {
      setSubmitting(true);
      
      const counterData = {
        fieldResponses,
        communityCommitments,
        commercialCounter,
        generalNotes
      };

      console.log('Submitting community counter:', counterData);
      
      const response = await api.post(`/collaborations/${id}/counter`, { counterData });
      
      alert('Counter-proposal submitted successfully! The brand will review your response shortly.');
      navigate('/collaborations', {
        state: {
          message: 'Counter-proposal submitted successfully',
          tab: 'received'
        }
      });
    } catch (err) {
      console.error('Error submitting counter:', err);
      alert(err.response?.data?.message || 'Failed to submit counter-proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldActionButtons = (fieldName) => {
    const response = fieldResponses[fieldName];
    const action = response?.action;

    return (
      <div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleFieldAction(fieldName, 'accept')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              action === 'accept'
                ? 'bg-green-700 text-white border border-green-600'
                : 'bg-green-900/20 text-green-400 border border-green-700 hover:bg-green-900/40'
            }`}
          >
            <Check className="h-4 w-4 inline mr-2" />
            Accept
          </button>
          <button
            onClick={() => handleFieldAction(fieldName, 'modify')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              action === 'modify'
                ? 'text-white border border-yellow-600'
                : 'bg-yellow-900/20 text-yellow-400 border border-yellow-700 hover:bg-yellow-900/40'
            }`}
            style={action === 'modify' ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' } : {}}
          >
            <Edit className="h-4 w-4 inline mr-2" />
            Modify
          </button>
          <button
            onClick={() => handleFieldAction(fieldName, 'decline')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              action === 'decline'
                ? 'bg-red-700 text-white border border-red-600'
                : 'bg-red-900/20 text-red-400 border border-red-700 hover:bg-red-900/40'
            }`}
          >
            <X className="h-4 w-4 inline mr-2" />
            Decline
          </button>
        </div>
        {action && (
          <div className="mt-3">
            <label className="block text-sm text-blue-400 mb-2">Add note (optional)</label>
            <input
              type="text"
              value={fieldResponses[fieldName]?.note || ''}
              onChange={(e) => setFieldResponses(prev => ({
                ...prev,
                [fieldName]: { ...prev[fieldName], note: e.target.value }
              }))}
              placeholder="Add any additional notes..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
            />
          </div>
        )}
      </div>
    );
  };

  const renderModifyModal = () => {
    if (!showModifyModal || !currentField) return null;

    const formData = collaboration?.formData || {};

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">
            {currentField === 'campaignObjectives' && 'Campaign Objectives'}
            {currentField === 'targetAudience' && 'Target Audience'}
            {currentField === 'preferredFormats' && 'Preferred Formats'}
            {currentField === 'cashOffer' && 'Cash Sponsorship'}
            {currentField === 'barterOffer' && 'Barter / Products'}
            {currentField === 'coMarketingOffer' && 'Co-Marketing'}
            {currentField === 'contentOffer' && 'Content Support'}
            {currentField === 'brandingExpectation' && 'Branding Expectations'}
            {currentField === 'speakingExpectation' && 'Speaking Slot'}
            {currentField === 'leadCaptureExpectation' && 'Lead Capture'}
            {currentField === 'exclusivityExpectation' && 'Exclusivity'}
            {currentField === 'contentRightsExpectation' && 'Content Rights'}
          </h3>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">BRAND PROPOSED</p>
            <p className="text-white">
              {currentField === 'campaignObjectives' && formData.campaignObjectives?.join(', ')}
              {currentField === 'targetAudience' && formData.targetAudience}
              {currentField === 'preferredFormats' && formData.preferredFormats?.join(', ')}
              {currentField === 'cashOffer' && `₹${formData.brandOffers?.cash?.amount}`}
              {currentField === 'barterOffer' && formData.brandOffers?.barter?.description}
              {currentField === 'coMarketingOffer' && formData.brandOffers?.coMarketing?.description}
              {currentField === 'contentOffer' && formData.brandOffers?.content?.description}
              {currentField.includes('Expectation') && 'Brand expectation described'}
            </p>
          </div>

          {/* Campaign Objectives */}
          {currentField === 'campaignObjectives' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select objectives you can deliver:</p>
              <div className="space-y-2">
                {['Brand Awareness', 'Product Trials', 'Lead Generation', 'Sales', 'Engagement'].map(objective => {
                  const currentValue = modifyValue || [];
                  const isSelected = currentValue.includes(objective);
                  return (
                    <button
                      key={objective}
                      onClick={() => {
                        const updated = isSelected
                          ? currentValue.filter(o => o !== objective)
                          : [...currentValue, objective];
                        setModifyValue(updated);
                      }}
                      className={`w-full py-3 px-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-yellow-600 border-yellow-400 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                      }`}
                    >
                      {objective}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Target Audience */}
          {currentField === 'targetAudience' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Describe your actual audience reach:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., 2000 active members, 70% aged 22-32..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Preferred Formats */}
          {currentField === 'preferredFormats' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select formats you can support:</p>
              <div className="grid grid-cols-2 gap-3">
                {['Event Sponsorship', 'Workshop', 'Product Launch', 'Contest', 'Social Campaign', 'Content Series'].map(format => {
                  const currentValue = modifyValue || [];
                  const isSelected = currentValue.includes(format);
                  return (
                    <button
                      key={format}
                      onClick={() => {
                        const updated = isSelected
                          ? currentValue.filter(f => f !== format)
                          : [...currentValue, format];
                        setModifyValue(updated);
                      }}
                      className={`py-3 px-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-yellow-600 border-yellow-400 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                      }`}
                    >
                      {format}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cash/Barter/CoMarketing/Content Offers */}
          {['cashOffer', 'barterOffer', 'coMarketingOffer', 'contentOffer'].includes(currentField) && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Propose your counter-offer:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="Describe what you need instead..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Brand Expectations */}
          {currentField.includes('Expectation') && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Clarify what you can provide:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="Describe the modified expectation..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Optional Note */}
          <div className="mt-6">
            <label className="block text-sm text-gray-400 mb-2">
              Add note (optional - max 120 chars)
            </label>
            <input
              type="text"
              maxLength={120}
              value={fieldNote}
              onChange={(e) => setFieldNote(e.target.value)}
              placeholder="Any additional information..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={saveModification}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setShowModifyModal(false);
                setCurrentField(null);
              }}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading proposal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error || 'Collaboration not found'}</p>
            <button
              onClick={() => navigate('/collaborations')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Collaborations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formData = collaboration.formData || {};
  const initiatorName = collaboration.initiator?.name || 'Unknown Brand';

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationBar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">COMMUNITY RESPONSE FORM</h1>
          <p className="text-gray-400">
            {initiatorName} • Review brand campaign proposal
          </p>
        </div>

        {/* Section 1: Campaign Objectives */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              1
            </div>
            <div>
              <h2 className="text-xl font-bold">CAMPAIGN OBJECTIVES</h2>
              <p className="text-sm text-gray-400">Review brand's campaign goals</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Objectives</h3>
            <p className="text-sm text-gray-400 mb-2">BRAND WANTS TO ACHIEVE</p>
            <p className="text-white mb-1">{formData.campaignObjectives?.join(', ')}</p>
            {fieldResponses.campaignObjectives?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                You can deliver: {fieldResponses.campaignObjectives?.modifiedValue?.join(', ')}
              </p>
            )}
            {renderFieldActionButtons('campaignObjectives')}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Target Audience</h3>
            <p className="text-sm text-gray-400 mb-2">BRAND SEEKING</p>
            <p className="text-white mb-1">{formData.targetAudience}</p>
            {fieldResponses.targetAudience?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                Your audience: {fieldResponses.targetAudience?.modifiedValue}
              </p>
            )}
            {renderFieldActionButtons('targetAudience')}
          </div>

          {formData.preferredFormats && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Preferred Formats</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND PREFERENCE</p>
              <p className="text-white mb-1">{formData.preferredFormats?.join(', ')}</p>
              {fieldResponses.preferredFormats?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Formats you support: {fieldResponses.preferredFormats?.modifiedValue?.join(', ')}
                </p>
              )}
              {renderFieldActionButtons('preferredFormats')}
            </div>
          )}
        </div>

        {/* Section 2: Brand Offers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              2
            </div>
            <div>
              <h2 className="text-xl font-bold">BRAND OFFERS</h2>
              <p className="text-sm text-gray-400">What brand is providing</p>
            </div>
          </div>

          {formData.brandOffers?.cash?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Cash Sponsorship</h3>
              <p className="text-sm text-gray-400 mb-2">OFFERED AMOUNT</p>
              <p className="text-white mb-1">₹{formData.brandOffers.cash.amount}</p>
              {fieldResponses.cashOffer?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your counter: {fieldResponses.cashOffer?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('cashOffer')}
            </div>
          )}

          {formData.brandOffers?.barter?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Barter / Products</h3>
              <p className="text-sm text-gray-400 mb-2">OFFERED</p>
              <p className="text-white mb-1">{formData.brandOffers.barter.description}</p>
              {fieldResponses.barterOffer?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your preference: {fieldResponses.barterOffer?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('barterOffer')}
            </div>
          )}

          {formData.brandOffers?.coMarketing?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Co-Marketing</h3>
              <p className="text-sm text-gray-400 mb-2">OFFERED</p>
              <p className="text-white mb-1">{formData.brandOffers.coMarketing.description}</p>
              {fieldResponses.coMarketingOffer?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your counter: {fieldResponses.coMarketingOffer?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('coMarketingOffer')}
            </div>
          )}

          {formData.brandOffers?.content?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Content Support</h3>
              <p className="text-sm text-gray-400 mb-2">OFFERED</p>
              <p className="text-white mb-1">{formData.brandOffers.content.description}</p>
              {fieldResponses.contentOffer?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your needs: {fieldResponses.contentOffer?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('contentOffer')}
            </div>
          )}
        </div>

        {/* Section 3: Brand Expectations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              3
            </div>
            <div>
              <h2 className="text-xl font-bold">BRAND EXPECTATIONS</h2>
              <p className="text-sm text-gray-400">What brand expects in return</p>
            </div>
          </div>

          {formData.brandExpectations?.branding?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Branding / Logo Placement</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white mb-1">{formData.brandExpectations.branding.description}</p>
              {renderFieldActionButtons('brandingExpectation')}
            </div>
          )}

          {formData.brandExpectations?.speaking?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Speaking Slot</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white mb-1">{formData.brandExpectations.speaking.description}</p>
              {renderFieldActionButtons('speakingExpectation')}
            </div>
          )}

          {formData.brandExpectations?.leadCapture?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Lead Capture</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white mb-1">{formData.brandExpectations.leadCapture.description}</p>
              {renderFieldActionButtons('leadCaptureExpectation')}
            </div>
          )}

          {formData.brandExpectations?.exclusivity?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Category Exclusivity</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white mb-1">{formData.brandExpectations.exclusivity.description}</p>
              {renderFieldActionButtons('exclusivityExpectation')}
            </div>
          )}

          {formData.brandExpectations?.contentRights?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Content Rights</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white mb-1">{formData.brandExpectations.contentRights.description}</p>
              {renderFieldActionButtons('contentRightsExpectation')}
            </div>
          )}
        </div>

        {/* Section 4: Community Commitments */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              4
            </div>
            <div>
              <h2 className="text-xl font-bold">COMMUNITY COMMITMENTS</h2>
              <p className="text-sm text-gray-400">What you'll deliver</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Deliverables You Can Provide</label>
              <div className="flex flex-wrap gap-3">
                {['Social Posts', 'Event Feature', 'Email Blast', 'Community Story', 'Product Review', 'Workshop/Demo'].map(deliverable => (
                  <button
                    key={deliverable}
                    onClick={() => {
                      const current = communityCommitments.deliverables || [];
                      const updated = current.includes(deliverable)
                        ? current.filter(d => d !== deliverable)
                        : [...current, deliverable];
                      setCommunityCommitments(prev => ({ ...prev, deliverables: updated }));
                    }}
                    className={`py-2 px-4 rounded-lg ${
                      communityCommitments.deliverables?.includes(deliverable)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {deliverable}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Audience Engagement Plan (optional)</label>
              <textarea
                value={communityCommitments.audienceEngagement}
                onChange={(e) => setCommunityCommitments(prev => ({ ...prev, audienceEngagement: e.target.value }))}
                rows={3}
                placeholder="How you'll engage your community with this campaign..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Content Creation (optional)</label>
              <textarea
                value={communityCommitments.contentCreation}
                onChange={(e) => setCommunityCommitments(prev => ({ ...prev, contentCreation: e.target.value }))}
                rows={3}
                placeholder="Type of content you'll create (photos, videos, stories, etc.)..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Timeline Commitment (optional)</label>
              <input
                type="text"
                value={communityCommitments.timeline}
                onChange={(e) => setCommunityCommitments(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="e.g., Campaign launch within 2 weeks"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Additional Notes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              5
            </div>
            <div>
              <h2 className="text-xl font-bold">ADDITIONAL INFORMATION</h2>
              <p className="text-sm text-gray-400">Optional</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">General Notes</label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={4}
              placeholder="Any additional terms, conditions, or information..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 text-center mb-8">
          <h3 className="font-bold text-lg mb-2">READY TO RESPOND?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Your response will be delivered to the brand for their review
          </p>
          <button
            onClick={handleSubmitCounter}
            disabled={submitting}
            className="w-full py-4 hover:opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
          >
            <Send className="h-5 w-5" />
            {submitting ? 'Submitting...' : 'Submit Response to Brand'}
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {renderModifyModal()}
    </div>
  );
};

export default CommunityCounterFormBrand;
