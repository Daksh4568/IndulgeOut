import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import WorkspaceField from './WorkspaceField';

const WorkspaceSection = ({
  section,
  sectionIndex,
  collaboration,
  workspace,
  isInitiator,
  isLocked,
  onEditField,
  onOpenNotes,
  onOpenHistory,
  onRefresh
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status) => {
    switch (status) {
      case 'agreed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'partial':
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'agreed':
        return '✓ Agreed';
      case 'partial':
      default:
        return '◐ Partial';
    }
  };

  const isAgreedStatus = section.status === 'agreed';

  // Count agreed fields
  const agreedFields = section.fields.filter(f => f.status === 'agreed').length;
  const totalFields = section.fields.length;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-zinc-950 hover:bg-zinc-900 transition"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              {sectionIndex !== undefined ? sectionIndex + 1 : '•'}
            </div>
            <h2 className="text-xl font-bold text-white uppercase">{section.title}</h2>
          </div>

          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(section.status)}`}>
            {getStatusText(section.status)}
          </span>

          <span className="text-xs text-gray-500">{agreedFields}/{totalFields} fields</span>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Section Fields */}
      {isExpanded && (
        <div className="divide-y divide-zinc-800">
          {section.fields.map((field, index) => (
            <WorkspaceField
              key={field.key}
              field={field}
              section={section}
              collaboration={collaboration}
              isInitiator={isInitiator}
              isLocked={isLocked}
              onEdit={() => onEditField(field.key)}
              onOpenNotes={() => onOpenNotes(field.key)}
              onOpenHistory={() => onOpenHistory(field.key)}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSection;
