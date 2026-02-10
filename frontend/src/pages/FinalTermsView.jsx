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
  const counter = collaboration.counterData || {};
  const finalTerms = { ...original };

  // Merge counter modifications into final terms
  if (counter.fieldResponses) {
    Object.entries(counter.fieldResponses).forEach(([fieldName, response]) => {
      if (response.action === 'modify' && response.modifiedValue) {
        finalTerms[fieldName] = response.modifiedValue;
      } else if (response.action === 'decline') {
        finalTerms[fieldName] = 'DECLINED';
      }
    });
  }

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
              {finalTerms.eventType && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Event Type</p>
                  <p className="text-sm text-white">{finalTerms.eventType}</p>
                </div>
              )}

              {/* Expected Attendees */}
              {finalTerms.expectedAttendees && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Expected Attendees</p>
                  <p className="text-sm text-white">{finalTerms.expectedAttendees}</p>
                </div>
              )}

              {/* Seating Capacity */}
              {finalTerms.seatingCapacity && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Seating Capacity</p>
                  <p className="text-sm text-white">{finalTerms.seatingCapacity}</p>
                </div>
              )}

              {/* Event Date */}
              {finalTerms.eventDate && (
                <div className="border-b border-gray-800 pb-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Event Date & Time</p>
                  <p className="text-sm text-white">
                    {finalTerms.eventDate.date || finalTerms.eventDate}
                    {finalTerms.eventDate.startTime && ` | ${finalTerms.eventDate.startTime} - ${finalTerms.eventDate.endTime}`}
                  </p>
                </div>
              )}

              {/* Show Backup Date */}
              {finalTerms.showBackupDate && (
                <div className="border-b border-gray-800 pb-3">
                  <p className="text-xs text-gray-500 mb-1">Show Backup Date</p>
                  <p className="text-sm text-white">{finalTerms.showBackupDate.toString()}</p>
                </div>
              )}

              {/* Backup Date */}
              {finalTerms.backupDate && (
                <div className="border-b border-gray-800 pb-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Backup Date & Time</p>
                  <p className="text-sm text-white">
                    {finalTerms.backupDate.date || finalTerms.backupDate}
                    {finalTerms.backupDate.startTime && ` | ${finalTerms.backupDate.startTime} - ${finalTerms.backupDate.endTime}`}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {finalTerms.requirements && (
                <div className="border-b border-gray-800 pb-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(finalTerms.requirements).map(([key, value]) => 
                      value ? (
                        <span key={key} className="px-3 py-1 bg-purple-900/30 text-purple-300 text-xs rounded border border-purple-700">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Other simple fields */}
              {Object.entries(finalTerms).map(([key, value]) => {
                // Skip already rendered fields and objects
                if (['eventType', 'expectedAttendees', 'seatingCapacity', 'eventDate', 'showBackupDate', 
                     'backupDate', 'requirements', 'pricing', 'supportingInfo'].includes(key)) {
                  return null;
                }
                if (typeof value === 'object') return null;
                
                return (
                  <div key={key} className="border-b border-gray-800 pb-3">
                    <p className="text-xs text-gray-500 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-white">
                      {value === 'DECLINED' ? (
                        <span className="text-red-400">Declined</span>
                      ) : (
                        value?.toString() || 'N/A'
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Commercial Terms */}
        {(counter.commercialCounter || original.pricing || finalTerms.pricing) && (
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
                    <p className="text-xs text-gray-500 mb-1">Value</p>
                    <p className="text-lg text-green-400 font-bold">{counter.commercialCounter.value}</p>
                  </div>
                  {counter.commercialCounter.note && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Note</p>
                      <p className="text-sm text-gray-300">{counter.commercialCounter.note}</p>
                    </div>
                  )}
                </div>
              ) : (finalTerms.pricing || original.pricing) ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pricing Model</p>
                    <p className="text-sm text-white font-semibold">{(finalTerms.pricing || original.pricing).model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Value</p>
                    <p className="text-lg text-green-400 font-bold">{(finalTerms.pricing || original.pricing).value}</p>
                  </div>
                </div>
              ) : null}
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
