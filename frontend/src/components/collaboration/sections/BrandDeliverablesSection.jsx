import React, { useState } from 'react';
import SelectableCard from '../shared/SelectableCard';
import AddCommentModal from '../shared/AddCommentModal';

const BrandDeliverablesSection = ({ formData, setFormData }) => {
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    fieldName: '',
    parentField: '',
  });
  
  const [hoveredCard, setHoveredCard] = useState(null);

  const deliverables = [
    {
      id: 'logoPlacement',
      title: 'Logo Placement',
      description: 'Brand logo on event materials',
      hasSubOptions: true,
      subOptions: [
        { id: 'posters', label: 'Posters' },
        { id: 'banners', label: 'Banners' },
        { id: 'tickets', label: 'Tickets' },
        { id: 'social_media', label: 'Social Media' },
      ],
    },
    {
      id: 'onGroundBranding',
      title: 'On-ground Branding',
      description: 'Physical branding at the event venue',
      hasSubOptions: true,
      subOptions: [
        { id: 'stage_backdrop', label: 'Stage Backdrop' },
        { id: 'standees', label: 'Standees' },
        { id: 'booth', label: 'Booth Space' },
      ],
    },
    {
      id: 'sampling',
      title: 'Sampling / Product Demo',
      description: 'Distribute products or samples to attendees',
      hasSubOptions: true,
      subOptions: [
        { id: 'product_samples', label: 'Product Samples' },
        { id: 'demo_booth', label: 'Demo Booth' },
      ],
    },
    {
      id: 'sponsoredSegments',
      title: 'Sponsored Segments',
      description: 'Dedicated time slots for brand activities',
      hasSubOptions: true,
      subOptions: [
        { id: 'speaking_slot', label: 'Speaking Slot' },
        { id: 'game_activity', label: 'Game/Activity' },
        { id: 'performance', label: 'Performance' },
      ],
    },
    {
      id: 'digitalShoutouts',
      title: 'Digital Shoutouts',
      description: 'Online promotion and mentions',
      hasSubOptions: true,
      subOptions: [
        { id: 'instagram_posts', label: 'Instagram Posts' },
        { id: 'stories', label: 'Stories' },
        { id: 'reels', label: 'Reels' },
        { id: 'email_mention', label: 'Email Mention' },
      ],
    },
    {
      id: 'leadCapture',
      title: 'Lead Capture',
      description: 'Collect attendee information',
      hasSubOptions: true,
      subOptions: [
        { id: 'registration_data', label: 'Registration Data' },
        { id: 'booth_signup', label: 'Booth Signup' },
        { id: 'survey', label: 'Survey' },
      ],
    },
  ];

  const handleDeliverableToggle = (deliverableId) => {
    const updatedDeliverables = { ...formData.brandDeliverables };
    
    if (updatedDeliverables[deliverableId]?.selected) {
      delete updatedDeliverables[deliverableId];
    } else {
      updatedDeliverables[deliverableId] = { selected: true, subOptions: {} };
    }
    
    setFormData({ ...formData, brandDeliverables: updatedDeliverables });
  };

  const handleSubOptionToggle = (parentId, subOptionId) => {
    const updatedDeliverables = { ...formData.brandDeliverables };
    const subOptions = updatedDeliverables[parentId]?.subOptions || {};
    
    if (subOptions[subOptionId]) {
      delete subOptions[subOptionId];
    } else {
      subOptions[subOptionId] = { selected: true };
    }
    
    updatedDeliverables[parentId].subOptions = subOptions;
    setFormData({ ...formData, brandDeliverables: updatedDeliverables });
  };

  const openCommentModal = (fieldName, parentField) => {
    setCommentModal({ isOpen: true, fieldName, parentField });
  };

  const handleSaveComment = (comment) => {
    const updatedDeliverables = { ...formData.brandDeliverables };
    updatedDeliverables[commentModal.parentField].comment = comment;
    setFormData({ ...formData, brandDeliverables: updatedDeliverables });
  };

  const getExistingComment = () => {
    return formData.brandDeliverables?.[commentModal.parentField]?.comment || '';
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
            <h2 className="text-white text-xl font-semibold">BRAND DELIVERABLES</h2>
            <p className="text-gray-400 text-sm">What can you offer the brand?</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-white text-base mb-4">
          Select all deliverables you can provide <span className="text-red-500">*</span>
        </label>
        
        <div className="space-y-4">
          {deliverables.map((deliverable) => {
            const isSelected = formData.brandDeliverables?.[deliverable.id]?.selected;
            const isHovered = hoveredCard === deliverable.id;
            const hasComment = formData.brandDeliverables?.[deliverable.id]?.comment;
            
            const selectedSubOptions = deliverable.subOptions?.filter((subOption) => 
              formData.brandDeliverables[deliverable.id]?.subOptions?.[subOption.id]?.selected
            ) || [];
            
            return (
              <div
                key={deliverable.id}
                onMouseEnter={() => isSelected && setHoveredCard(deliverable.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <SelectableCard
                  title={deliverable.title}
                  description={deliverable.description}
                  isSelected={isSelected}
                  onClick={() => handleDeliverableToggle(deliverable.id)}
                >
                  {deliverable.hasSubOptions && isSelected && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {(isHovered ? deliverable.subOptions : selectedSubOptions).map((subOption) => {
                        const isSubSelected =
                          formData.brandDeliverables[deliverable.id]?.subOptions?.[subOption.id]?.selected;
                        
                        return (
                          <button
                            key={subOption.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubOptionToggle(deliverable.id, subOption.id);
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
                      
                      {isHovered && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(deliverable.title, deliverable.id);
                          }}
                          style={{
                            background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                          }}
                          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                        >
                          Add Comment
                        </button>
                      )}
                      
                      {!isHovered && hasComment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(deliverable.title, deliverable.id);
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

export default BrandDeliverablesSection;
