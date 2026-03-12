import React, { useState } from 'react';
import { Edit2, MessageCircle, History, Check, X, Circle } from 'lucide-react';
import { api } from '../../../config/api';

const WorkspaceField = ({
  field,
  section,
  collaboration,
  isInitiator,
  isLocked,
  onEdit,
  onOpenNotes,
  onOpenHistory,
  onRefresh
}) => {
  const [togglingAgreement, setTogglingAgreement] = useState(false);

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-600 italic">Not set</span>;
    }

    if (typeof value === 'object') {
      // Handle date objects
      if (value.date) {
        return `${value.date} ${value.startTime || ''} ${value.endTime ? `- ${value.endTime}` : ''}`.trim();
      }
      // Handle other objects
      return JSON.stringify(value, null, 2);
    }

    return value;
  };

  const handleToggleAgreement = async () => {
    try {
      setTogglingAgreement(true);

      const currentAgrees = isInitiator ? field.initiatorAgrees : field.recipientAgrees;
      const newAgrees = !currentAgrees;

      await api.post(`/workspace/${collaboration._id}/field/toggle-agreement`, {
        section: section.key,
        field: field.key,
        agrees: newAgrees
      });

      await onRefresh();
    } catch (err) {
      console.error('Error toggling agreement:', err);
      alert(err.response?.data?.error || 'Failed to update agreement');
    } finally {
      setTogglingAgreement(false);
    }
  };

  const getAgreementBadge = (agrees, isOwn = false) => {
    if (agrees) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full border border-green-500/20">
          <Check className="w-3.5 h-3.5" />
          Agree
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full border border-gray-700">
          <Circle className="w-3.5 h-3.5" />
          Pending
        </span>
      );
    }
  };

  const initiatorName = collaboration.initiator.name;
  const recipientName = collaboration.recipient.name;

  return (
    <div className="px-6 py-5 hover:bg-[#0a0a0a] transition">
      {/* Field Label */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white mb-1">{field.label}</h3>
      </div>

      {/* Values Comparison */}
      <div className="space-y-3 mb-4">
        {/* Initiator Value */}
        <div className="flex items-start justify-between gap-4 p-3 bg-[#0a0a0a] rounded-lg border border-gray-800">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1.5">{initiatorName}</p>
            <p className="text-white text-sm">{formatValue(field.initiatorValue)}</p>
          </div>
          {getAgreementBadge(field.initiatorAgrees)}
        </div>

        {/* Recipient Value */}
        <div className="flex items-start justify-between gap-4 p-3 bg-[#0a0a0a] rounded-lg border border-gray-800">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1.5">{recipientName}</p>
            <p className="text-white text-sm">{formatValue(field.recipientValue)}</p>
          </div>
          {getAgreementBadge(field.recipientAgrees)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {!isLocked && (
          <>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>

            <button
              onClick={handleToggleAgreement}
              disabled={togglingAgreement}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                (isInitiator ? field.initiatorAgrees : field.recipientAgrees)
                  ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {togglingAgreement ? 'Updating...' : 
                (isInitiator ? field.initiatorAgrees : field.recipientAgrees)
                  ? '✓ Agreed'
                  : '○ Mark as Agreed'}
            </button>
          </>
        )}

        <button
          onClick={onOpenNotes}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Notes
          {field.notesCount > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              {field.notesCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition"
        >
          <History className="w-3.5 h-3.5" />
          View History
        </button>
      </div>

      {/* Status Indicator */}
      {field.status === 'agreed' && (
        <div className="mt-3 flex items-center gap-2 text-green-500 text-sm">
          <Check className="w-4 h-4" />
          <span className="font-medium">Both parties agreed on this field</span>
        </div>
      )}
      {field.status === 'disputed' && (
        <div className="mt-3 flex items-center gap-2 text-yellow-500 text-sm">
          <X className="w-4 h-4" />
          <span className="font-medium">Values differ - discussion needed</span>
        </div>
      )}
    </div>
  );
};

export default WorkspaceField;
