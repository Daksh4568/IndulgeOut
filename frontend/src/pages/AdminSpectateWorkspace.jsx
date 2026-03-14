import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../config/api';
import { ArrowLeft, Loader2, Eye, AlertTriangle, Check } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import WorkspaceSection from '../components/workspace/sections/WorkspaceSection';
import AudienceProofCard from '../components/workspace/AudienceProofCard';
import MasterForum from '../components/workspace/forum/MasterForum';
import WorkspaceStickyBar from '../components/workspace/WorkspaceStickyBar';
import FieldNotesModal from '../components/workspace/modals/FieldNotesModal';
import FieldHistoryModal from '../components/workspace/modals/FieldHistoryModal';

const AdminSpectateWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [collaboration, setCollaboration] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);

  // Modal states (read-only: no edit modal)
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);

  useEffect(() => {
    fetchSpectateData();
  }, [id]);

  const fetchSpectateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/admin/collaborations/${id}/workspace/spectate`);
      
      if (response.data.success) {
        setCollaboration(response.data.collaboration);
        setWorkspace(response.data.workspace);
      }
    } catch (err) {
      console.error('Error fetching spectate data:', err);
      setError(err.response?.data?.error || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
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
            <p className="text-gray-400">Loading workspace spectate view...</p>
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
              onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'all-collaborations' } })}
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

  const collaborationTitle = `${collaboration.initiator.name} × ${collaboration.recipient.name}`;

  // Get event details for sticky bar
  const getEventDate = () => {
    const eventDateField = workspace?.sections
      ?.flatMap(s => s.fields)
      ?.find(f => f.key === 'eventDate');
    if (eventDateField) return eventDateField.initiatorValue;
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

  return (
    <div className="min-h-screen bg-black pb-32">
      <NavigationBar />

      {/* Admin Spectate Banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-400 font-medium text-sm">
              Admin Spectate Mode — Read-only view of the collaboration workspace
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-black via-gray-900 to-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'all-collaborations' } })}
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
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20">
                  {workspace.isLocked ? 'Confirmed' : 'Negotiating'}
                </span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                  <Eye className="w-3 h-3 inline mr-1" />
                  Spectating
                </span>
              </div>
            </div>
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
                      {isAllAgreed ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                    <span className={`text-xs font-medium text-center ${isAllAgreed ? '' : 'text-gray-400'}`}
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
          {/* Left Panel - Sections & Fields (Read-Only) */}
          <div className="lg:col-span-2 space-y-6">
            {workspace.audienceProof && (
              <AudienceProofCard 
                audienceProof={workspace.audienceProof}
                initiatorName={collaboration.initiator.name}
              />
            )}

            {workspace.sections?.map((section, index) => (
              <WorkspaceSection
                key={section.key}
                section={section}
                sectionIndex={index}
                collaboration={collaboration}
                workspace={workspace}
                isInitiator={false}
                isLocked={true}
                onEditField={() => {}}
                onOpenNotes={(field) => openNotesModal(section.key, field)}
                onOpenHistory={(field) => openHistoryModal(section.key, field)}
                onRefresh={() => {}}
              />
            ))}
          </div>

          {/* Right Panel - Forum (Read-Only) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <MasterForum
                collaborationId={id}
                messages={workspace.forumMessages || []}
                myName="Admin"
                otherName=""
                isLocked={true}
                onRefresh={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bar (Info Only, No Actions) */}
      <WorkspaceStickyBar
        eventName={collaborationTitle}
        eventDate={eventDate}
        eventTime={eventTime}
        eventLocation={eventLocation}
        isLocked={true}
        saving={false}
        confirming={false}
        onSave={() => {}}
        onExit={() => {}}
        onConfirm={() => {}}
      />

      {/* Notes Modal (Read-Only, uses pre-loaded data) */}
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
          myName="Admin"
          onRefresh={() => {}}
          preloadedNotes={workspace?.allFieldNotes?.[`${selectedField.section}.${selectedField.field}`] || []}
          isReadOnly={true}
        />
      )}

      {/* History Modal (uses pre-loaded data) */}
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
          preloadedHistory={workspace?.allFieldHistory?.[`${selectedField.section}.${selectedField.field}`] || []}
        />
      )}
    </div>
  );
};

export default AdminSpectateWorkspace;
