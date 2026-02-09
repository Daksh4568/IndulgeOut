import React, { useState } from 'react';
import SelectableCard from '../shared/SelectableCard';
import AddCommentModal from '../shared/AddCommentModal';

const RequirementsSection = ({ formData, setFormData, proposalType }) => {
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    fieldName: '',
    parentField: '',
    subField: '',
  });
  
  const [hoveredCard, setHoveredCard] = useState(null);

  const requirements = [
    {
      id: 'spaceOnly',
      title: 'Space only',
      description: 'Just the venue space, nothing else',
      hasSubOptions: true,
      subOptions: [
        { id: 'venue_space', label: 'Venue Space' },
      ],
    },
    {
      id: 'seating',
      title: 'Seating / Layout Support',
      description: 'Tables, chairs, and arrangement help',
      hasSubOptions: true,
      subOptions: [
        { id: 'tables', label: 'Tables' },
        { id: 'chairs', label: 'Chairs' },
        { id: 'arrangement', label: 'Arrangement Help' },
      ],
    },
    {
      id: 'barFood',
      title: 'Bar / Food Service',
      description: 'Food and beverages for attendees',
      hasSubOptions: true,
      subOptions: [
        { id: 'food', label: 'Food' },
        { id: 'beverages', label: 'Beverages' },
      ],
    },
    {
      id: 'av',
      title: 'Audio / Visual Equipment',
      description: 'Mics, speakers, projectors, lighting and many more',
      hasSubOptions: true,
      subOptions: [
        { id: 'mic', label: 'Mic' },
        { id: 'speakers', label: 'Speakers' },
        { id: 'projector', label: 'Projector / Screen' },
        { id: 'lighting', label: 'Lighting' },
      ],
    },
    {
      id: 'production',
      title: 'Production & Event Setup',
      description: 'Stage, decor, staff, entry desk',
      hasSubOptions: true,
      subOptions: [
        { id: 'stage', label: 'Stage' },
        { id: 'decor', label: 'Decor' },
        { id: 'staff', label: 'Staff' },
        { id: 'entry_desk', label: 'Entry Desk' },
      ],
    },
  ];

  const handleRequirementToggle = (requirementId) => {
    const updatedRequirements = { ...formData.requirements };
    
    if (updatedRequirements[requirementId]?.selected) {
      // Deselect
      delete updatedRequirements[requirementId];
    } else {
      // Select
      updatedRequirements[requirementId] = { selected: true };
      
      // Initialize sub-options if applicable
      const requirement = requirements.find((r) => r.id === requirementId);
      if (requirement?.hasSubOptions) {
        updatedRequirements[requirementId].subOptions = {};
      }
    }
    
    setFormData({ ...formData, requirements: updatedRequirements });
  };

  const handleSubOptionToggle = (parentId, subOptionId) => {
    const updatedRequirements = { ...formData.requirements };
    const subOptions = updatedRequirements[parentId].subOptions || {};
    
    if (subOptions[subOptionId]) {
      delete subOptions[subOptionId];
    } else {
      subOptions[subOptionId] = { selected: true };
    }
    
    updatedRequirements[parentId].subOptions = subOptions;
    setFormData({ ...formData, requirements: updatedRequirements });
  };

  const openCommentModal = (fieldName, parentField, subField = '') => {
    setCommentModal({
      isOpen: true,
      fieldName,
      parentField,
      subField,
    });
  };

  const handleSaveComment = (comment) => {
    const updatedRequirements = { ...formData.requirements };
    
    if (commentModal.subField) {
      // Comment on sub-option
      if (!updatedRequirements[commentModal.parentField].subOptions[commentModal.subField]) {
        updatedRequirements[commentModal.parentField].subOptions[commentModal.subField] = { selected: true };
      }
      updatedRequirements[commentModal.parentField].subOptions[commentModal.subField].comment = comment;
    } else {
      // Comment on main requirement
      updatedRequirements[commentModal.parentField].comment = comment;
    }
    
    setFormData({ ...formData, requirements: updatedRequirements });
  };

  const getExistingComment = () => {
    if (!formData.requirements[commentModal.parentField]) return '';
    
    if (commentModal.subField) {
      return formData.requirements[commentModal.parentField].subOptions?.[commentModal.subField]?.comment || '';
    } else {
      return formData.requirements[commentModal.parentField]?.comment || '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
            style={{
              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
            }}
          >
            2
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">WHAT DO YOU NEED?</h2>
            <p className="text-gray-400 text-sm">Select all services required from the venue</p>
          </div>
        </div>
      </div>

      {/* Question 5: Requirements */}
      <div>
        <label className="block text-white text-base mb-4">
          5. Select everything you need from the venue <span className="text-red-500">*</span>
        </label>
        
        <div className="space-y-4">
          {requirements.map((requirement) => {
            const isSelected = formData.requirements?.[requirement.id]?.selected;
            const isHovered = hoveredCard === requirement.id;
            const hasComment = formData.requirements?.[requirement.id]?.comment;
            
            // Get selected sub-options
            const selectedSubOptions = requirement.subOptions?.filter((subOption) => 
              formData.requirements[requirement.id]?.subOptions?.[subOption.id]?.selected
            ) || [];
            
            return (
              <div
                key={requirement.id}
                onMouseEnter={() => isSelected && setHoveredCard(requirement.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <SelectableCard
                  title={requirement.title}
                  description={requirement.description}
                  isSelected={isSelected}
                  onClick={() => handleRequirementToggle(requirement.id)}
                >
                  {/* Sub-options displayed inline on the right */}
                  {requirement.hasSubOptions && isSelected && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {/* Show ALL sub-options when hovered, only SELECTED when not hovered */}
                      {(isHovered ? requirement.subOptions : selectedSubOptions).map((subOption) => {
                        const isSubSelected =
                          formData.requirements[requirement.id]?.subOptions?.[subOption.id]?.selected;
                        
                        return (
                          <button
                            key={subOption.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubOptionToggle(requirement.id, subOption.id);
                            }}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                              isSubSelected
                                ? 'bg-gray-800 border border-gray-700 text-white'
                                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            {subOption.label}
                          </button>
                        );
                      })}
                      
                      {/* Add Comment Button - only visible when hovered */}
                      {isHovered && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(requirement.title, requirement.id);
                          }}
                          style={{
                            background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                          }}
                          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                        >
                          Add Comment
                        </button>
                      )}
                      
                      {/* View Comment Button - only visible when NOT hovered and comment exists */}
                      {!isHovered && hasComment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(requirement.title, requirement.id);
                          }}
                          className="px-4 py-2 text-indigo-400 rounded-lg hover:text-indigo-300 transition-colors text-sm font-medium underline"
                        >
                          View comment
                        </button>
                      )}
                    </div>
                  )}
                </SelectableCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Comment Modal */}
      <AddCommentModal
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal({ ...commentModal, isOpen: false })}
        onSave={handleSaveComment}
        fieldName={commentModal.fieldName}
        existingComment={getExistingComment()}
      />
    </div>
  );
};

export default RequirementsSection;
