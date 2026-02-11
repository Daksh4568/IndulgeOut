import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Check, Download, FileText, Calendar, DollarSign } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const FinalTermsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [collaboration, setCollaboration] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCollaborationDetails();
  }, [id]);

  const fetchCollaborationDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/collaborations/${id}`);
      setCollaboration(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching collaboration:', err);
      setError('Failed to load collaboration details');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export will be implemented soon');
  };

  const formatEventDate = (eventDate) => {
    if (!eventDate) return null;
    if (typeof eventDate === 'string') return eventDate;
    if (!eventDate.date) return 'N/A';

    const dateStr = new Date(eventDate.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const timeStr = eventDate.startTime && eventDate.endTime
      ? ` | ${eventDate.startTime} - ${eventDate.endTime}`
      : '';

    return `${dateStr}${timeStr}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading final terms...</p>
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

  const original = collaboration.formData || {};
  const counter = collaboration.latestCounterId?.counterData || collaboration.counterData || {};
  const fieldResponses = counter.fieldResponses || {};
  
  // Convert Map to object if needed
  const fieldResponsesObj = fieldResponses instanceof Map
    ? Object.fromEntries(fieldResponses)
    : fieldResponses;

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

          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-800 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Check className="h-6 w-6 text-green-400 mr-2" />
                  <h1 className="text-2xl font-bold">Collaboration Confirmed</h1>
                </div>
                <p className="text-gray-400 text-sm">
                  Final agreed terms between you and <span className="text-white">{collaboration.recipientId?.name || collaboration.proposerId?.name}</span>
                </p>
              </div>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-green-800/50">
              <div>
                <p className="text-xs text-gray-500 mb-1">Collaboration Type</p>
                <p className="text-sm text-white font-medium">{collaboration.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Confirmed On</p>
                <p className="text-sm text-white font-medium">
                  {collaboration.confirmedAt 
                    ? new Date(collaboration.confirmedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : new Date().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-700">
                    ✓ Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parties Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-gray-200">Proposer</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm text-white">{collaboration.proposerId?.name || collaboration.proposerId?.username || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm text-white capitalize">{collaboration.proposerType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-white">{collaboration.proposerId?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-gray-200">Recipient</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm text-white">{collaboration.recipientId?.name || collaboration.recipientId?.username || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm text-white capitalize">{collaboration.recipientType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-white">{collaboration.recipientId?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Terms */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Final Agreed Terms</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Event Type */}
              {original.eventType && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Event Type</p>
                  <p className="text-sm text-white">{original.eventType}</p>
                </div>
              )}

              {/* Expected Attendees */}
              {original.expectedAttendees && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Expected Attendees</p>
                  <p className="text-sm text-white">{original.expectedAttendees}</p>
                </div>
              )}

              {/* Seating Capacity */}
              {original.seatingCapacity && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Seating Capacity</p>
                  <p className="text-sm text-white">{original.seatingCapacity}</p>
                </div>
              )}

              {/* Event Date */}
              {original.eventDate && (
                <div className="border-b border-gray-800 pb-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Event Date & Time</p>
                  <p className="text-sm text-white">{formatEventDate(original.eventDate)}</p>
                </div>
              )}

              {/* Show Backup Date */}
              {original.showBackupDate && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Show Backup Date</p>
                  <p className="text-sm text-white">{original.showBackupDate ? 'Yes' : 'No'}</p>
                </div>
              )}

              {/* Backup Date */}
              {original.backupDate && (
                <div className="border-b border-gray-800 pb-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Backup Date & Time</p>
                  <p className="text-sm text-white">{formatEventDate(original.backupDate)}</p>
                </div>
              )}

              {/* Requirements */}
              {original.requirements && (
                <div className="border-b border-gray-800 pb-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(original.requirements).map(([key, value]) => {
                      // Skip nested objects, only render simple booleans
                      if (typeof value !== 'boolean') return null;
                      return value ? (
                        <span key={key} className="px-3 py-1 bg-purple-900/30 text-purple-300 text-xs rounded border border-purple-700">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Other simple fields from original */}
              {Object.entries(original).map(([key, value]) => {
                // Skip already rendered fields and objects
                if (['eventType', 'expectedAttendees', 'seatingCapacity', 'eventDate', 'showBackupDate', 
                     'backupDate', 'requirements', 'pricing', 'supportingInfo', 'formData', '_id', 'createdAt', 'updatedAt'].includes(key)) {
                  return null;
                }
                // Skip any object/array types to prevent rendering invalid JSX
                if (typeof value === 'object' || typeof value === 'boolean' || value === null || value === undefined) {
                  return null;
                }
                
                return (
                  <div key={key} className="border-b border-gray-800 pb-3">
                    <p className="text-xs text-gray-500 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-white">
                      {String(value || 'N/A')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Space & Production Requirements (Nested ProposalForm Structure) */}
        {(original.requirements?.spaceOnly || original.requirements?.production) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Venue Services & Requirements</h2>
            <div className="space-y-4">
              {original.requirements?.spaceOnly?.selected && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-200 mb-3">Space Requirements</h3>
                  {original.requirements.spaceOnly.subOptions && (
                    <div className="space-y-2">
                      {Object.entries(original.requirements.spaceOnly.subOptions).map(([key, val]) => (
                        val.selected && (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}</span>
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">✓ Included</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  {original.requirements.spaceOnly.comment && (
                    <p className="text-xs text-gray-400 mt-2 italic">"{original.requirements.spaceOnly.comment}"</p>
                  )}
                </div>
              )}

              {original.requirements?.production?.selected && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-200 mb-3">Production Support</h3>
                  {original.requirements.production.subOptions && (
                    <div className="space-y-2">
                      {Object.entries(original.requirements.production.subOptions).map(([key, val]) => (
                        val.selected && (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}</span>
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">✓ Included</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  {original.requirements.production.comment && (
                    <p className="text-xs text-gray-400 mt-2 italic">"{original.requirements.production.comment}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nested Pricing Models (ProposalForm Structure) */}
        {original.pricing && !original.pricing.model && Object.keys(original.pricing).some(k => k !== 'additionalNotes') && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Commercial Pricing Models</h2>
            <div className="space-y-4">
              {Object.entries(original.pricing).map(([modelKey, modelData]) => {
                if (modelKey === 'additionalNotes') return null;
                if (!modelData?.selected) return null;

                const modelLabels = {
                  rental: 'Flat Rental Fee',
                  cover: 'Cover Charge per Person',
                  revenueShare: 'Revenue Share',
                  barter: 'Barter / No Fee'
                };

                return (
                  <div key={modelKey} className="bg-gray-900 border border-green-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-200">{modelLabels[modelKey] || modelKey}</h3>
                      <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">✓ Accepted</span>
                    </div>
                    {modelData.value && (
                      <p className="text-lg text-green-400 font-bold mb-2">
                        {modelKey === 'rental' || modelKey === 'cover' ? `Rs.${modelData.value}` : modelData.value}
                      </p>
                    )}
                    {modelData.comment && (
                      <p className="text-xs text-gray-400 italic">"{modelData.comment}"</p>
                    )}
                  </div>
                );
              })}
              {original.pricing.additionalNotes && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-200 mb-2">Additional Notes</h3>
                  <p className="text-sm text-gray-300">{original.pricing.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {(counter.commercialCounter || original.pricing?.model) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Commercial Terms</h2>
            <div className="bg-gray-900 border border-green-800 rounded-lg p-6">
              {counter.commercialCounter ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pricing Model</p>
                    <p className="text-sm text-white font-semibold">{counter.commercialCounter.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Final Value</p>
                    <p className="text-lg text-green-400 font-bold">{counter.commercialCounter.value}</p>
                  </div>
                  {counter.commercialCounter.note && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Note</p>
                      <p className="text-sm text-gray-300">{counter.commercialCounter.note}</p>
                    </div>
                  )}
                </div>
              ) : original.pricing?.model ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pricing Model</p>
                    <p className="text-sm text-white font-semibold">{original.pricing.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Value</p>
                    <p className="text-lg text-green-400 font-bold">{original.pricing.proposedValue}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* House Rules & Conditions */}
        {counter.houseRules && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">House Rules & Conditions</h2>
            <div className="space-y-3">
              {counter.houseRules.alcohol && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-200">Alcohol Policy</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {counter.houseRules.alcohol.allowed ? 'Permitted' : 'Not Permitted'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      counter.houseRules.alcohol.allowed 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {counter.houseRules.alcohol.allowed ? '✓ Allowed' : '✗ Not Allowed'}
                    </span>
                  </div>
                  {counter.houseRules.alcohol.note && (
                    <p className="text-xs text-gray-400 italic mt-2">"{counter.houseRules.alcohol.note}"</p>
                  )}
                </div>
              )}

              {counter.houseRules.soundLimit && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-200">Sound Limit</h3>
                    <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-semibold">
                      {counter.houseRules.soundLimit}
                    </span>
                  </div>
                </div>
              )}

              {counter.houseRules.ageRestriction && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-200">Age Restriction</h3>
                    <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded text-xs font-semibold">
                      {counter.houseRules.ageRestriction}
                    </span>
                  </div>
                </div>
              )}

              {counter.houseRules.setupWindow && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-200">Setup Window</h3>
                    <span className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded text-xs font-semibold">
                      {counter.houseRules.setupWindow}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {counter.generalNotes && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Additional Notes</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{counter.generalNotes}</p>
            </div>
          </div>
        )}

        {/* Action Reminder */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">Next Steps</h3>
              <p className="text-sm text-gray-300">
                These are the final agreed terms for this collaboration. Both parties should proceed with implementation as per the agreement. 
                You can export these terms as a PDF for your records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalTermsView;
