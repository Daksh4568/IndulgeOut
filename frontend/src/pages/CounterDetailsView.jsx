import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, X, FileText, AlertCircle } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const CounterDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collaboration, setCollaboration] = useState(null);
  const [error, setError] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    fetchCollaborationDetails();
  }, [id]);

  const fetchCollaborationDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/collaborations/${id}`);
      console.log('Fetched collaboration for counter review:', {
        id: res.data.data._id,
        type: res.data.data.type,
        status: res.data.data.status,
        hasCounter: res.data.data.hasCounter,
        latestCounterId: res.data.data.latestCounterId,
        counterDataAvailable: !!res.data.data.latestCounterId?.counterData
      });
      setCollaboration(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching collaboration:', err);
      setError('Failed to load collaboration details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCounter = async () => {
    if (!window.confirm('Accept this counter-proposal? This will finalize the collaboration terms.')) {
      return;
    }

    try {
      setSubmitting(true);
      console.log('Accepting counter for collaboration:', {
        collaborationId: id,
        hasCounter: collaboration.hasCounter,
        latestCounterId: collaboration.latestCounterId?._id || collaboration.latestCounterId
      });
      
      const response = await api.put(`/collaborations/${id}/accept`);
      console.log('Counter accepted successfully:', response.data);
      
      alert('Counter-proposal accepted! Collaboration confirmed.');
      navigate('/collaborations', {
        state: {
          message: 'Collaboration confirmed! Both parties have agreed to the terms.',
          tab: 'sent'
        }
      });
    } catch (err) {
      console.error('Error accepting counter:', err);
      alert(err.response?.data?.error || 'Failed to accept counter-proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineCounter = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Declining counter for collaboration:', {
        collaborationId: id,
        hasCounter: collaboration.hasCounter,
        latestCounterId: collaboration.latestCounterId?._id || collaboration.latestCounterId,
        reason: declineReason
      });
      
      const response = await api.put(`/collaborations/${id}/decline`, { reason: declineReason });
      console.log('Counter declined successfully:', response.data);
      
      alert('Counter-proposal declined. Collaboration ended.');
      navigate('/collaborations', {
        state: {
          message: 'Counter-proposal declined. The collaboration has been ended.',
          tab: 'sent'
        }
      });
    } catch (err) {
      console.error('Error declining counter:', err);
      alert(err.response?.data?.error || 'Failed to decline counter-proposal');
    } finally {
      setSubmitting(false);
      setShowDeclineModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading counter-proposal...</p>
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
              onClick={() => navigate('/organizer/collaborations')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Collaborations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const counter = collaboration.latestCounterId?.counterData || collaboration.counterData || {};
  const original = collaboration.formData || {};
  const fieldResponsesRaw = counter.fieldResponses || {};
  const fieldResponses = fieldResponsesRaw instanceof Map
    ? Object.fromEntries(fieldResponsesRaw)
    : fieldResponsesRaw;

  console.log('Counter details extracted:', {
    counterAvailable: !!counter,
    fieldResponsesRaw,
    fieldResponsesCount: Object.keys(fieldResponses).length,
    fieldResponsesKeys: Object.keys(fieldResponses),
    fullCounter: counter
  });

  const getActionBadge = (action) => {
    if (action === 'accept') {
      return <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-700">✓ Accepted</span>;
    } else if (action === 'modify') {
      return <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded border border-yellow-700">✏ Modified</span>;
    } else if (action === 'counter') {
      return <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded border border-yellow-700">✏ Countered</span>;
    } else if (action === 'decline') {
      return <span className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded border border-red-700">✗ Declined</span>;
    }
    return null;
  };

  const formatKeyLabel = (key) => key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const formatEventDate = (eventDate, backupDate) => {
    if (!eventDate) return 'N/A';
    if (!eventDate.date) return eventDate;

    const primary = `${new Date(eventDate.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })} | ${eventDate.startTime || ''} - ${eventDate.endTime || ''}`;

    if (!backupDate?.date) return primary;

    const backup = `${new Date(backupDate.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })} | ${backupDate.startTime || ''} - ${backupDate.endTime || ''}`;

    return `${primary} (Backup: ${backup})`;
  };

  const formatRequirements = (section) => {
    if (!section) return 'N/A';
    const selected = Object.entries(section.subOptions || {})
      .filter(([, val]) => val?.selected)
      .map(([key]) => formatKeyLabel(key));

    if (selected.length > 0) return selected.join(', ');
    if (section.comment) return section.comment;
    return section.selected ? 'Requested' : 'Not Requested';
  };

  const formatPricingValue = (modelKey, modelData) => {
    if (!modelData?.value) return 'N/A';
    if (modelKey === 'rental' || modelKey === 'cover') {
      return `Rs.${modelData.value}`;
    }
    return modelData.value;
  };

  const formatOriginalValue = (fieldName) => {
    if (!original) return 'N/A';

    if (fieldName === 'eventType') return original.eventType || 'N/A';
    if (fieldName === 'expectedAttendees') return original.expectedAttendees || 'N/A';
    if (fieldName === 'eventDate') return formatEventDate(original.eventDate, original.backupDate);

    if (fieldName === 'audioVisualSupport') {
      return original.requirements?.audioVisual ? 'Mic, Speakers, Projector, Lighting' : 'Not Requested';
    }
    if (fieldName === 'seatingLayoutSupport') {
      return original.requirements?.seating ? 'Tables, Chairs, Stage area' : 'Not Requested';
    }
    if (fieldName === 'barFoodService') {
      return original.requirements?.catering ? 'Bar service, Light snacks, Beverages' : 'Not Requested';
    }
    if (fieldName === 'productionSetupSupport') {
      return original.requirements?.parking ? 'Setup assistance, Technical support' : 'Not Requested';
    }
    if (fieldName === 'additionalRequirements') return original.requirements?.other || 'N/A';

    if (fieldName === 'spaceOnly') return formatRequirements(original.requirements?.spaceOnly);
    if (fieldName === 'production') return formatRequirements(original.requirements?.production);

    if (fieldName.startsWith('pricing_')) {
      const modelKey = fieldName.replace('pricing_', '');
      return formatPricingValue(modelKey, original.pricing?.[modelKey]);
    }

    return original[fieldName] || 'N/A';
  };

  const houseRuleLabels = {
    alcohol: 'Alcohol allowed',
    soundLimit: 'Sound limits',
    ageRestriction: 'Age restrictions',
    setupWindow: 'Setup/teardown windows',
    additionalRules: 'Additional rules'
  };

  const getHouseRuleStatus = (rule, value) => {
    if (rule === 'alcohol' && typeof value === 'object') {
      return value.allowed ? 'accept' : 'decline';
    }
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && typeof value.allowed === 'boolean') {
      return value.allowed ? 'accept' : 'decline';
    }
    return 'decline';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationBar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/organizer/collaborations')}
            className="flex items-center text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collaborations
          </button>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Counter-Proposal Review</h1>
                <p className="text-gray-400 text-sm">
                  From: <span className="text-white">{collaboration.recipientId?.name || collaboration.recipientId?.username || 'Unknown'}</span> ({collaboration.recipientType})
                </p>
              </div>
              <div className="px-4 py-2 bg-purple-900/30 text-purple-400 rounded-lg text-sm border border-purple-800">
                Awaiting Your Response
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-xs text-gray-500 mb-1">Collaboration Type</p>
                <p className="text-sm text-white">{collaboration.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Counter Received</p>
                <p className="text-sm text-white">
                  {collaboration.counterSubmittedAt 
                    ? new Date(collaboration.counterSubmittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Recently'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Field Responses */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Field-by-Field Response</h2>
          <div className="space-y-3">
            {Object.keys(fieldResponses).length > 0 ? (
              Object.entries(fieldResponses).map(([fieldName, response]) => (
                <div key={fieldName} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-200">{formatKeyLabel(fieldName)}</h3>
                    {getActionBadge(response.action)}
                  </div>

                  <div className="space-y-2">
                    {/* Original Value */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Your Original Proposal:</p>
                      <p className="text-sm text-gray-300 bg-gray-800/50 rounded px-3 py-2">
                        {formatOriginalValue(fieldName)}
                      </p>
                    </div>

                    {/* Modified Value */}
                    {response.action === 'modify' && response.modifiedValue && (
                      <div>
                        <p className="text-xs text-yellow-500 mb-1">Their Counter-Offer:</p>
                        <p className="text-sm text-white bg-yellow-900/20 border border-yellow-800 rounded px-3 py-2">
                          {response.modifiedValue}
                        </p>
                      </div>
                    )}

                    {/* Note */}
                    {response.note && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Their Note:</p>
                        <p className="text-xs text-gray-400 bg-gray-800/50 rounded px-3 py-2 italic">
                          "{response.note}"
                        </p>
                      </div>
                    )}
                  </div>
              </div>
              ))
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-400">No field responses provided</p>
              </div>
            )}
          </div>
        </div>

        {/* Commercial Counter */}
        {counter.commercialCounter && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Commercial Counter-Offer</h2>
            <div className="bg-gray-900 border border-yellow-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Pricing Model</p>
                  <p className="text-sm text-white">{counter.commercialCounter.model}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Value</p>
                  <p className="text-sm text-white font-semibold">{counter.commercialCounter.value}</p>
                </div>
              </div>
              {counter.commercialCounter.note && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Note:</p>
                  <p className="text-sm text-gray-300">{counter.commercialCounter.note}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* House Rules / Deliverables */}
        {counter.houseRules && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">House Rules Response</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(counter.houseRules).map(([rule, value]) => {
                  if (rule === 'additionalRules' && value) {
                    return (
                      <div key={rule} className="p-2 bg-gray-800/50 rounded">
                        <span className="text-sm text-gray-300">{houseRuleLabels[rule] || formatKeyLabel(rule)}</span>
                        <p className="text-xs text-gray-400 mt-1">{value}</p>
                      </div>
                    );
                  }

                  const status = getHouseRuleStatus(rule, value);
                  const note = rule === 'alcohol' && value?.note ? value.note : '';

                  return (
                    <div key={rule} className="p-2 bg-gray-800/50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{houseRuleLabels[rule] || formatKeyLabel(rule)}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          status === 'accept'
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {status === 'accept' ? '✓ Accepted' : '✗ Can\'t Provide'}
                        </span>
                      </div>
                      {note && (
                        <p className="text-xs text-gray-400 mt-1 italic">"{note}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {counter.deliverables && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Deliverables Response</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(counter.deliverables).map(([deliverable, value]) => (
                  <div key={deliverable} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                    <span className="text-sm text-gray-300 capitalize">{deliverable.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      value === 'accept' 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {value === 'accept' ? '✓ Can Provide' : '✗ Can\'t Provide'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {counter.venueServices && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Venue Services Response</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(counter.venueServices).map(([service, value]) => (
                  <div key={service} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                    <span className="text-sm text-gray-300 capitalize">{service.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      value === 'accept' 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {value === 'accept' ? '✓ Accept' : '✗ Not Required'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* General Notes */}
        {counter.generalNotes && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">General Notes</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{counter.generalNotes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-black/90 backdrop-blur border-t border-gray-800 py-4 -mx-4 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setShowDeclineModal(true)}
              disabled={submitting}
              className="px-6 py-3 bg-red-900/30 text-red-400 border border-red-700 rounded-lg hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <X className="h-5 w-5 mr-2" />
              Decline Counter
            </button>

            <button
              onClick={handleAcceptCounter}
              disabled={submitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Accept Counter & Confirm
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Decline Counter-Proposal</h3>
            <p className="text-gray-400 text-sm mb-4">
              Please provide a reason for declining this counter-proposal. This will end the collaboration.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., Terms don't align with our budget..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 resize-none"
              rows="4"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{declineReason.length}/500</p>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineCounter}
                disabled={submitting || !declineReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Declining...' : 'Decline Counter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounterDetailsView;
