import React, { useState } from 'react';
import SelectableCard from '../shared/SelectableCard';
import AddCommentModal from '../shared/AddCommentModal';

const BrandOffersExpectsSection = ({ formData, setFormData }) => {
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    fieldName: '',
    parentField: '',
    type: '', // 'offers' or 'expects'
  });
  
  const [hoveredCard, setHoveredCard] = useState(null);

  const offers = [
    {
      id: 'cash',
      title: 'Cash Sponsorship',
      description: 'Direct monetary support',
      hasSubOptions: true,
      subOptions: [
        { id: 'fixed_amount', label: 'Fixed Amount' },
        { id: 'revenue_share', label: 'Revenue Share' },
      ],
    },
    {
      id: 'barter',
      title: 'Barter / In-Kind',
      description: 'Products, prizes, vouchers',
      hasSubOptions: true,
      subOptions: [
        { id: 'products', label: 'Products' },
        { id: 'vouchers', label: 'Vouchers' },
        { id: 'prizes', label: 'Prizes' },
      ],
    },
    {
      id: 'coMarketing',
      title: 'Co-Marketing',
      description: 'Joint promotional activities',
      hasSubOptions: true,
      subOptions: [
        { id: 'social_promotion', label: 'Social Media Promotion' },
        { id: 'email_blast', label: 'Email Blast' },
        { id: 'cross_promotion', label: 'Cross Promotion' },
      ],
    },
    {
      id: 'content',
      title: 'Content Support',
      description: 'Content creation and distribution',
      hasSubOptions: true,
      subOptions: [
        { id: 'photography', label: 'Photography' },
        { id: 'videography', label: 'Videography' },
        { id: 'social_content', label: 'Social Content' },
      ],
    },
  ];

  const expectations = [
    {
      id: 'branding',
      title: 'Branding Rights',
      description: 'Logo placement and mentions',
      hasSubOptions: true,
      subOptions: [
        { id: 'logo_posters', label: 'Logo on Posters' },
        { id: 'logo_digital', label: 'Logo on Digital' },
        { id: 'stage_branding', label: 'Stage Branding' },
      ],
    },
    {
      id: 'speaking',
      title: 'Speaking / Presentation Slot',
      description: 'Time to present or speak',
      hasSubOptions: true,
      subOptions: [
        { id: '5min', label: '5 minutes' },
        { id: '10min', label: '10 minutes' },
        { id: '15min', label: '15 minutes' },
      ],
    },
    {
      id: 'leadCapture',
      title: 'Lead Capture',
      description: 'Attendee data access',
      hasSubOptions: true,
      subOptions: [
        { id: 'registration_data', label: 'Registration Data' },
        { id: 'booth_leads', label: 'Booth Leads' },
      ],
    },
    {
      id: 'exclusivity',
      title: 'Category Exclusivity',
      description: 'No competing brands',
      hasSubOptions: false,
    },
    {
      id: 'contentRights',
      title: 'Content Rights',
      description: 'Rights to use event content',
      hasSubOptions: true,
      subOptions: [
        { id: 'photos', label: 'Photos' },
        { id: 'videos', label: 'Videos' },
        { id: 'testimonials', label: 'Testimonials' },
      ],
    },
  ];

  const handleToggle = (itemId, type) => {
    const field = type === 'offers' ? 'brandOffers' : 'brandExpectations';
    const updated = { ...formData[field] };
    
    if (updated[itemId]?.selected) {
      delete updated[itemId];
    } else {
      updated[itemId] = { selected: true, subOptions: {} };
    }
    
    setFormData({ ...formData, [field]: updated });
  };

  const handleSubOptionToggle = (parentId, subOptionId, type) => {
    const field = type === 'offers' ? 'brandOffers' : 'brandExpectations';
    const updated = { ...formData[field] };
    const subOptions = updated[parentId]?.subOptions || {};
    
    if (subOptions[subOptionId]) {
      delete subOptions[subOptionId];
    } else {
      subOptions[subOptionId] = { selected: true };
    }
    
    updated[parentId].subOptions = subOptions;
    setFormData({ ...formData, [field]: updated });
  };

  const openCommentModal = (fieldName, parentField, type) => {
    setCommentModal({ isOpen: true, fieldName, parentField, type });
  };

  const handleSaveComment = (comment) => {
    const field = commentModal.type === 'offers' ? 'brandOffers' : 'brandExpectations';
    const updated = { ...formData[field] };
    updated[commentModal.parentField].comment = comment;
    setFormData({ ...formData, [field]: updated });
  };

  const getExistingComment = () => {
    const field = commentModal.type === 'offers' ? 'brandOffers' : 'brandExpectations';
    return formData[field]?.[commentModal.parentField]?.comment || '';
  };

  const renderSection = (items, type, sectionNumber, title, subtitle) => {
    const field = type === 'offers' ? 'brandOffers' : 'brandExpectations';
    
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
              }}
            >
              {sectionNumber}
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">{title}</h2>
              <p className="text-gray-400 text-sm">{subtitle}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-white text-base mb-4">
            Select all that apply <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-4">
            {items.map((item) => {
              const isSelected = formData[field]?.[item.id]?.selected;
              const isHovered = hoveredCard === `${type}-${item.id}`;
              const hasComment = formData[field]?.[item.id]?.comment;
              
              const selectedSubOptions = item.subOptions?.filter((subOption) => 
                formData[field]?.[item.id]?.subOptions?.[subOption.id]?.selected
              ) || [];
              
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => isSelected && setHoveredCard(`${type}-${item.id}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <SelectableCard
                    title={item.title}
                    description={item.description}
                    isSelected={isSelected}
                    onClick={() => handleToggle(item.id, type)}
                  >
                    {item.hasSubOptions && isSelected && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {(isHovered ? item.subOptions : selectedSubOptions).map((subOption) => {
                          const isSubSelected =
                            formData[field]?.[item.id]?.subOptions?.[subOption.id]?.selected;
                          
                          return (
                            <button
                              key={subOption.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubOptionToggle(item.id, subOption.id, type);
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
                              openCommentModal(item.title, item.id, type);
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
                              openCommentModal(item.title, item.id, type);
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
      </div>
    );
  };

  return (
    <>
      {renderSection(offers, 'offers', 2, 'WHAT WE OFFER', 'What can your brand provide?')}
      <div className="mt-16">
        {renderSection(expectations, 'expects', 3, 'WHAT WE EXPECT', 'What do you need from the community?')}
      </div>
      
      <AddCommentModal
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal({ ...commentModal, isOpen: false })}
        onSave={handleSaveComment}
        fieldName={commentModal.fieldName}
        existingComment={getExistingComment()}
      />
    </>
  );
};

export default BrandOffersExpectsSection;
