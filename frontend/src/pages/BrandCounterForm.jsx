import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, X, Edit, AlertCircle, Send, Eye } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import CounterPreviewPage from '../components/CounterPreviewPage';

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
  
  const [showPreview, setShowPreview] = useState(false);
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
      
      console.log('Loaded brand collaboration for counter form:', collab);
      console.log('Community to Brand data:', collab.communityToBrand);
      console.log('Form data (fallback):', collab.formData);
      
      if (collab.type !== 'communityToBrand') {
        setError('This form is only for brand responses to community sponsorship requests');
        return;
      }
      
      // Use structured schema (communityToBrand) with formData as fallback
      const proposalData = collab.communityToBrand || collab.formData;
      if (!proposalData) {
        console.warn('WARNING: No proposal data found in collaboration');
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
    const currentAction = fieldResponses[fieldName]?.action;
    
    // If clicking the same action, deselect it
    if (currentAction === action) {
      setFieldResponses(prev => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
      return;
    }
    
    // If clicking Modify, open modal directly
    if (action === 'modify') {
      setFieldResponses(prev => ({
        ...prev,
        [fieldName]: {
          action,
          originalValue: getOriginalValue(fieldName),
          note: prev[fieldName]?.note || '',
          modifiedValue: prev[fieldName]?.modifiedValue || null
        }
      }));
      openModifyModal(fieldName);
      return;
    }
    
    // For Accept or Decline
    setFieldResponses(prev => ({
      ...prev,
      [fieldName]: {
        action,
        originalValue: getOriginalValue(fieldName),
        note: prev[fieldName]?.note || '',
        modifiedValue: prev[fieldName]?.modifiedValue || null
      }
    }));
  };

  const openModifyModal = (fieldName) => {
    setCurrentField(fieldName);
    setModifyValue(fieldResponses[fieldName]?.modifiedValue || null);
    setFieldNote(fieldResponses[fieldName]?.note || '');
    setShowModifyModal(true);
  };

  // Helper to format subOptions into readable string
  const formatSubOptions = (subOptions) => {
    if (!subOptions || typeof subOptions !== 'object') return null;
    
    // Check if subOptions follow the {option: {selected: true}} pattern
    const selectedOptions = Object.entries(subOptions)
      .filter(([key, value]) => value && value.selected === true)
      .map(([key]) => {
        // Convert snake_case to Title Case
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      });
    
    return selectedOptions.length > 0 ? selectedOptions.join(', ') : null;
  };

  // Helper to render community's proposal comment
  const renderProposalComment = (comment) => {
    if (!comment) return null;
    
    return (
      <div className="mt-2 bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
        <p className="text-blue-400 text-xs font-semibold mb-1">💬 COMMUNITY NOTE:</p>
        <p className="text-white text-sm">{comment}</p>
      </div>
    );
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
    const proposalData = collaboration?.communityToBrand || collaboration?.formData || {};
    const fieldMap = {
      eventCategory: proposalData.eventCategory,
      expectedAttendees: proposalData.expectedAttendees,
      targetAudience: proposalData.targetAudience,
      eventDate: proposalData.eventDate,
      city: proposalData.city,
      eventFormat: proposalData.eventFormat,
      nicheAudienceDetails: proposalData.nicheAudienceDetails,
      logoPlacement: proposalData.brandDeliverables?.logoPlacement,
      onGroundBranding: proposalData.brandDeliverables?.onGroundBranding,
      sampling: proposalData.brandDeliverables?.sampling,
      sponsoredSegments: proposalData.brandDeliverables?.sponsoredSegments,
      digitalShoutouts: proposalData.brandDeliverables?.digitalShoutouts,
      leadCapture: proposalData.brandDeliverables?.leadCapture,
      commercialModel: proposalData.pricing
    };
    return fieldMap[fieldName];
  };

  const handlePreviewSubmission = () => {
    const requiredFields = ['eventCategory', 'expectedAttendees', 'commercialModel'];
    const missingResponses = requiredFields.filter(field => !fieldResponses[field]);
    
    if (missingResponses.length > 0) {
      alert(`Please respond to all required fields before previewing: ${missingResponses.join(', ')}`);
      return;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowPreview(true);
  };

  const getPreviewSections = () => {
    const proposalData = collaboration?.communityToBrand || collaboration?.formData || {};
    
    const eventFields = [
      { key: 'eventCategory', label: 'Event Category', originalValue: proposalData.eventCategory },
      { key: 'eventDate', label: 'Event Date', originalValue: proposalData.eventDate ? new Date(proposalData.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
      { key: 'city', label: 'City', originalValue: proposalData.city },
      { key: 'eventFormat', label: 'Event Format', originalValue: proposalData.eventFormat },
      { key: 'expectedAttendees', label: 'Expected Attendees / Reach', originalValue: proposalData.expectedAttendees },
      { key: 'targetAudience', label: 'Target Audience', originalValue: proposalData.targetAudience },
      { key: 'nicheAudienceDetails', label: 'Niche Audience Specification', originalValue: proposalData.nicheAudienceDetails }
    ].filter(f => f.originalValue);

    const deliverableFields = [
      { key: 'logoPlacement', label: 'Logo Placement', originalValue: proposalData.brandDeliverables?.logoPlacement },
      { key: 'onGroundBranding', label: 'On-Ground Branding', originalValue: proposalData.brandDeliverables?.onGroundBranding },
      { key: 'sampling', label: 'Product Sampling / Trials', originalValue: proposalData.brandDeliverables?.sampling },
      { key: 'sponsoredSegments', label: 'Sponsored Segment / Exclusive Naming Rights', originalValue: proposalData.brandDeliverables?.sponsoredSegments },
      { key: 'digitalShoutouts', label: 'Digital Shoutouts', originalValue: proposalData.brandDeliverables?.digitalShoutouts },
      { key: 'leadCapture', label: 'Lead Capture / Registration Data', originalValue: proposalData.brandDeliverables?.leadCapture }
    ].filter(f => f.originalValue?.selected);

    const commercialFields = [
      { key: 'commercialModel', label: 'Sponsorship Budget', originalValue: proposalData.pricing }
    ];

    return [
      { title: 'EVENT SNAPSHOT', fields: eventFields },
      { title: 'BRAND DELIVERABLES REQUESTED', fields: deliverableFields },
      { title: 'COMMERCIAL & BUDGET', fields: commercialFields }
    ];
  };

  const handleSubmitCounter = async () => {
    const requiredFields = ['eventCategory', 'expectedAttendees', 'commercialModel'];
    const missingResponses = requiredFields.filter(field => !fieldResponses[field]);
    
    if (missingResponses.length > 0) {
      alert(`Please respond to all required fields: ${missingResponses.join(', ')}`);
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
      
      alert('Counter-proposal submitted successfully! The community will review your response shortly.');
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
        
        {/* Show modified value confirmation if exists */}
        {action === 'modify' && response?.modifiedValue && (
          <div className="mt-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
            <p className="text-yellow-400 text-xs font-semibold mb-1">✓ MODIFIED DETAILS SAVED</p>
            <p className="text-white text-sm">{typeof response.modifiedValue === 'object' ? JSON.stringify(response.modifiedValue) : response.modifiedValue}</p>
          </div>
        )}
        
        {/* Optional note field for any action */}
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

    const proposalData = collaboration?.communityToBrand || collaboration?.formData || {};

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
              {currentField === 'eventCategory' && proposalData.eventCategory}
              {currentField === 'expectedAttendees' && proposalData.expectedAttendees}
              {currentField === 'targetAudience' && proposalData.targetAudience}
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
                {['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'].map(option => (
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
                {['20-40', '40-80', '80-150', '150+'].map(option => (
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
              <p className="text-sm text-gray-400 mb-3">Community proposed audience:</p>
              {proposalData.targetAudience && Array.isArray(proposalData.targetAudience) && proposalData.targetAudience.length > 0 && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">PROPOSED AUDIENCE:</p>
                  <div className="text-white text-sm space-y-1">
                    {proposalData.targetAudience.map((aud, idx) => (
                      <p key={idx}>• {aud}</p>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select which audience segments you can deliver:</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {['Students', 'Young professionals', 'Founders / Creators', 'Families', 'Niche community'].map(audience => {
                  const currentValue = modifyValue || [];
                  const isSelected = currentValue.includes(audience);
                  return (
                    <button
                      key={audience}
                      onClick={() => {
                        const updated = isSelected
                          ? currentValue.filter(a => a !== audience)
                          : [...currentValue, audience];
                        setModifyValue(updated);
                      }}
                      className={`py-3 px-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-yellow-600 border-yellow-400 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                      }`}
                    >
                      {audience}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-400 mb-2">Or provide custom audience description:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Tech professionals aged 25-35..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Event Date */}
          {currentField === 'eventDate' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Community proposed date:</p>
              {proposalData.eventDate && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">SCHEDULED DATE:</p>
                  <p className="text-white text-sm">{new Date(proposalData.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Your preferred date:</p>
              <input
                type="date"
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          )}

          {/* City */}
          {currentField === 'city' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Community proposed city:</p>
              {proposalData.city && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">PROPOSED CITY:</p>
                  <p className="text-white text-sm">{proposalData.city}</p>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Your preferred city:</p>
              <input
                type="text"
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                placeholder="e.g., Mumbai, Bangalore, Delhi..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          )}

          {/* Event Format */}
          {currentField === 'eventFormat' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Community proposed format:</p>
              {proposalData.eventFormat && Array.isArray(proposalData.eventFormat) && proposalData.eventFormat.length > 0 && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">PROPOSED FORMAT:</p>
                  <div className="text-white text-sm space-y-1">
                    {proposalData.eventFormat.map((format, idx) => (
                      <p key={idx}>• {format}</p>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select formats you can support:</p>
              <div className="grid grid-cols-2 gap-3">
                {['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation'].map(format => {
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

          {/* Niche Audience Details */}
          {currentField === 'nicheAudienceDetails' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Community proposed niche:</p>
              {proposalData.nicheAudienceDetails && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">PROPOSED NICHE:</p>
                  <p className="text-white text-sm">{proposalData.nicheAudienceDetails}</p>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Your niche specification:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., Tech enthusiasts, Creative professionals..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Deliverable Modifications - Show sub-options */}
          {currentField === 'logoPlacement' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What community proposed:</p>
              {proposalData.brandDeliverables?.logoPlacement?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">REQUESTED OPTIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandDeliverables.logoPlacement.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select which options you can provide:</p>
              <div className="space-y-2">
                {proposalData.brandDeliverables?.logoPlacement?.subOptions && Object.entries(proposalData.brandDeliverables.logoPlacement.subOptions)
                  .filter(([_, value]) => value && value.selected)
                  .map(([key, value]) => {
                    const currentValue = modifyValue || {};
                    const isSelected = currentValue[key] !== false;
                    return (
                      <label key={key} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => setModifyValue({...modifyValue, [key]: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600"
                        />
                        <span className="text-white">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {currentField === 'onGroundBranding' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What community proposed:</p>
              {proposalData.brandDeliverables?.onGroundBranding?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">REQUESTED OPTIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandDeliverables.onGroundBranding.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select which options you can provide:</p>
              <div className="space-y-2">
                {proposalData.brandDeliverables?.onGroundBranding?.subOptions && Object.entries(proposalData.brandDeliverables.onGroundBranding.subOptions)
                  .filter(([_, value]) => value && value.selected)
                  .map(([key, value]) => {
                    const currentValue = modifyValue || {};
                    const isSelected = currentValue[key] !== false;
                    return (
                      <label key={key} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => setModifyValue({...modifyValue, [key]: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600"
                        />
                        <span className="text-white">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {currentField === 'sampling' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What community proposed:</p>
              {proposalData.brandDeliverables?.sampling?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">REQUESTED OPTIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandDeliverables.sampling.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select which options you can provide:</p>
              <div className="space-y-2">
                {proposalData.brandDeliverables?.sampling?.subOptions && Object.entries(proposalData.brandDeliverables.sampling.subOptions)
                  .filter(([_, value]) => value && value.selected)
                  .map(([key, value]) => {
                    const currentValue = modifyValue || {};
                    const isSelected = currentValue[key] !== false;
                    return (
                      <label key={key} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => setModifyValue({...modifyValue, [key]: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600"
                        />
                        <span className="text-white">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {currentField === 'sponsoredSegments' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What community proposed:</p>
              {proposalData.brandDeliverables?.sponsoredSegments?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">REQUESTED OPTIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandDeliverables.sponsoredSegments.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select which options you can provide:</p>
              <div className="space-y-2">
                {proposalData.brandDeliverables?.sponsoredSegments?.subOptions && Object.entries(proposalData.brandDeliverables.sponsoredSegments.subOptions)
                  .filter(([_, value]) => value && value.selected)
                  .map(([key, value]) => {
                    const currentValue = modifyValue || {};
                    const isSelected = currentValue[key] !== false;
                    return (
                      <label key={key} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => setModifyValue({...modifyValue, [key]: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600"
                        />
                        <span className="text-white">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {currentField === 'digitalShoutouts' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What community proposed:</p>
              {proposalData.brandDeliverables?.digitalShoutouts?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">REQUESTED OPTIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandDeliverables.digitalShoutouts.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select which options you can provide:</p>
              <div className="space-y-2">
                {proposalData.brandDeliverables?.digitalShoutouts?.subOptions && Object.entries(proposalData.brandDeliverables.digitalShoutouts.subOptions)
                  .filter(([_, value]) => value && value.selected)
                  .map(([key, value]) => {
                    const currentValue = modifyValue || {};
                    const isSelected = currentValue[key] !== false;
                    return (
                      <label key={key} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => setModifyValue({...modifyValue, [key]: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600"
                        />
                        <span className="text-white">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {currentField === 'leadCapture' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What community proposed:</p>
              {proposalData.brandDeliverables?.leadCapture?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">REQUESTED OPTIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandDeliverables.leadCapture.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select which options you can provide:</p>
              <div className="space-y-2">
                {proposalData.brandDeliverables?.leadCapture?.subOptions && Object.entries(proposalData.brandDeliverables.leadCapture.subOptions)
                  .filter(([_, value]) => value && value.selected)
                  .map(([key, value]) => {
                    const currentValue = modifyValue || {};
                    const isSelected = currentValue[key] !== false;
                    return (
                      <label key={key} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => setModifyValue({...modifyValue, [key]: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600"
                        />
                        <span className="text-white">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Commercial Model - Show pricing breakdown */}
          {currentField === 'commercialModel' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What community proposed:</p>
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg space-y-2">
                <p className="text-blue-400 text-xs mb-2">REQUESTED PRICING:</p>
                {proposalData.pricing?.cashSponsorship?.selected && (
                  <p className="text-white text-sm">• Cash Sponsorship: ₹{proposalData.pricing.cashSponsorship.value}</p>
                )}
                {proposalData.pricing?.barter?.selected && (
                  <p className="text-white text-sm">• Barter/In-Kind: {proposalData.pricing.barter.value}</p>
                )}
                {proposalData.pricing?.stallCost?.selected && (
                  <p className="text-white text-sm">• Stall Setup Cost: ₹{proposalData.pricing.stallCost.value}</p>
                )}
                {proposalData.pricing?.revenueShare?.selected && (
                  <p className="text-white text-sm">• Revenue Share: {proposalData.pricing.revenueShare.value}%</p>
                )}
              </div>
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

  const formData = collaboration.communityToBrand || collaboration.formData || {};
  const initiatorName = collaboration.initiator?.name || 'Unknown Community';

  // Preview mode
  if (showPreview) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBar />
        <CounterPreviewPage
          sections={getPreviewSections()}
          fieldResponses={fieldResponses}
          onBack={() => {
            setShowPreview(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSubmit={handleSubmitCounter}
          submitting={submitting}
          submitLabel="Submit Response to Community"
          proposerName={`${initiatorName}`}
          subtitle="Please review all your responses before submitting to the community"
        />
      </div>
    );
  }

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

          {/* Event Date */}
          {formData.eventDate && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Event Date</h3>
              <p className="text-sm text-gray-400 mb-2">SCHEDULED</p>
              <p className="text-white mb-1">{new Date(formData.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {fieldResponses.eventDate?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your preferred date: {fieldResponses.eventDate?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('eventDate')}
            </div>
          )}

          {/* City */}
          {formData.city && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">City</h3>
              <p className="text-sm text-gray-400 mb-2">LOCATION</p>
              <p className="text-white mb-1">{formData.city}</p>
              {fieldResponses.city?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your preferred city: {fieldResponses.city?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('city')}
            </div>
          )}

          {/* Event Format */}
          {formData.eventFormat && formData.eventFormat.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Event Format</h3>
              <p className="text-sm text-gray-400 mb-2">FORMAT TYPE</p>
              <p className="text-white mb-1">{Array.isArray(formData.eventFormat) ? formData.eventFormat.join(', ') : formData.eventFormat}</p>
              {fieldResponses.eventFormat?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your format: {Array.isArray(fieldResponses.eventFormat?.modifiedValue) ? fieldResponses.eventFormat?.modifiedValue.join(', ') : fieldResponses.eventFormat?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('eventFormat')}
            </div>
          )}

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
              <p className="text-white mb-1">{Array.isArray(formData.targetAudience) ? formData.targetAudience.join(', ') : formData.targetAudience}</p>
              {fieldResponses.targetAudience?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your target: {fieldResponses.targetAudience?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('targetAudience')}
            </div>
          )}

          {/* Niche Audience Details */}
          {formData.nicheAudienceDetails && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Niche Audience Specification</h3>
              <p className="text-sm text-gray-400 mb-2">ADDITIONAL DETAILS</p>
              <p className="text-white mb-1">{formData.nicheAudienceDetails}</p>
              {fieldResponses.nicheAudienceDetails?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your niche: {fieldResponses.nicheAudienceDetails?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('nicheAudienceDetails')}
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
              <p className="text-sm text-gray-400 mb-2">REQUESTED</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandDeliverables.logoPlacement.subOptions) || 'Logo placement on event materials'}
              </p>
              {renderProposalComment(formData.brandDeliverables.logoPlacement.comment)}
              {fieldResponses.logoPlacement?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You prefer: {fieldResponses.logoPlacement?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('logoPlacement')}
            </div>
          )}

          {formData.brandDeliverables?.onGroundBranding?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">On-Ground Branding</h3>
              <p className="text-sm text-gray-400 mb-2">REQUESTED</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandDeliverables.onGroundBranding.subOptions) || 'Physical branding at venue'}
              </p>
              {renderProposalComment(formData.brandDeliverables.onGroundBranding.comment)}
              {fieldResponses.onGroundBranding?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You prefer: {fieldResponses.onGroundBranding?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('onGroundBranding')}
            </div>
          )}

          {formData.brandDeliverables?.sampling?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sampling / Product Demo</h3>
              <p className="text-sm text-gray-400 mb-2">REQUESTED</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandDeliverables.sampling.subOptions) || 'Space for product sampling/demo'}
              </p>
              {renderProposalComment(formData.brandDeliverables.sampling.comment)}
              {fieldResponses.sampling?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You prefer: {fieldResponses.sampling?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('sampling')}
            </div>
          )}

          {formData.brandDeliverables?.sponsoredSegments?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sponsored Segments</h3>
              <p className="text-sm text-gray-400 mb-2">REQUESTED</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandDeliverables.sponsoredSegments.subOptions) || 'Dedicated segments during event'}
              </p>
              {renderProposalComment(formData.brandDeliverables.sponsoredSegments.comment)}
              {fieldResponses.sponsoredSegments?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You prefer: {fieldResponses.sponsoredSegments?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('sponsoredSegments')}
            </div>
          )}

          {formData.brandDeliverables?.digitalShoutouts?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Digital Shoutouts</h3>
              <p className="text-sm text-gray-400 mb-2">REQUESTED</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandDeliverables.digitalShoutouts.subOptions) || 'Online promotion and mentions'}
              </p>
              {renderProposalComment(formData.brandDeliverables.digitalShoutouts.comment)}
              {fieldResponses.digitalShoutouts?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You prefer: {fieldResponses.digitalShoutouts?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('digitalShoutouts')}
            </div>
          )}

          {formData.brandDeliverables?.leadCapture?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Lead Capture</h3>
              <p className="text-sm text-gray-400 mb-2">REQUESTED</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandDeliverables.leadCapture.subOptions) || 'Attendee information collection'}
              </p>
              {renderProposalComment(formData.brandDeliverables.leadCapture.comment)}
              {fieldResponses.leadCapture?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You prefer: {fieldResponses.leadCapture?.modifiedValue}
                </p>
              )}
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
            <div className="text-white mb-1 space-y-1">
              {formData.pricing?.cashSponsorship?.selected && (
                <div>
                  <p>Cash: ₹{formData.pricing.cashSponsorship.value || 'Not specified'}</p>
                  {renderProposalComment(formData.pricing.cashSponsorship.comment)}
                </div>
              )}
              {formData.pricing?.barter?.selected && (
                <div>
                  <p>Barter: {formData.pricing.barter.value || 'Not specified'}</p>
                  {renderProposalComment(formData.pricing.barter.comment)}
                </div>
              )}
              {formData.pricing?.stallCost?.selected && (
                <div>
                  <p>Stall Cost: ₹{formData.pricing.stallCost.value || 'Not specified'}</p>
                  {renderProposalComment(formData.pricing.stallCost.comment)}
                </div>
              )}
              {formData.pricing?.revenueShare?.selected && (
                <div>
                  <p>Revenue Share: {formData.pricing.revenueShare.value || 'Not specified'}</p>
                  {renderProposalComment(formData.pricing.revenueShare.comment)}
                </div>
              )}
              {formData.pricing?.additionalNotes && (
                <p className="text-gray-400 text-sm mt-2">Note: {formData.pricing.additionalNotes}</p>
              )}
            </div>
            {fieldResponses.commercialModel?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                Your counter: {fieldResponses.commercialModel?.modifiedValue}
              </p>
            )}
            {renderFieldActionButtons('commercialModel')}
          </div>
        </div>

        {/* Section 3.5: Audience Proof */}
        {formData.audienceProof && Object.values(formData.audienceProof).some(field => field?.selected) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
                📊
              </div>
              <div>
                <h2 className="text-xl font-bold">AUDIENCE PROOF & CREDIBILITY</h2>
                <p className="text-sm text-gray-400">Community-provided metrics</p>
              </div>
            </div>

            {formData.audienceProof.pastSponsorBrands?.selected && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Past Sponsor Brands</h3>
                <p className="text-sm text-gray-400 mb-2">PREVIOUS PARTNERSHIPS</p>
                <p className="text-white text-sm">{formData.audienceProof.pastSponsorBrands.value || 'Not specified'}</p>
              </div>
            )}

            {formData.audienceProof.averageAttendance?.selected && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Average Attendance</h3>
                <p className="text-sm text-gray-400 mb-2">TYPICAL REACH</p>
                <p className="text-white text-sm">{formData.audienceProof.averageAttendance.value || 'Not specified'}</p>
              </div>
            )}

            {formData.audienceProof.communitySize?.selected && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Community Size</h3>
                <p className="text-sm text-gray-400 mb-2">TOTAL FOLLOWING</p>
                <p className="text-white text-sm">{formData.audienceProof.communitySize.value || 'Not specified'}</p>
              </div>
            )}

            {formData.audienceProof.repeatEventRate?.selected && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Repeat Event Rate</h3>
                <p className="text-sm text-gray-400 mb-2">ATTENDEE LOYALTY</p>
                <p className="text-white text-sm">{formData.audienceProof.repeatEventRate.value || 'Not specified'}</p>
              </div>
            )}
          </div>
        )}

        {/* Section 3.6: Supporting Information */}
        {formData.supportingInfo && (formData.supportingInfo.images?.length > 0 || formData.supportingInfo.note) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
                📎
              </div>
              <div>
                <h2 className="text-xl font-bold">SUPPORTING INFORMATION</h2>
                <p className="text-sm text-gray-400">Additional materials from community</p>
              </div>
            </div>

            {formData.supportingInfo.images?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Event Visuals</h3>
                <p className="text-sm text-gray-400 mb-3">UPLOADED BY COMMUNITY</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.supportingInfo.images.map((imageUrl, index) => (
                    <a 
                      key={index} 
                      href={imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="aspect-video rounded-lg overflow-hidden border border-zinc-700 hover:border-purple-500 transition-colors"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Event visual ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Image+Unavailable';
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {formData.supportingInfo.note && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Additional Notes</h3>
                <p className="text-sm text-gray-400 mb-2">FROM COMMUNITY</p>
                <p className="text-white text-sm whitespace-pre-wrap">{formData.supportingInfo.note}</p>
              </div>
            )}
          </div>
        )}

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

        {/* Preview Submission Button */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 text-center mb-8">
          <h3 className="font-bold text-lg mb-2">READY TO RESPOND?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Preview your response before submitting
          </p>
          <button
            onClick={handlePreviewSubmission}
            className="w-full py-4 hover:opacity-90 text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
          >
            <Eye className="h-5 w-5" />
            Preview Submission
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {renderModifyModal()}
    </div>
  );
};

export default BrandCounterForm;
