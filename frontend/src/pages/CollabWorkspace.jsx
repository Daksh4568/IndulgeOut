import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Loader2, Lock, AlertTriangle, Check, Users } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import WorkspaceSection from '../components/workspace/sections/WorkspaceSection';
import AudienceProofCard from '../components/workspace/AudienceProofCard';
import MasterForum from '../components/workspace/forum/MasterForum';
import WorkspaceStickyBar from '../components/workspace/WorkspaceStickyBar';
import FieldEditorModal from '../components/workspace/modals/FieldEditorModal';
import FieldNotesModal from '../components/workspace/modals/FieldNotesModal';
import FieldHistoryModal from '../components/workspace/modals/FieldHistoryModal';

const CollabWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [collaboration, setCollaboration] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [audienceProofOpen, setAudienceProofOpen] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/workspace/${id}`);
      
      if (response.data.success) {
        setCollaboration(response.data.collaboration);
        setWorkspace(response.data.workspace);
        
        // Check if workspace needs initialization
        if (!response.data.workspace.isActive) {
          // Initialize workspace
          await initializeWorkspace();
        }
      }
    } catch (err) {
      console.error('Error fetching workspace:', err);
      
      // If workspace not active, try to initialize
      if (err.response?.status === 403) {
        try {
          await initializeWorkspace();
        } catch (initErr) {
          setError('Failed to initialize workspace. Please try again.');
        }
      } else {
        setError(err.response?.data?.error || 'Failed to load workspace');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeWorkspace = async () => {
    try {
      const response = await api.post(`/workspace/${id}/initialize`);
      if (response.data.success) {
        setWorkspace(response.data.workspace);
      }
    } catch (err) {
      console.error('Error initializing workspace:', err);
      throw err;
    }
  };

  const refreshWorkspace = async () => {
    try {
      const response = await api.get(`/workspace/${id}`);
      if (response.data.success) {
        setCollaboration(response.data.collaboration);
        setWorkspace(response.data.workspace);
      }
    } catch (err) {
      console.error('Error refreshing workspace:', err);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const response = await api.post(`/workspace/${id}/save`);
      
      if (response.data.success) {
        // Show success message
        alert('Changes saved successfully!');
        // Navigate back to dashboard
        navigate('/collaborations');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleExitCollaboration = async () => {
    if (!confirm('Are you sure you want to exit this collaboration? This will cancel the collaboration.')) {
      return;
    }

    const reason = prompt('Please provide a reason for exiting (optional):');

    try {
      const response = await api.post(`/workspace/${id}/exit`, { reason });
      
      if (response.data.success) {
        alert('You have exited the collaboration.');
        navigate('/collaborations');
      }
    } catch (err) {
      console.error('Error exiting collaboration:', err);
      alert(err.response?.data?.error || 'Failed to exit collaboration');
    }
  };

  const handleConfirmCollaboration = async () => {
    try {
      setConfirming(true);
      const response = await api.post(`/workspace/${id}/confirm`);
      
      if (response.data.success) {
        alert(response.data.message);
        await refreshWorkspace();
      }
    } catch (err) {
      console.error('Error confirming collaboration:', err);
      alert(err.response?.data?.error || 'Failed to confirm collaboration');
    } finally {
      setConfirming(false);
    }
  };

  const openEditModal = (section, field) => {
    setSelectedField({ section, field });
    setEditModalOpen(true);
  };

  const openNotesModal = (section, field) => {
    setSelectedField({ section, field });
    setNotesModalOpen(true);
  };

  const openHistoryModal = (section, field) => {
    setSelectedField({ section, field });
    setHistoryModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#7878E9' }} />
            <p className="text-gray-400">Loading workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/collaborations')}
              className="px-6 py-2 text-white rounded-lg transition"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
            >
              Back to Collaborations
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace || !collaboration) {
    return null;
  }

  // Get collaborator names
  const isInitiator = collaboration.initiator.user === user?._id;
  const myName = isInitiator ? collaboration.initiator.name : collaboration.recipient.name;
  const otherName = isInitiator ? collaboration.recipient.name : collaboration.initiator.name;
  const collaborationTitle = `${collaboration.initiator.name} × ${collaboration.recipient.name}`;

  // Check if current user has already confirmed (lock their editing even if other party hasn't)
  const hasMyConfirmed = workspace.confirmedBy?.some(
    c => c.user === user?._id
  ) || false;
  const effectivelyLocked = workspace.isLocked || hasMyConfirmed;

  // Get event details for sticky bar
  // Event date can be: plain string, object with {date, startTime, endTime}, or from workspace agreed value
  const getEventDate = () => {
    // First try to get the agreed workspace date if available
    const eventDateField = workspace?.sections
      ?.flatMap(s => s.fields)
      ?.find(f => f.key === 'eventDate');
    
    if (eventDateField) {
      // If both agreed, use the agreed value
      if (eventDateField.status === 'agreed') {
        return eventDateField.initiatorValue;
      }
      // Otherwise show initiator's proposed value
      return eventDateField.initiatorValue;
    }
    
    // Fallback to raw formData
    return collaboration.formData?.eventDate || '';
  };

  const getEventTime = () => {
    const dateVal = getEventDate();
    if (typeof dateVal === 'object' && dateVal !== null) {
      const parts = [];
      if (dateVal.startTime) parts.push(dateVal.startTime);
      if (dateVal.endTime) parts.push(dateVal.endTime);
      return parts.join(' - ');
    }
    return '';
  };

  const eventDate = getEventDate();
  const eventTime = getEventTime();
  const eventLocation = collaboration.formData?.city || collaboration.formData?.location || 'Location TBD';
  const eventName = collaborationTitle;

  return (
    <div className="min-h-screen bg-black pb-32">
      <NavigationBar />

      {/* Header */}
      <div className="bg-gradient-to-b from-black via-gray-900 to-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/collaborations')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Collaborations</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {collaborationTitle}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20">
                  {workspace.isLocked ? 'Confirmed' : hasMyConfirmed ? 'Awaiting Other Party' : 'Negotiating'}
                </span>
                {hasMyConfirmed && !workspace.isLocked && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: '#7878E9' }} />
                    <span style={{ color: '#7878E9' }}>You confirmed</span>
                  </div>
                )}
                {workspace.isLocked && (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500">Workspace Locked</span>
                  </div>
                )}
                {workspace.audienceProof && (
                  <button
                    onClick={() => setAudienceProofOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border transition hover:opacity-80"
                    style={{ background: 'rgba(120,120,233,0.1)', borderColor: 'rgba(120,120,233,0.3)', color: '#7878E9' }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Audience Proof</span>
                  </button>
                )}
              </div>
            </div>

            {workspace.isLocked && (
              <div className="px-4 py-2 rounded-lg border" style={{ background: 'rgba(120,120,233,0.1)', borderColor: 'rgba(120,120,233,0.2)' }}>
                <p className="font-medium" style={{ color: '#7878E9' }}>✓ Collaboration Confirmed</p>
                <p className="text-sm text-gray-400 mt-1">Read-only mode</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Progress Stepper */}
      {workspace.sections && workspace.sections.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {workspace.sections.map((section, idx) => {
              const agreedCount = section.fields.filter(f => f.status === 'agreed').length;
              const totalCount = section.fields.length;
              const isAllAgreed = agreedCount === totalCount;
              
              return (
                <React.Fragment key={section.key}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAllAgreed
                        ? 'text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                      style={isAllAgreed ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' } : {}}>
                      {isAllAgreed ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs font-medium text-center ${isAllAgreed ? 'text-gray-400' : 'text-gray-400'}`}
                      style={isAllAgreed ? { color: '#7878E9' } : {}}>
                      {section.title}
                    </span>
                    <span className="text-xs text-gray-600">{agreedCount}/{totalCount} fields</span>
                  </div>
                  {idx < workspace.sections.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 mt-[-20px]"
                      style={isAllAgreed ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' } : { backgroundColor: '#374151' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Sections & Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workspace Sections */}
            {workspace.sections?.map((section, index) => (
              <WorkspaceSection
                key={section.key}
                section={section}
                sectionIndex={index}
                collaboration={collaboration}
                workspace={workspace}
                isInitiator={isInitiator}
                isLocked={effectivelyLocked}
                onEditField={(field) => openEditModal(section.key, field)}
                onOpenNotes={(field) => openNotesModal(section.key, field)}
                onOpenHistory={(field) => openHistoryModal(section.key, field)}
                onRefresh={refreshWorkspace}
              />
            ))}
          </div>

          {/* Right Panel - Master Forum */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <MasterForum
                collaborationId={id}
                messages={workspace.forumMessages || []}
                myName={myName}
                otherName={otherName}
                isLocked={effectivelyLocked}
                onRefresh={refreshWorkspace}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bar */}
      <WorkspaceStickyBar
        eventName={eventName}
        eventDate={eventDate}
        eventTime={eventTime}
        eventLocation={eventLocation}
        isLocked={effectivelyLocked}
        hasMyConfirmed={hasMyConfirmed}
        isFullyLocked={workspace.isLocked}
        saving={saving}
        confirming={confirming}
        onSave={handleSaveChanges}
        onExit={handleExitCollaboration}
        onConfirm={handleConfirmCollaboration}
      />

      {/* Modals */}
      {editModalOpen && selectedField && (
        <FieldEditorModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedField(null);
          }}
          collaborationId={id}
          collaboration={collaboration}
          workspace={workspace}
          section={selectedField.section}
          field={selectedField.field}
          isInitiator={isInitiator}
          onSave={refreshWorkspace}
        />
      )}

      {notesModalOpen && selectedField && (
        <FieldNotesModal
          isOpen={notesModalOpen}
          onClose={() => {
            setNotesModalOpen(false);
            setSelectedField(null);
          }}
          collaborationId={id}
          section={selectedField.section}
          field={selectedField.field}
          myName={myName}
          onRefresh={refreshWorkspace}
        />
      )}

      {historyModalOpen && selectedField && (
        <FieldHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedField(null);
          }}
          collaborationId={id}
          section={selectedField.section}
          field={selectedField.field}
        />
      )}

      {/* Audience Proof Modal */}
      {audienceProofOpen && workspace.audienceProof && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setAudienceProofOpen(false)}>
          <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <AudienceProofCard
              audienceProof={workspace.audienceProof}
              initiatorName={collaboration.initiator.name}
            />
            <button
              onClick={() => setAudienceProofOpen(false)}
              className="mt-4 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollabWorkspace;
