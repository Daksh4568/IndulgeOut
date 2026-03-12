import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import WorkspaceField from './WorkspaceField';

const WorkspaceSection = ({
  section,
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
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pending':
      default:
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'agreed':
        return '✓ Agreed';
      case 'partial':
        return '◐ Partial';
      case 'pending':
      default:
        return '○ Pending';
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-[#0a0a0a] hover:bg-[#151515] transition"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {section.key === 'eventDetails' || section.key === 'eventSnapshot' ? '1'
                : section.key === 'venueRequirements' || section.key === 'brandDeliverables' || section.key === 'venueOfferings' || section.key === 'brandExpectations' ? '2'
                : '3'}
            </div>
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
          </div>

          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(section.status)}`}>
            {getStatusText(section.status)}
          </span>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Section Fields */}
      {isExpanded && (
        <div className="divide-y divide-gray-800">
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
