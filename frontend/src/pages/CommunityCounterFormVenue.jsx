import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, X, Edit, AlertCircle, Send } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const CommunityCounterFormVenue = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collaboration, setCollaboration] = useState(null);
  const [error, setError] = useState(null);
  
  const [fieldResponses, setFieldResponses] = useState({});
  const [communityTerms, setCommunityTerms] = useState({
    expectedCapacity: '',
    eventFrequency: '',
    marketingCommitment: '',
    additionalRequirements: ''
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
      
      console.log('Loaded community counter form for venue proposal:', collab);
      console.log('Form data:', collab.formData);
      
      if (collab.type !== 'venueToCommunity') {
        setError('This form is only for community responses to venue proposals');
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
    if (!modifyValue && currentField !== 'commercialModels') {
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

    if (currentField === 'commercialModels') {
      setCommercialCounter(modifyValue);
    }

    setShowModifyModal(false);
    setCurrentField(null);
  };

  const getOriginalValue = (fieldName) => {
    const formData = collaboration?.formData || {};
    const fieldMap = {
      venueType: formData.venueType,
      capacityRange: formData.capacityRange,
      preferredEventFormats: formData.preferredEventFormats,
      spaceOffering: formData.venueOfferings?.space,
      avOffering: formData.venueOfferings?.av,
      furnitureOffering: formData.venueOfferings?.furniture,
      fnbOffering: formData.venueOfferings?.fnb,
      staffOffering: formData.venueOfferings?.staff,
      marketingOffering: formData.venueOfferings?.marketing,
      storageOffering: formData.venueOfferings?.storage,
      ticketingOffering: formData.venueOfferings?.ticketing,
      commercialModels: formData.commercialModels
    };
    return fieldMap[fieldName];
  };

  const handleSubmitCounter = async () => {
    const requiredFields = ['venueType', 'capacityRange', 'commercialModels'];
    const missingResponses = requiredFields.filter(field => !fieldResponses[field]);
    
    if (missingResponses.length > 0) {
      alert(`Please respond to all required fields: ${missingResponses.join(', ')}`);
      return;
    }

    if (!window.confirm('Submit counter-proposal? This will be reviewed by admin before being sent to the venue.')) {
      return;
    }

    try {
      setSubmitting(true);
      
      const counterData = {
        fieldResponses,
        communityTerms,
        commercialCounter,
        generalNotes
      };

      console.log('Submitting community counter:', counterData);
      
      const response = await api.post(`/collaborations/${id}/counter`, { counterData });
      
      alert('Counter-proposal submitted successfully! The venue will review your response shortly.');
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
            {currentField === 'venueType' && 'Venue Type'}
            {currentField === 'capacityRange' && 'Capacity Range'}
            {currentField === 'preferredEventFormats' && 'Preferred Event Formats'}
            {currentField === 'spaceOffering' && 'Space Offerings'}
            {currentField === 'avOffering' && 'AV Equipment'}
            {currentField === 'furnitureOffering' && 'Furniture'}
            {currentField === 'fnbOffering' && 'F&B Services'}
            {currentField === 'staffOffering' && 'Staff Support'}
            {currentField === 'marketingOffering' && 'Marketing Support'}
            {currentField === 'storageOffering' && 'Storage & Parking'}
            {currentField === 'ticketingOffering' && 'Ticketing Support'}
            {currentField === 'commercialModels' && 'Commercial Terms'}
          </h3>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">VENUE PROPOSED</p>
            <p className="text-white">
              {currentField === 'venueType' && formData.venueType}
              {currentField === 'capacityRange' && formData.capacityRange}
              {currentField === 'preferredEventFormats' && formData.preferredEventFormats?.join(', ')}
              {currentField.includes('Offering') && 'Venue offering included'}
              {currentField === 'commercialModels' && 'Commercial model offered'}
            </p>
          </div>

          {/* Venue Type */}
          {currentField === 'venueType' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select the type you need:</p>
              <div className="grid grid-cols-2 gap-3">
                {['Banquet Hall', 'Rooftop', 'Brewery/Bar', 'Outdoor Ground', 'Auditorium', 'Restaurant', 'Lounge', 'Gallery/Studio'].map(type => (
                  <button
                    key={type}
                    onClick={() => setModifyValue(type)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      modifyValue === type
                        ? 'bg-yellow-600 border-yellow-400 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Capacity Range */}
          {currentField === 'capacityRange' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select the capacity you need:</p>
              <div className="grid grid-cols-2 gap-3">
                {['50-100', '100-250', '250-500', '500-1000', '1000+'].map(range => (
                  <button
                    key={range}
                    onClick={() => setModifyValue(range)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      modifyValue === range
                        ? 'bg-yellow-600 border-yellow-400 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-600'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Event Formats */}
          {currentField === 'preferredEventFormats' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select formats you'll host:</p>
              <div className="grid grid-cols-2 gap-3">
                {['Concert/Music', 'Standup/Comedy', 'Networking', 'Workshop', 'Exhibition', 'Private Party', 'Festival', 'Conference'].map(format => {
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

          {/* Venue Offerings */}
          {currentField.includes('Offering') && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Specify what you need:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="Describe your requirements..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
          )}

          {/* Commercial Models */}
          {currentField === 'commercialModels' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Your counter commercial model:</p>
              <textarea
                value={modifyValue || ''}
                onChange={(e) => setModifyValue(e.target.value)}
                rows={4}
                placeholder="e.g., 60-40 revenue share with ₹10,000 minimum guarantee..."
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
  const initiatorName = collaboration.initiator?.name || 'Unknown Venue';

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
            {initiatorName} • Review venue partnership proposal
          </p>
        </div>

        {/* Section 1: Venue Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              1
            </div>
            <div>
              <h2 className="text-xl font-bold">VENUE SPECIFICATIONS</h2>
              <p className="text-sm text-gray-400">Review venue details</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Venue Type</h3>
            <p className="text-sm text-gray-400 mb-2">OFFERED</p>
            <p className="text-white mb-1">{formData.venueType}</p>
            {fieldResponses.venueType?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                You need: {fieldResponses.venueType?.modifiedValue}
              </p>
            )}
            {renderFieldActionButtons('venueType')}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Capacity Range</h3>
            <p className="text-sm text-gray-400 mb-2">OFFERED</p>
            <p className="text-white mb-1">{formData.capacityRange}</p>
            {fieldResponses.capacityRange?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                You need: {fieldResponses.capacityRange?.modifiedValue}
              </p>
            )}
            {renderFieldActionButtons('capacityRange')}
          </div>

          {formData.preferredEventFormats && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Preferred Event Formats</h3>
              <p className="text-sm text-gray-400 mb-2">VENUE PREFERS</p>
              <p className="text-white mb-1">{formData.preferredEventFormats?.join(', ')}</p>
              {fieldResponses.preferredEventFormats?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You'll host: {fieldResponses.preferredEventFormats?.modifiedValue?.join(', ')}
                </p>
              )}
              {renderFieldActionButtons('preferredEventFormats')}
            </div>
          )}
        </div>

        {/* Section 2: Venue Offerings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              2
            </div>
            <div>
              <h2 className="text-xl font-bold">VENUE OFFERINGS</h2>
              <p className="text-sm text-gray-400">Review what's included</p>
            </div>
          </div>

          {formData.venueOfferings?.space?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Space & Infrastructure</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.space.options?.join(', ')}
              </p>
              {renderFieldActionButtons('spaceOffering')}
            </div>
          )}

          {formData.venueOfferings?.av?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">AV Equipment</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.av.options?.join(', ')}
              </p>
              {renderFieldActionButtons('avOffering')}
            </div>
          )}

          {formData.venueOfferings?.furniture?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Furniture & Seating</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.furniture.options?.join(', ')}
              </p>
              {renderFieldActionButtons('furnitureOffering')}
            </div>
          )}

          {formData.venueOfferings?.fnb?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">F&B Services</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.fnb.options?.join(', ')}
              </p>
              {renderFieldActionButtons('fnbOffering')}
            </div>
          )}

          {formData.venueOfferings?.staff?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Staff Support</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.staff.options?.join(', ')}
              </p>
              {renderFieldActionButtons('staffOffering')}
            </div>
          )}

          {formData.venueOfferings?.marketing?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Marketing Support</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.marketing.options?.join(', ')}
              </p>
              {renderFieldActionButtons('marketingOffering')}
            </div>
          )}

          {formData.venueOfferings?.storage?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Storage & Parking</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.storage.options?.join(', ')}
              </p>
              {renderFieldActionButtons('storageOffering')}
            </div>
          )}

          {formData.venueOfferings?.ticketing?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Ticketing Support</h3>
              <p className="text-sm text-gray-400 mb-2">INCLUDED</p>
              <p className="text-white mb-1">
                {formData.venueOfferings.ticketing.options?.join(', ')}
              </p>
              {renderFieldActionButtons('ticketingOffering')}
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
              <h2 className="text-xl font-bold">COMMERCIAL TERMS</h2>
              <p className="text-sm text-gray-400">Review pricing model</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Commercial Model</h3>
            <p className="text-sm text-gray-400 mb-2">VENUE PROPOSED</p>
            <div className="text-white mb-1">
              {formData.commercialModels?.rental && (
                <p>Fixed Rental: ₹{formData.commercialModels.rental.amount}</p>
              )}
              {formData.commercialModels?.revenueShare && (
                <p>Revenue Share: {formData.commercialModels.revenueShare.percentage}% split</p>
              )}
              {formData.commercialModels?.coverCharge && (
                <p>Cover Charge: ₹{formData.commercialModels.coverCharge.amount} per person</p>
              )}
            </div>
            {renderFieldActionButtons('commercialModels')}
          </div>
        </div>

        {/* Section 4: Community Terms */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              4
            </div>
            <div>
              <h2 className="text-xl font-bold">COMMUNITY COMMITMENTS</h2>
              <p className="text-sm text-gray-400">Your commitments</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Expected Event Capacity</label>
              <input
                type="text"
                value={communityTerms.expectedCapacity}
                onChange={(e) => setCommunityTerms(prev => ({ ...prev, expectedCapacity: e.target.value }))}
                placeholder="e.g., 150-200 attendees per event"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Event Frequency</label>
              <input
                type="text"
                value={communityTerms.eventFrequency}
                onChange={(e) => setCommunityTerms(prev => ({ ...prev, eventFrequency: e.target.value }))}
                placeholder="e.g., 2-3 events per month"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Marketing Commitment</label>
              <textarea
                value={communityTerms.marketingCommitment}
                onChange={(e) => setCommunityTerms(prev => ({ ...prev, marketingCommitment: e.target.value }))}
                rows={3}
                placeholder="How you'll promote events at this venue..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Additional Requirements (optional)</label>
              <textarea
                value={communityTerms.additionalRequirements}
                onChange={(e) => setCommunityTerms(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                rows={3}
                placeholder="Any specific needs or requirements..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
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
            Your response will be delivered to the venue for their review
          </p>
          <button
            onClick={handleSubmitCounter}
            disabled={submitting}
            className="w-full py-4 hover:opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
          >
            <Send className="h-5 w-5" />
            {submitting ? 'Submitting...' : 'Submit Response to Venue'}
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {renderModifyModal()}
    </div>
  );
};

export default CommunityCounterFormVenue;
