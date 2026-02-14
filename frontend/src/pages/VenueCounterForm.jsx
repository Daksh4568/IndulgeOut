import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, X, Edit, AlertCircle, Send } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const VenueCounterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collaboration, setCollaboration] = useState(null);
  const [error, setError] = useState(null);
  
  // Field responses: {fieldName: {action: 'accept'|'modify'|'decline', modifiedValue: ..., note: ...}}
  const [fieldResponses, setFieldResponses] = useState({});
  const [houseRules, setHouseRules] = useState({
    alcoholPolicy: '',
    soundLimits: '',
    ageRestrictions: '',
    setupWindows: ''
  });
  const [generalNotes, setGeneralNotes] = useState('');
  const [commercialCounter, setCommercialCounter] = useState(null);
  
  // Modal states
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
      
      // Check if this is a community-to-venue request
      if (collab.type !== 'communityToVenue') {
        setError('This form is only for venue responses to community requests');
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
      // Open modify modal
      setCurrentField(fieldName);
      setModifyValue(fieldResponses[fieldName]?.modifiedValue || null);
      setFieldNote(fieldResponses[fieldName]?.note || '');
      setShowModifyModal(true);
    } else {
      // Accept or Decline
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
      alert('Please select a value');
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
      seatingCapacity: formData.seatingCapacity,
      expectedAttendees: formData.expectedAttendees,
      eventDate: formData.eventDate,
      eventType: formData.eventType,
      audioVisual: formData.requirements?.audioVisual,
      barFood: formData.requirements?.barFood,
      decoration: formData.requirements?.decoration,
      entertainment: formData.requirements?.entertainment,
      commercialModel: formData.pricing
    };
    return fieldMap[fieldName];
  };

  const handleSubmitCounter = async () => {
    // Validate that all fields have been responded to
    const requiredFields = ['seatingCapacity', 'eventDate', 'commercialModel'];
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
        houseRules,
        commercialCounter,
        generalNotes
      };

      console.log('Submitting counter:', counterData);
      
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
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleFieldAction(fieldName, 'accept')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            action === 'accept'
              ? 'bg-green-600 text-white border-2 border-green-400'
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-green-600'
          }`}
        >
          <Check className="h-4 w-4 inline mr-2" />
          Accept
        </button>
        <button
          onClick={() => handleFieldAction(fieldName, 'modify')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            action === 'modify'
              ? 'bg-yellow-600 text-white border-2 border-yellow-400'
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-yellow-600'
          }`}
        >
          <Edit className="h-4 w-4 inline mr-2" />
          Modify
        </button>
        <button
          onClick={() => handleFieldAction(fieldName, 'decline')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            action === 'decline'
              ? 'bg-red-600 text-white border-2 border-red-400'
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-red-600'
          }`}
        >
          <X className="h-4 w-4 inline mr-2" />
          Can't provide
        </button>
      </div>
    );
  };

  const renderModifyModal = () => {
    if (!showModifyModal || !currentField) return null;

    const formData = collaboration?.formData || {};

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">
            {currentField === 'seatingCapacity' && 'Seating / Standing Capacity'}
            {currentField === 'eventDate' && 'Date and Time'}
            {currentField === 'audioVisual' && 'Audio / Visual Support'}
            {currentField === 'barFood' && 'Bar / Food Service'}
            {currentField === 'commercialModel' && 'Commercial & Cost'}
          </h3>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">COMMUNITY PROPOSED</p>
            <p className="text-white">
              {currentField === 'seatingCapacity' && formData.seatingCapacity}
              {currentField === 'eventDate' && `${formData.eventDate?.date} | ${formData.eventDate?.startTime} - ${formData.eventDate?.endTime}`}
              {currentField === 'audioVisual' && 'Audio/Visual equipment requested'}
              {currentField === 'barFood' && 'Bar & Food services requested'}
            </p>
          </div>

          {/* Seating Capacity Options */}
          {currentField === 'seatingCapacity' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Select your available capacity:</p>
              <div className="grid grid-cols-2 gap-3">
                {['10-20', '20-40', '40-80', '80+'].map(option => (
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

          {/* Date & Time Options */}
          {currentField === 'eventDate' && (
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={modifyValue?.date || ''}
                    onChange={(e) => setModifyValue(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={modifyValue?.startTime || ''}
                      onChange={(e) => setModifyValue(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">End Time</label>
                    <input
                      type="time"
                      value={modifyValue?.endTime || ''}
                      onChange={(e) => setModifyValue(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio/Visual Options */}
          {currentField === 'audioVisual' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Specify what you can provide:</p>
              <div className="space-y-2">
                {['Mic', 'Speakers', 'Projector / Screen', 'Lighting'].map(option => (
                  <label key={option} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                    <input
                      type="checkbox"
                      checked={modifyValue?.includes(option) || false}
                      onChange={(e) => {
                        const current = modifyValue || [];
                        if (e.target.checked) {
                          setModifyValue([...current, option]);
                        } else {
                          setModifyValue(current.filter(item => item !== option));
                        }
                      }}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-white">{option}</span>
                  </label>
                ))}
              </div>
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
          <h1 className="text-3xl font-bold mb-2">VENUE RESPONSE FORM</h1>
          <p className="text-gray-400">
            {initiatorName} • Respond and set your terms
          </p>
        </div>

        {/* Section 1: Event & Timing */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              1
            </div>
            <div>
              <h2 className="text-xl font-bold">EVENT & TIMING</h2>
              <p className="text-sm text-gray-400">Confirm capacity and availability</p>
            </div>
          </div>

          {/* Seating Capacity */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Seating / Standing Capacity</h3>
            <p className="text-sm text-gray-400 mb-2">COMMUNITY PROPOSED</p>
            <p className="text-white mb-1">{formData.seatingCapacity}</p>
            {fieldResponses.seatingCapacity?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                Your counter: {fieldResponses.seatingCapacity?.modifiedValue}
              </p>
            )}
            {renderFieldActionButtons('seatingCapacity')}
          </div>

          {/* Event Date & Time */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Date & Time</h3>
            <p className="text-sm text-gray-400 mb-2">PROPOSED</p>
            <p className="text-white mb-1">
              {formData.eventDate?.date && new Date(formData.eventDate.date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short'
              })} | {formData.eventDate?.startTime} - {formData.eventDate?.endTime}
            </p>
            {formData.showBackupDate && formData.backupDate?.date && (
              <p className="text-sm text-gray-400 mt-1">
                BACKUP: {new Date(formData.backupDate.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short'
                })} | {formData.backupDate?.startTime} - {formData.backupDate?.endTime}
              </p>
            )}
            {fieldResponses.eventDate?.action === 'modify' && (
              <p className="text-yellow-400 text-sm mt-2">
                Your counter: {fieldResponses.eventDate?.modifiedValue?.date} | {fieldResponses.eventDate?.modifiedValue?.startTime} - {fieldResponses.eventDate?.modifiedValue?.endTime}
              </p>
            )}
            {renderFieldActionButtons('eventDate')}
          </div>
        </div>

        {/* Section 2: What Venue Will Provide */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              2
            </div>
            <div>
              <h2 className="text-xl font-bold">WHAT THE VENUE WILL PROVIDE</h2>
              <p className="text-sm text-gray-400">Review requested and available equipment</p>
            </div>
          </div>

          {/* Audio/Visual Support */}
          {formData.requirements?.audioVisual?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Audio / Visual Support</h3>
              <p className="text-sm text-gray-400 mb-2">Requested: Mic, Speakers, Projector, Lighting</p>
              {fieldResponses.audioVisual?.action === 'modify' && (
                <p className="text-yellow-400 text-sm mt-2">
                  You can provide: {fieldResponses.audioVisual?.modifiedValue?.join(', ')}
                </p>
              )}
              {renderFieldActionButtons('audioVisual')}
            </div>
          )}

          {/* Bar/Food */}
          {formData.requirements?.barFood?.selected && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Bar / Food Service</h3>
              <p className="text-sm text-gray-400 mb-2">Requested: Bar and food services</p>
              {renderFieldActionButtons('barFood')}
            </div>
          )}
        </div>

        {/* Section 3: Commercial & Cost */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              3
            </div>
            <div>
              <h2 className="text-xl font-bold">COMMERCIAL & COST</h2>
              <p className="text-sm text-gray-400">Review or counter pricing model</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Pricing Model</h3>
            <p className="text-sm text-gray-400 mb-2">COMMUNITY PROPOSED</p>
            <p className="text-white mb-1">
              {formData.pricing?.revenueShare?.selected && formData.pricing?.revenueShare?.value && `Revenue Share: ${formData.pricing.revenueShare.value}%`}
              {formData.pricing?.fixedRental?.selected && formData.pricing?.fixedRental?.amount && `Fixed Rental: ₹${formData.pricing.fixedRental.amount}`}
              {formData.pricing?.coverCharge?.selected && formData.pricing?.coverCharge?.amount && `Cover Charge: ₹${formData.pricing.coverCharge.amount} per person`}
            </p>
            {renderFieldActionButtons('commercialModel')}
          </div>
        </div>

        {/* Section 4: House Rules */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              4
            </div>
            <div>
              <h2 className="text-xl font-bold">HOUSE RULES & CONDITIONS</h2>
              <p className="text-sm text-gray-400">Optional</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Alcohol allowed</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setHouseRules(prev => ({ ...prev, alcoholPolicy: 'yes' }))}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    houseRules.alcoholPolicy === 'yes'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  <Check className="h-4 w-4 inline mr-2" />
                  Accept
                </button>
                <button
                  onClick={() => setHouseRules(prev => ({ ...prev, alcoholPolicy: 'no' }))}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    houseRules.alcoholPolicy === 'no'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  <X className="h-4 w-4 inline mr-2" />
                  Can't provide
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Sound limits (optional)</label>
              <input
                type="text"
                value={houseRules.soundLimits}
                onChange={(e) => setHouseRules(prev => ({ ...prev, soundLimits: e.target.value }))}
                placeholder="e.g., 85 dB max"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Age restrictions (optional)</label>
              <input
                type="text"
                value={houseRules.ageRestrictions}
                onChange={(e) => setHouseRules(prev => ({ ...prev, ageRestrictions: e.target.value }))}
                placeholder="e.g., 21+"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Setup windows (optional)</label>
              <input
                type="text"
                value={houseRules.setupWindows}
                onChange={(e) => setHouseRules(prev => ({ ...prev, setupWindows: e.target.value }))}
                placeholder="e.g., 2 hours before event"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Supporting Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              5
            </div>
            <div>
              <h2 className="text-xl font-bold">SUPPORTING INFO</h2>
              <p className="text-sm text-gray-400">Optional</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Upload your venue photos</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-500">Click to upload venue photos (PNG, JPG)</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Anything important we need to know?</label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={4}
              placeholder="Add any additional notes..."
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

export default VenueCounterForm;
