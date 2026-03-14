import React from 'react';
import { Edit2, MessageCircle, History, Check, X, Eye } from 'lucide-react';
import { getFieldDefinition, getSelectedSubOptionLabels } from '../../../config/fieldDefinitions';

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
  const fieldDefinition = getFieldDefinition(field.key);
  const isReadOnly = fieldDefinition.type === 'readonly';

  // Render the value as chips/tags for sub-option fields, or text for simple fields
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-600 italic text-sm">Not set</span>;
    }

    if (value === true) {
      return <span className="text-sm" style={{ color: '#7878E9' }}>✓ Selected</span>;
    }
    if (value === false) {
      return <span className="text-gray-500 text-sm">✗ Not selected</span>;
    }

    // Sub-options object → render as chips
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // Check for date objects
      if ('date' in value || 'startTime' in value || 'startDate' in value) {
        const parts = [];
        if (value.date) parts.push(value.date);
        if (value.startDate) parts.push(value.startDate);
        if (value.startTime) parts.push(value.startTime);
        if (value.endTime) parts.push(`- ${value.endTime}`);
        if (value.endDate) parts.push(`to ${value.endDate}`);
        if (value.flexible) parts.push('(Flexible)');
        return <span className="text-white text-sm">{parts.join(' ')}</span>;
      }

      // Sub-options → get labels from field definition
      const labels = getSelectedSubOptionLabels(field.key, value);
      if (labels.length > 0) {
        return (
          <div className="flex flex-wrap gap-1.5">
            {labels.map(label => (
              <span key={label} className="px-2.5 py-1 bg-zinc-800 text-white text-xs rounded border border-zinc-700">
                {label}
              </span>
            ))}
          </div>
        );
      }

      // Pricing value object {selected, value}
      if ('selected' in value && 'value' in value) {
        return <span className="text-white text-sm font-medium">{value.value || 'Selected'}</span>;
      }

      return <pre className="text-xs text-gray-400 max-w-full overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
    }

    // Array → chips
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-zinc-800 text-white text-xs rounded border border-zinc-700">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    return <span className="text-white text-sm">{String(value)}</span>;
  };

  // Single badge: Agree (green) if values match, Disagree (red) if they differ
  const isAgreed = field.status === 'agreed';

  const initiatorName = collaboration.initiator.name;
  const recipientName = collaboration.recipient.name;

  return (
    <div className="px-6 py-5">
      {/* Row: Field Label + Single Badge + Notes/History buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">{field.label}</h3>
          {!isReadOnly && (
            isAgreed ? (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full border border-green-500/20 whitespace-nowrap">
                <Check className="w-3 h-3" />
                Agreed
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded-full border border-red-500/20 whitespace-nowrap">
                <X className="w-3 h-3" />
                Disagree
              </span>
            )
          )}
          {isReadOnly && (
            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded border border-yellow-500/20">
              Reference Only
            </span>
          )}
        </div>

        {/* Notes & History buttons - right aligned like Figma */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm rounded-lg transition"
            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Notes{field.notesCount > 0 ? ` (${field.notesCount})` : ''}
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition border border-zinc-700"
          >
            <Eye className="w-3.5 h-3.5" />
            View History
          </button>
        </div>
      </div>

      {/* Side-by-side value comparison */}
      <div className="grid grid-cols-2 gap-6 mb-3">
        {/* Initiator Column */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{initiatorName}</p>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg flex-1 min-w-0">
              {renderValue(field.initiatorValue)}
            </div>
            {!isLocked && !isReadOnly && isInitiator && (
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-zinc-800 rounded transition flex-shrink-0"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recipient Column */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{recipientName}</p>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg flex-1 min-w-0">
              {renderValue(field.recipientValue)}
            </div>
            {!isLocked && !isReadOnly && !isInitiator && (
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-zinc-800 rounded transition flex-shrink-0"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status message */}
      {field.status === 'agreed' && !isReadOnly && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-500">
          <Check className="w-4 h-4" />
          <span className="font-medium">Both parties agreed on this field</span>
        </div>
      )}
      {field.status === 'disputed' && !isReadOnly && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <X className="w-4 h-4" />
          <span className="font-medium">Values differ - discussion needed</span>
        </div>
      )}
    </div>
  );
};

export default WorkspaceField;
