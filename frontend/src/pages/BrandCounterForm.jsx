import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, X, Edit, AlertCircle, Send } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const BrandCounterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collaboration, setCollaboration] = useState(null);
  const [error, setError] = useState(null);
  
  const [fieldResponses, setFieldResponses] = useState({});
  const [brandTerms, setBrandTerms] = useState({
    activationTypes: [],
    deliveryTimeline: '',
    exclusivityTerms: '',
    contentRights: ''
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
      
      if (collab.type !== 'communityToBrand') {
        setError('This form is only for brand responses to community sponsorship requests');
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
    if (!modifyValue && currentField !== 'commercialModel') {
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

    if (currentField === 'commercialModel') {
      setCommercialCounter(modifyValue);
    }

    setShowModifyModal(false);
    setCurrentField(null);
  };

  const getOriginalValue = (fieldName) => {
    const formData = collaboration?.formData || {};
    const fieldMap = {
      eventCategory: formData.eventCategory,
      expectedAttendees: formData.expectedAttendees,
      targetAudience: formData.targetAudience,
      city: formData.city,
      logoPlacement: formData.brandDeliverables?.logoPlacement,
      onGroundBranding: formData.brandDeliverables?.onGroundBranding,
      sampling: formData.brandDeliverables?.sampling,
      sponsoredSegments: formData.brandDeliverables?.sponsoredSegments,
      digitalShoutouts: formData.brandDeliverables?.digitalShoutouts,
      leadCapture: formData.brandDeliverables?.leadCapture,
      commercialModel: formData.pricing
    };
    return fieldMap[fieldName];
  };

  const handleSubmitCounter = async () => {
    const requiredFields = ['eventCategory', 'expectedAttendees', 'commercialModel'];
    const missingResponses = requiredFields.filter(field => !fieldResponses[field]);
    
    if (missingResponses.length > 0) {
      alert(`Please respond to all required fields: ${missingResponses.join(', ')}`);
      return;
    }

    if (!window.confirm('Submit counter-proposal? This will be reviewed by admin before being sent to the community.')) {
      return;
    }

    try {
      setSubmitting(true);
      
      const counterData = {
        fieldResponses,
        brandTerms,
        commercialCounter,
        generalNotes
      };

      console.log('Submitting brand counter:', counterData);
      
      const response = await api.post(`/collaborations/${id}/counter`, { counterData });
      
      alert('Counter-proposal submitted successfully! Admin will review before delivery.');
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
            {currentField === 'eventCategory' && 'Event Category'}
            {currentField === 'expectedAttendees' && 'Expected Attendees'}
            {currentField === 'targetAudience' && 'Target Audience'}
            {currentField === 'logoPlacement' && 'Logo Placement'}
            {currentField === 'onGroundBranding' && 'On-Ground Branding'}
            {currentField === 'sampling' && 'Sampling / Product Demo'}
            {currentField === 'sponsoredSegments' && 'Sponsored Segments'}
            {currentField === 'digitalShoutouts' && 'Digital Shoutouts'}
            {currentField === 'leadCapture' && 'Lead Capture'}
            {currentField === 'commercialModel' && 'Commercial Model'}
          </h3>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">COMMUNITY PROPOSED</p>
            <p className="text-white">
              {currentField === 'eventCategory' && formData.eventCategory}
              {currentField === 'expectedAttendees' && formData.expectedAttendees}
              {currentField === 'targetAudience' && formData.targetAudience}
              {currentField === 'logoPlacement' && 'Logo placement deliverable requested'}
              {currentField === 'onGroundBranding' && 'On-ground branding requested'}
              {currentField === 'sampling' && 'Product sampling requested'}
              {currentField === 'sponsoredSegments' && 'Sponsored segments requested'}
              {currentField === 'digitalShoutouts' && 'Digital shoutouts requested'}
              {currentField === 'leadCapture' && 'Lead capture requested'}
            </p>
          </div>

          {/* Event Category Options */}
          {currentField === 'eventCategory' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select event category:</p>
              <div className="grid grid-cols-2 gap-3">
                {['Music & Concerts', 'Comedy & Standup', 'Art & Exhibitions', 'Food & Culinary', 'Workshops', 'Networking'].map(option => (
                  <button
                    key={option}
                    onClick={() => setModifyValue(option)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      modifyValue === option
                        ? 'bg-yellow-600 border-yellow-400 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expected Attendees Options */}
          {currentField === 'expectedAttendees' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Expected reach you can deliver:</p>
              <div className="grid grid-cols-2 gap-3">
                {['50-100', '100-250', '250-500', '500+'].map(option => (
                  <button
                    key={option}
                    onClick={() => setModifyValue(option)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      modifyValue === option
                        ? 'bg-yellow-600 border-yellow-400 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target Audience */}
          {currentField === 'targetAudience' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Describe the actual audience you can target:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., Young professionals aged 25-35..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Deliverable Modifications */}
          {['logoPlacement', 'onGroundBranding', 'sampling', 'sponsoredSegments', 'digitalShoutouts', 'leadCapture'].includes(currentField) && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Specify what you can provide:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="Describe the modified deliverable..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Commercial Model */}
          {currentField === 'commercialModel' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Your counter sponsorship model:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., ₹50,000 cash + product barter worth ₹25,000..."
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
  const initiatorName = collaboration.initiator?.name || 'Unknown Community';

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
          <h1 className="text-3xl font-bold mb-2">BRAND RESPONSE FORM</h1>
          <p className="text-gray-400">
            {initiatorName} • Review sponsorship proposal
          </p>
        </div>

        {/* Section 1: Event Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              1
            </div>
            <div>
              <h2 className="text-xl font-bold">EVENT SNAPSHOT</h2>
              <p className="text-sm text-gray-400">Review and confirm event details</p>
            </div>
          </div>

          {/* Event Category */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Event Category</h3>
            <p className="text-sm text-gray-400 mb-2">COMMUNITY PROPOSED</p>
            <p className="text-white mb-1">{formData.eventCategory}</p>
            {fieldResponses.eventCategory?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                You prefer: {fieldResponses.eventCategory?.modifiedValue}
              </p>
            )}
            {renderFieldActionButtons('eventCategory')}
          </div>

          {/* Expected Attendees */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Expected Attendees / Reach</h3>
            <p className="text-sm text-gray-400 mb-2">PROPOSED</p>
            <p className="text-white mb-1">{formData.expectedAttendees}</p>
            {fieldResponses.expectedAttendees?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                You can deliver: {fieldResponses.expectedAttendees?.modifiedValue}
              </p>
            )}
            {renderFieldActionButtons('expectedAttendees')}
          </div>

          {/* Target Audience */}
          {formData.targetAudience && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Target Audience</h3>
              <p className="text-sm text-gray-400 mb-2">DESCRIBED BY COMMUNITY</p>
              <p className="text-white mb-1">{formData.targetAudience}</p>
              {fieldResponses.targetAudience?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your target: {fieldResponses.targetAudience?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('targetAudience')}
            </div>
          )}
        </div>

        {/* Section 2: Deliverables Requested */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              2
            </div>
            <div>
              <h2 className="text-xl font-bold">BRAND DELIVERABLES REQUESTED</h2>
              <p className="text-sm text-gray-400">Review what community is offering</p>
            </div>
          </div>

          {formData.brandDeliverables?.logoPlacement?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Logo Placement</h3>
              <p className="text-sm text-gray-400 mb-2">Community will provide logo placement</p>
              {renderFieldActionButtons('logoPlacement')}
            </div>
          )}

          {formData.brandDeliverables?.onGroundBranding?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">On-Ground Branding</h3>
              <p className="text-sm text-gray-400 mb-2">Community will provide on-ground branding</p>
              {renderFieldActionButtons('onGroundBranding')}
            </div>
          )}

          {formData.brandDeliverables?.sampling?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sampling / Product Demo</h3>
              <p className="text-sm text-gray-400 mb-2">Space for product sampling/demo</p>
              {renderFieldActionButtons('sampling')}
            </div>
          )}

          {formData.brandDeliverables?.sponsoredSegments?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sponsored Segments</h3>
              <p className="text-sm text-gray-400 mb-2">Dedicated segments during event</p>
              {renderFieldActionButtons('sponsoredSegments')}
            </div>
          )}

          {formData.brandDeliverables?.digitalShoutouts?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Digital Shoutouts</h3>
              <p className="text-sm text-gray-400 mb-2">Online promotion and mentions</p>
              {renderFieldActionButtons('digitalShoutouts')}
            </div>
          )}

          {formData.brandDeliverables?.leadCapture?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Lead Capture</h3>
              <p className="text-sm text-gray-400 mb-2">Attendee information collection</p>
              {renderFieldActionButtons('leadCapture')}
            </div>
          )}
        </div>

        {/* Section 3: Commercial Terms */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              3
            </div>
            <div>
              <h2 className="text-xl font-bold">COMMERCIAL & BUDGET</h2>
              <p className="text-sm text-gray-400">Review or propose your sponsorship model</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Sponsorship Budget</h3>
            <p className="text-sm text-gray-400 mb-2">COMMUNITY SEEKING</p>
            <p className="text-white mb-1">
              {formData.pricing?.cashSponsorship && `Cash: ₹${formData.pricing.cashSponsorship.amount}`}
              {formData.pricing?.barter && ` + Barter: ${formData.pricing.barter.description}`}
            </p>
            {renderFieldActionButtons('commercialModel')}
          </div>
        </div>

        {/* Section 4: Brand Activation Terms */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              4
            </div>
            <div>
              <h2 className="text-xl font-bold">BRAND ACTIVATION TERMS</h2>
              <p className="text-sm text-gray-400">Optional</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Activation Type</label>
              <div className="flex flex-wrap gap-3">
                {['Product Sampling', 'Booth Setup', 'Speaking Slot', 'Game/Contest', 'Photo Booth'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const current = brandTerms.activationTypes || [];
                      const updated = current.includes(type)
                        ? current.filter(t => t !== type)
                        : [...current, type];
                      setBrandTerms(prev => ({ ...prev, activationTypes: updated }));
                    }}
                    className={`py-2 px-4 rounded-lg ${
                      brandTerms.activationTypes?.includes(type)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Delivery Timeline (optional)</label>
              <input
                type="text"
                value={brandTerms.deliveryTimeline}
                onChange={(e) => setBrandTerms(prev => ({ ...prev, deliveryTimeline: e.target.value }))}
                placeholder="e.g., Assets 7 days before event"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Category Exclusivity (optional)</label>
              <input
                type="text"
                value={brandTerms.exclusivityTerms}
                onChange={(e) => setBrandTerms(prev => ({ ...prev, exclusivityTerms: e.target.value }))}
                placeholder="e.g., No competing brands in F&B category"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Content Rights (optional)</label>
              <input
                type="text"
                value={brandTerms.contentRights}
                onChange={(e) => setBrandTerms(prev => ({ ...prev, contentRights: e.target.value }))}
                placeholder="e.g., Usage rights for 6 months"
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
            Admin will review your response before delivering to the community
          </p>
          <button
            onClick={handleSubmitCounter}
            disabled={submitting}
            className="w-full py-4 hover:opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
          >
            <Send className="h-5 w-5" />
            {submitting ? 'Submitting...' : 'Submit Response to Community'}
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {renderModifyModal()}
    </div>
  );
};

export default BrandCounterForm;
