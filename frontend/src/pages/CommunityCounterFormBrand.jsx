import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, X, Edit, AlertCircle, Send, Eye } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import CounterPreviewPage from '../components/CounterPreviewPage';

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
    
    // If clicking Modify, set the action and open modal directly
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

  // Helper to render brand's proposal comment
  const renderProposalComment = (comment) => {
    if (!comment) return null;
    
    return (
      <div className="mt-2 bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
        <p className="text-purple-400 text-xs font-semibold mb-1">💬 BRAND NOTE:</p>
        <p className="text-white text-sm">{comment}</p>
      </div>
    );
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
    const proposalData = collaboration?.brandToCommunity || collaboration?.formData || {};
    const fieldMap = {
      campaignObjectives: proposalData.campaignObjectives,
      targetAudience: proposalData.targetAudience,
      preferredFormats: proposalData.preferredFormats,
      city: proposalData.city,
      timeline: proposalData.timeline,
      cashOffer: proposalData.brandOffers?.cash,
      barterOffer: proposalData.brandOffers?.barter,
      coMarketingOffer: proposalData.brandOffers?.coMarketing,
      contentOffer: proposalData.brandOffers?.content,
      brandingExpectation: proposalData.brandExpectations?.branding,
      speakingExpectation: proposalData.brandExpectations?.speaking,
      sponsoredSegmentExpectation: proposalData.brandExpectations?.sponsoredSegment,
      leadCaptureExpectation: proposalData.brandExpectations?.leadCapture,
      digitalShoutoutsExpectation: proposalData.brandExpectations?.digitalShoutouts,
      exclusivityExpectation: proposalData.brandExpectations?.exclusivity,
      contentRightsExpectation: proposalData.brandExpectations?.contentRights,
      salesBoothExpectation: proposalData.brandExpectations?.salesBooth
    };
    return fieldMap[fieldName];
  };

  const handlePreviewSubmission = () => {
    const requiredFields = ['campaignObjectives', 'targetAudience'];
    const missingResponses = requiredFields.filter(field => !fieldResponses[field]);
    
    if (missingResponses.length > 0) {
      alert(`Please respond to all required fields before previewing: ${missingResponses.join(', ')}`);
      return;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowPreview(true);
  };

  const getPreviewSections = () => {
    const proposalData = collaboration?.brandToCommunity || collaboration?.formData || {};
    
    const campaignFields = [
      { key: 'campaignObjectives', label: 'Campaign Objectives', originalValue: proposalData.campaignObjectives },
      { key: 'targetAudience', label: 'Target Audience', originalValue: proposalData.targetAudience },
      { key: 'preferredFormats', label: 'Preferred Formats', originalValue: proposalData.preferredFormats },
      { key: 'city', label: 'City', originalValue: proposalData.city },
      { key: 'timeline', label: 'Timeline', originalValue: proposalData.timeline }
    ].filter(f => f.originalValue);

    const offerFields = [
      { key: 'cashOffer', label: 'Cash Sponsorship', originalValue: proposalData.brandOffers?.cash },
      { key: 'barterOffer', label: 'Barter / Products', originalValue: proposalData.brandOffers?.barter },
      { key: 'coMarketingOffer', label: 'Co-Marketing', originalValue: proposalData.brandOffers?.coMarketing },
      { key: 'contentOffer', label: 'Content Support', originalValue: proposalData.brandOffers?.content }
    ].filter(f => f.originalValue?.selected);

    const expectationFields = [
      { key: 'brandingExpectation', label: 'Branding / Logo Placement', originalValue: proposalData.brandExpectations?.branding },
      { key: 'speakingExpectation', label: 'Sponsored Segment / Exclusive Naming Rights', originalValue: proposalData.brandExpectations?.speaking },
      { key: 'leadCaptureExpectation', label: 'Lead Capture / Registration Data', originalValue: proposalData.brandExpectations?.leadCapture },
      { key: 'digitalShoutoutsExpectation', label: 'Digital Shoutouts', originalValue: proposalData.brandExpectations?.digitalShoutouts },
      { key: 'exclusivityExpectation', label: 'Category Exclusivity', originalValue: proposalData.brandExpectations?.exclusivity },
      { key: 'contentRightsExpectation', label: 'Content Rights', originalValue: proposalData.brandExpectations?.contentRights },
      { key: 'salesBoothExpectation', label: 'Sales Booth / Sampling Rights', originalValue: proposalData.brandExpectations?.salesBooth }
    ].filter(f => f.originalValue?.selected);

    return [
      { title: 'CAMPAIGN SNAPSHOT', fields: campaignFields },
      { title: 'BRAND OFFERS', fields: offerFields },
      { title: 'BRAND EXPECTATIONS', fields: expectationFields }
    ];
  };

  const handleSubmitCounter = async () => {
    const requiredFields = ['campaignObjectives', 'targetAudience'];
    const missingResponses = requiredFields.filter(field => !fieldResponses[field]);
    
    if (missingResponses.length > 0) {
      alert(`Please respond to all required fields: ${missingResponses.join(', ')}`);
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
        
        {/* Show modified value display if Modify is selected */}
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

    const proposalData = collaboration?.brandToCommunity || collaboration?.formData || {};

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
            {currentField === 'speakingExpectation' && 'Sponsored Segment / Exclusive Naming Rights'}
            {currentField === 'leadCaptureExpectation' && 'Lead Capture / Registration Data'}
            {currentField === 'exclusivityExpectation' && 'Exclusivity'}
            {currentField === 'contentRightsExpectation' && 'Content Rights'}
          </h3>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">BRAND PROPOSED</p>
            <p className="text-white">
              {currentField === 'campaignObjectives' && proposalData.campaignObjectives?.join(', ')}
              {currentField === 'targetAudience' && proposalData.targetAudience}
              {currentField === 'preferredFormats' && proposalData.preferredFormats?.join(', ')}
              {currentField === 'cashOffer' && `₹${proposalData.brandOffers?.cash?.value || 'Not specified'}`}
              {currentField === 'barterOffer' && proposalData.brandOffers?.barter?.value}
              {currentField === 'coMarketingOffer' && proposalData.brandOffers?.coMarketing?.value}
              {currentField === 'contentOffer' && proposalData.brandOffers?.content?.value}
              {currentField.includes('Expectation') && 'Brand expectation described'}
            </p>
          </div>

          {/* Campaign Objectives */}
          {currentField === 'campaignObjectives' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select objectives you can deliver:</p>
              <div className="space-y-2">
                {[
                  { id: 'brand_awareness', label: 'Brand Awareness' },
                  { id: 'product_trials', label: 'Product Trials' },
                  { id: 'lead_generation', label: 'Lead Generation' },
                  { id: 'sales', label: 'Direct Sales' },
                  { id: 'engagement', label: 'Community Engagement' }
                ].map(objective => {
                  const currentValue = (typeof modifyValue === 'object' && modifyValue !== null && !Array.isArray(modifyValue)) ? modifyValue : {};
                  const isSelected = currentValue[objective.id] === true;
                  return (
                    <button
                      key={objective.id}
                      onClick={() => {
                        const updated = { ...currentValue };
                        if (isSelected) {
                          delete updated[objective.id];
                        } else {
                          updated[objective.id] = true;
                        }
                        setModifyValue(updated);
                      }}
                      className={`w-full py-3 px-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-yellow-900/20 text-yellow-400 border-yellow-600'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                      }`}
                    >
                      {objective.label}
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
              <p className="text-sm text-gray-400 mb-3">Brand proposed formats:</p>
              {proposalData.preferredFormats && Array.isArray(proposalData.preferredFormats) && proposalData.preferredFormats.length > 0 && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S PREFERRED FORMATS:</p>
                  <div className="text-white text-sm space-y-1">
                    {proposalData.preferredFormats.map((format, idx) => (
                      <p key={idx}>• {format}</p>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Select formats you can support:</p>
              <div className="grid grid-cols-2 gap-3">
                {['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'].map(format => {
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
                          ? 'bg-yellow-900/20 text-yellow-400 border-yellow-600'
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

          {/* City */}
          {currentField === 'city' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Brand proposed city:</p>
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

          {/* Timeline */}
          {currentField === 'timeline' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Brand proposed timeline:</p>
              {proposalData.timeline && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S TIMELINE:</p>
                  <div className="text-white text-sm space-y-1">
                    {(() => {
                      const sd = proposalData.timeline.startDate;
                      const sdDate = typeof sd === 'object' ? sd?.date : sd;
                      const sdStart = typeof sd === 'object' ? sd?.startTime : '';
                      const sdEnd = typeof sd === 'object' ? sd?.endTime : '';
                      if (!sdDate) return null;
                      return (
                        <p>• Start: {new Date(sdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {sdStart && ` • ${sdStart}`}{sdEnd && ` - ${sdEnd}`}
                        </p>
                      );
                    })()}
                    {(() => {
                      const ed = proposalData.timeline.endDate;
                      const edDate = typeof ed === 'object' ? ed?.date : ed;
                      const edStart = typeof ed === 'object' ? ed?.startTime : '';
                      const edEnd = typeof ed === 'object' ? ed?.endTime : '';
                      if (!edDate) return null;
                      return (
                        <p>• End: {new Date(edDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {edStart && ` • ${edStart}`}{edEnd && ` - ${edEnd}`}
                        </p>
                      );
                    })()}
                    {proposalData.timeline.flexible && (
                      <p className="text-green-400">• Flexible on dates</p>
                    )}
                  </div>
                  {proposalData.backupTimeline?.startDate?.date && (
                    <div className="text-white text-sm space-y-1 mt-2 border-t border-blue-700/50 pt-2">
                      <p className="text-blue-400 text-xs">BACKUP TIMELINE:</p>
                      <p>• Start: {new Date(proposalData.backupTimeline.startDate.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {proposalData.backupTimeline.startDate.startTime && ` • ${proposalData.backupTimeline.startDate.startTime}`}
                        {proposalData.backupTimeline.startDate.endTime && ` - ${proposalData.backupTimeline.startDate.endTime}`}
                      </p>
                      {proposalData.backupTimeline.endDate?.date && (
                        <p>• End: {new Date(proposalData.backupTimeline.endDate.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {proposalData.backupTimeline.endDate.startTime && ` • ${proposalData.backupTimeline.endDate.startTime}`}
                          {proposalData.backupTimeline.endDate.endTime && ` - ${proposalData.backupTimeline.endDate.endTime}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Your preferred timeline:</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">DATE</label>
                      <input
                        type="date"
                        value={typeof modifyValue?.startDate === 'object' ? modifyValue?.startDate?.date || '' : modifyValue?.startDate || ''}
                        onChange={(e) => {
                          const current = typeof modifyValue?.startDate === 'object' ? modifyValue.startDate : { date: modifyValue?.startDate || '', startTime: '', endTime: '' };
                          setModifyValue({ ...modifyValue, startDate: { ...current, date: e.target.value } });
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">START TIME</label>
                      <input
                        type="time"
                        value={typeof modifyValue?.startDate === 'object' ? modifyValue?.startDate?.startTime || '' : ''}
                        onChange={(e) => {
                          const current = typeof modifyValue?.startDate === 'object' ? modifyValue.startDate : { date: modifyValue?.startDate || '', startTime: '', endTime: '' };
                          setModifyValue({ ...modifyValue, startDate: { ...current, startTime: e.target.value } });
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">END TIME</label>
                      <input
                        type="time"
                        value={typeof modifyValue?.startDate === 'object' ? modifyValue?.startDate?.endTime || '' : ''}
                        onChange={(e) => {
                          const current = typeof modifyValue?.startDate === 'object' ? modifyValue.startDate : { date: modifyValue?.startDate || '', startTime: '', endTime: '' };
                          setModifyValue({ ...modifyValue, startDate: { ...current, endTime: e.target.value } });
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">End Date</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">DATE</label>
                      <input
                        type="date"
                        value={typeof modifyValue?.endDate === 'object' ? modifyValue?.endDate?.date || '' : modifyValue?.endDate || ''}
                        onChange={(e) => {
                          const current = typeof modifyValue?.endDate === 'object' ? modifyValue.endDate : { date: modifyValue?.endDate || '', startTime: '', endTime: '' };
                          setModifyValue({ ...modifyValue, endDate: { ...current, date: e.target.value } });
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">START TIME</label>
                      <input
                        type="time"
                        value={typeof modifyValue?.endDate === 'object' ? modifyValue?.endDate?.startTime || '' : ''}
                        onChange={(e) => {
                          const current = typeof modifyValue?.endDate === 'object' ? modifyValue.endDate : { date: modifyValue?.endDate || '', startTime: '', endTime: '' };
                          setModifyValue({ ...modifyValue, endDate: { ...current, startTime: e.target.value } });
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">END TIME</label>
                      <input
                        type="time"
                        value={typeof modifyValue?.endDate === 'object' ? modifyValue?.endDate?.endTime || '' : ''}
                        onChange={(e) => {
                          const current = typeof modifyValue?.endDate === 'object' ? modifyValue.endDate : { date: modifyValue?.endDate || '', startTime: '', endTime: '' };
                          setModifyValue({ ...modifyValue, endDate: { ...current, endTime: e.target.value } });
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={modifyValue?.flexible || false}
                    onChange={(e) => setModifyValue({ ...modifyValue, flexible: e.target.checked })}
                    className="rounded"
                  />
                  Flexible on dates
                </label>
              </div>
            </div>
          )}

          {/* Cash/Barter/CoMarketing/Content Offers - Show sub-options */}
          {currentField === 'cashOffer' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand proposed:</p>
              {proposalData.brandOffers?.cash && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S OFFER:</p>
                  <p className="text-white text-sm">• Cash: ₹{proposalData.brandOffers.cash.value}</p>
                  {proposalData.brandOffers.cash.subOptions && Object.keys(proposalData.brandOffers.cash.subOptions).length > 0 && (
                    <div className="text-white text-sm space-y-1 mt-2">
                      {Object.entries(proposalData.brandOffers.cash.subOptions).map(([key, value]) => (
                        value && value.selected && (
                          <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}
              {proposalData.brandOffers?.cash?.subOptions && Object.keys(proposalData.brandOffers.cash.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which payment terms you can agree to:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandOffers.cash.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Your counter-offer or additional notes:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., Need ₹100,000 to cover venue costs..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'barterOffer' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand proposed:</p>
              {proposalData.brandOffers?.barter && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S OFFER:</p>
                  <p className="text-white text-sm">• {proposalData.brandOffers.barter.value}</p>
                  {proposalData.brandOffers.barter.subOptions && Object.keys(proposalData.brandOffers.barter.subOptions).length > 0 && (
                    <div className="text-white text-sm space-y-1 mt-2">
                      {Object.entries(proposalData.brandOffers.barter.subOptions).map(([key, value]) => (
                        value && value.selected && (
                          <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}
              {proposalData.brandOffers?.barter?.subOptions && Object.keys(proposalData.brandOffers.barter.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which barter items you can accept:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandOffers.barter.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Your counter-offer or additional notes:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., Need 500 units instead of 300..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'coMarketingOffer' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand proposed:</p>
              {proposalData.brandOffers?.coMarketing && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S OFFER:</p>
                  <p className="text-white text-sm">• {proposalData.brandOffers.coMarketing.value}</p>
                  {proposalData.brandOffers.coMarketing.subOptions && Object.keys(proposalData.brandOffers.coMarketing.subOptions).length > 0 && (
                    <div className="text-white text-sm space-y-1 mt-2">
                      {Object.entries(proposalData.brandOffers.coMarketing.subOptions).map(([key, value]) => (
                        value && value.selected && (
                          <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}
              {proposalData.brandOffers?.coMarketing?.subOptions && Object.keys(proposalData.brandOffers.coMarketing.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which co-marketing activities you can support:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandOffers.coMarketing.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Your counter-offer or additional notes:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., Need social media support only..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'contentOffer' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand proposed:</p>
              {proposalData.brandOffers?.content && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S OFFER:</p>
                  <p className="text-white text-sm">• {proposalData.brandOffers.content.value}</p>
                  {proposalData.brandOffers.content.subOptions && Object.keys(proposalData.brandOffers.content.subOptions).length > 0 && (
                    <div className="text-white text-sm space-y-1 mt-2">
                      {Object.entries(proposalData.brandOffers.content.subOptions).map(([key, value]) => (
                        value && value.selected && (
                          <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}
              {proposalData.brandOffers?.content?.subOptions && Object.keys(proposalData.brandOffers.content.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which content support you can utilize:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandOffers.content.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Your counter-offer or additional notes:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., Need professional videographer..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Brand Expectations - Show sub-options for each type */}
          {currentField === 'brandingExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.branding?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandExpectations.branding.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              {proposalData.brandExpectations?.branding?.subOptions && Object.keys(proposalData.brandExpectations.branding.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which branding options you can provide:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandExpectations.branding.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Additional notes or limitations:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Can provide digital only, no print..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'speakingExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.speaking?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandExpectations.speaking.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              {proposalData.brandExpectations?.speaking?.subOptions && Object.keys(proposalData.brandExpectations.speaking.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which speaking options you can provide:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandExpectations.speaking.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Additional notes or limitations:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Can provide 5-minute slot only..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'sponsoredSegmentExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.sponsoredSegment?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandExpectations.sponsoredSegment.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              {proposalData.brandExpectations?.sponsoredSegment?.subOptions && Object.keys(proposalData.brandExpectations.sponsoredSegment.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which sponsorship naming you can provide:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandExpectations.sponsoredSegment.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Additional notes or limitations:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Can provide integrated segment only..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'leadCaptureExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.leadCapture?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandExpectations.leadCapture.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              {proposalData.brandExpectations?.leadCapture?.subOptions && Object.keys(proposalData.brandExpectations.leadCapture.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which lead capture methods you can provide:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandExpectations.leadCapture.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Additional notes or limitations:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Can share email list post-event..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'digitalShoutoutsExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.digitalShoutouts?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandExpectations.digitalShoutouts.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              {proposalData.brandExpectations?.digitalShoutouts?.subOptions && Object.keys(proposalData.brandExpectations.digitalShoutouts.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which digital promotion you can provide:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandExpectations.digitalShoutouts.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Additional notes or limitations:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Instagram stories only, no feed posts..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'exclusivityExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.exclusivity && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <p className="text-white text-sm">• {proposalData.brandExpectations.exclusivity.value}</p>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-3">Clarify what you can provide:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., Category exclusivity only..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'contentRightsExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.contentRights?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandExpectations.contentRights.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              {proposalData.brandExpectations?.contentRights?.subOptions && Object.keys(proposalData.brandExpectations.contentRights.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which content rights you can grant:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandExpectations.contentRights.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Additional notes or limitations:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Non-exclusive rights only..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {currentField === 'salesBoothExpectation' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What brand expects:</p>
              {proposalData.brandExpectations?.salesBooth?.subOptions && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-400 text-xs mb-2">BRAND'S EXPECTATIONS:</p>
                  <div className="text-white text-sm space-y-1">
                    {Object.entries(proposalData.brandExpectations.salesBooth.subOptions).map(([key, value]) => (
                      value && value.selected && (
                        <p key={key}>• {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
              {proposalData.brandExpectations?.salesBooth?.subOptions && Object.keys(proposalData.brandExpectations.salesBooth.subOptions).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Select which booth options you can provide:</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(proposalData.brandExpectations.salesBooth.subOptions)
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
              <p className="text-sm text-gray-400 mb-3">Additional notes or limitations:</p>
              <textarea
                value={typeof modifyValue === 'string' ? modifyValue : ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={3}
                placeholder="e.g., Can provide 10x10 booth space only..."
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
              className="flex-1 py-3 hover:opacity-90 text-white rounded-lg font-medium transition-colors"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
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

  const formData = collaboration.brandToCommunity || collaboration.formData || {};
  const initiatorName = collaboration.initiator?.name || 'Unknown Brand';

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
          submitLabel="Submit Response to Brand"
          proposerName={`${initiatorName}`}
          subtitle="Please review all your responses before submitting to the brand"
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
              <h2 className="text-xl font-bold">CAMPAIGN SNAPSHOT</h2>
              <p className="text-sm text-gray-400">Review brand's campaign goals</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Campaign Objectives</h3>
            <p className="text-sm text-gray-400 mb-2">BRAND WANTS TO ACHIEVE</p>
            <p className="text-white mb-1">
              {Array.isArray(formData.campaignObjectives) 
                ? formData.campaignObjectives.join(', ') 
                : typeof formData.campaignObjectives === 'object'
                  ? Object.keys(formData.campaignObjectives).filter(key => formData.campaignObjectives[key]).join(', ')
                  : formData.campaignObjectives}
            </p>
            {fieldResponses.campaignObjectives?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                You can deliver: {Array.isArray(fieldResponses.campaignObjectives?.modifiedValue) 
                  ? fieldResponses.campaignObjectives?.modifiedValue?.join(', ')
                  : fieldResponses.campaignObjectives?.modifiedValue}
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
              <p className="text-white mb-1">{Array.isArray(formData.preferredFormats) ? formData.preferredFormats?.join(', ') : formData.preferredFormats}</p>
              {fieldResponses.preferredFormats?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Formats you support: {Array.isArray(fieldResponses.preferredFormats?.modifiedValue) 
                    ? fieldResponses.preferredFormats?.modifiedValue?.join(', ')
                    : fieldResponses.preferredFormats?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('preferredFormats')}
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

          {/* Timeline */}
          {formData.timeline && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Preferred Timeline</h3>
              <p className="text-sm text-gray-400 mb-2">DATE RANGE</p>
              <div className="text-white space-y-1">
                {(() => {
                  const sd = formData.timeline.startDate;
                  const sdDate = typeof sd === 'object' ? sd?.date : sd;
                  const sdStartTime = typeof sd === 'object' ? sd?.startTime : '';
                  const sdEndTime = typeof sd === 'object' ? sd?.endTime : '';
                  if (!sdDate) return null;
                  return (
                    <p>Start: {new Date(sdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {sdStartTime && ` • ${sdStartTime}`}{sdEndTime && ` - ${sdEndTime}`}
                    </p>
                  );
                })()}
                {(() => {
                  const ed = formData.timeline.endDate;
                  const edDate = typeof ed === 'object' ? ed?.date : ed;
                  const edStartTime = typeof ed === 'object' ? ed?.startTime : '';
                  const edEndTime = typeof ed === 'object' ? ed?.endTime : '';
                  if (!edDate) return null;
                  return (
                    <p>End: {new Date(edDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {edStartTime && ` • ${edStartTime}`}{edEndTime && ` - ${edEndTime}`}
                    </p>
                  );
                })()}
                {formData.timeline.flexible && (
                  <p className="text-green-400 text-sm">✓ Flexible on dates</p>
                )}
              </div>
              {formData.backupTimeline?.startDate?.date && (
                <div className="mt-2 text-white space-y-1">
                  <p className="text-gray-400 text-sm">Backup Timeline:</p>
                  <p>Start: {new Date(formData.backupTimeline.startDate.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {formData.backupTimeline.startDate.startTime && ` • ${formData.backupTimeline.startDate.startTime}`}
                    {formData.backupTimeline.startDate.endTime && ` - ${formData.backupTimeline.startDate.endTime}`}
                  </p>
                  {formData.backupTimeline.endDate?.date && (
                    <p>End: {new Date(formData.backupTimeline.endDate.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {formData.backupTimeline.endDate.startTime && ` • ${formData.backupTimeline.endDate.startTime}`}
                      {formData.backupTimeline.endDate.endTime && ` - ${formData.backupTimeline.endDate.endTime}`}
                    </p>
                  )}
                </div>
              )}
              {fieldResponses.timeline?.action === 'modify' && (
                <div className="text-yellow-400 text-sm mt-2 space-y-1">
                  <p className="font-semibold">Your preferred timeline:</p>
                  {(() => {
                    const mv = fieldResponses.timeline.modifiedValue;
                    const msd = mv?.startDate;
                    const msdDate = typeof msd === 'object' ? msd?.date : msd;
                    const msdStart = typeof msd === 'object' ? msd?.startTime : '';
                    const msdEnd = typeof msd === 'object' ? msd?.endTime : '';
                    if (!msdDate) return null;
                    return (
                      <p>• Start: {new Date(msdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {msdStart && ` • ${msdStart}`}{msdEnd && ` - ${msdEnd}`}
                      </p>
                    );
                  })()}
                  {(() => {
                    const mv = fieldResponses.timeline.modifiedValue;
                    const med = mv?.endDate;
                    const medDate = typeof med === 'object' ? med?.date : med;
                    const medStart = typeof med === 'object' ? med?.startTime : '';
                    const medEnd = typeof med === 'object' ? med?.endTime : '';
                    if (!medDate) return null;
                    return (
                      <p>• End: {new Date(medDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {medStart && ` • ${medStart}`}{medEnd && ` - ${medEnd}`}
                      </p>
                    );
                  })()}
                  {fieldResponses.timeline?.modifiedValue?.flexible && (
                    <p>• Flexible on dates</p>
                  )}
                </div>
              )}
              {renderFieldActionButtons('timeline')}
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
              <p className="text-white mb-1">₹{formData.brandOffers.cash.value || 'Not specified'}</p>
              {formatSubOptions(formData.brandOffers.cash.subOptions) && (
                <p className="text-white text-sm mt-1">Details: {formatSubOptions(formData.brandOffers.cash.subOptions)}</p>
              )}
              {renderProposalComment(formData.brandOffers.cash.comment)}
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
              <p className="text-white mb-1">{formData.brandOffers.barter.value || 'Not specified'}</p>
              {formatSubOptions(formData.brandOffers.barter.subOptions) && (
                <p className="text-white text-sm mt-1">Details: {formatSubOptions(formData.brandOffers.barter.subOptions)}</p>
              )}
              {renderProposalComment(formData.brandOffers.barter.comment)}
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
              <p className="text-white mb-1">{formData.brandOffers.coMarketing.value || 'Not specified'}</p>
              {formatSubOptions(formData.brandOffers.coMarketing.subOptions) && (
                <p className="text-white text-sm mt-1">Details: {formatSubOptions(formData.brandOffers.coMarketing.subOptions)}</p>
              )}
              {renderProposalComment(formData.brandOffers.coMarketing.comment)}
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
              <p className="text-white mb-1">{formData.brandOffers.content.value || 'Not specified'}</p>
              {formatSubOptions(formData.brandOffers.content.subOptions) && (
                <p className="text-white text-sm mt-1">Details: {formatSubOptions(formData.brandOffers.content.subOptions)}</p>
              )}
              {renderProposalComment(formData.brandOffers.content.comment)}
              {fieldResponses.contentOffer?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your needs: {fieldResponses.contentOffer?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('contentOffer')}
            </div>
          )}

          {formData.brandOffers?.speaking?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Speaking / Brand Integration</h3>
              <p className="text-sm text-gray-400 mb-2">OFFERED</p>
              <p className="text-white mb-1">{formData.brandOffers.speaking.value || 'Brand integration requested'}</p>
              {formatSubOptions(formData.brandOffers.speaking.subOptions) && (
                <p className="text-white text-sm mt-1">Details: {formatSubOptions(formData.brandOffers.speaking.subOptions)}</p>
              )}
              {renderProposalComment(formData.brandOffers.speaking.comment)}
              {fieldResponses.speakingOffer?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your arrangement: {fieldResponses.speakingOffer?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('speakingOffer')}
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
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandExpectations.branding.subOptions) || 'Logo placement and branding requested'}
              </p>
              {renderProposalComment(formData.brandExpectations.branding.comment)}
              {fieldResponses.brandingExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.brandingExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('brandingExpectation')}
            </div>
          )}

          {formData.brandExpectations?.speaking?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Speaking Slot</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandExpectations.speaking.subOptions) || 'Speaking opportunity requested'}
              </p>
              {renderProposalComment(formData.brandExpectations.speaking.comment)}
              {fieldResponses.speakingExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.speakingExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('speakingExpectation')}
            </div>
          )}

          {formData.brandExpectations?.sponsoredSegment?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sponsored Segment</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandExpectations.sponsoredSegment.subOptions) || 'Sponsored segment requested'}
              </p>
              {renderProposalComment(formData.brandExpectations.sponsoredSegment.comment)}
              {fieldResponses.sponsoredSegmentExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.sponsoredSegmentExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('sponsoredSegmentExpectation')}
            </div>
          )}

          {formData.brandExpectations?.leadCapture?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Lead Capture</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandExpectations.leadCapture.subOptions) || 'Lead capture requested'}
              </p>
              {renderProposalComment(formData.brandExpectations.leadCapture.comment)}
              {fieldResponses.leadCaptureExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.leadCaptureExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('leadCaptureExpectation')}
            </div>
          )}

          {formData.brandExpectations?.digitalShoutouts?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Digital Shoutouts</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandExpectations.digitalShoutouts.subOptions) || 'Digital promotion requested'}
              </p>
              {renderProposalComment(formData.brandExpectations.digitalShoutouts.comment)}
              {fieldResponses.digitalShoutoutsExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.digitalShoutoutsExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('digitalShoutoutsExpectation')}
            </div>
          )}

          {formData.brandExpectations?.exclusivity?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Category Exclusivity</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white text-sm mb-2">Category exclusivity requested</p>
              {renderProposalComment(formData.brandExpectations.exclusivity.comment)}
              {fieldResponses.exclusivityExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  Your terms: {fieldResponses.exclusivityExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('exclusivityExpectation')}
            </div>
          )}

          {formData.brandExpectations?.contentRights?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Content Rights</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandExpectations.contentRights.subOptions) || 'Content usage rights requested'}
              </p>
              {renderProposalComment(formData.brandExpectations.contentRights.comment)}
              {fieldResponses.contentRightsExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.contentRightsExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('contentRightsExpectation')}
            </div>
          )}

          {formData.brandExpectations?.salesBooth?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sales Booth / Sampling Rights</h3>
              <p className="text-sm text-gray-400 mb-2">BRAND EXPECTS</p>
              <p className="text-white text-sm mb-2">
                {formatSubOptions(formData.brandExpectations.salesBooth.subOptions) || 'Sales booth setup requested'}
              </p>
              {renderProposalComment(formData.brandExpectations.salesBooth.comment)}
              {fieldResponses.salesBoothExpectation?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.salesBoothExpectation?.modifiedValue}
                </p>
              )}
              {renderFieldActionButtons('salesBoothExpectation')}
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

export default CommunityCounterFormBrand;
