import React, { useState } from 'react';
import SelectableCard from '../shared/SelectableCard';
import AddCommentModal from '../shared/AddCommentModal';

const VenueOfferingsSection = ({ formData, setFormData }) => {
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    fieldName: '',
    parentField: '',
  });
  
  const [hoveredCard, setHoveredCard] = useState(null);

  const venueTypes = ['Cafe', 'Bar', 'Studio', 'Club', 'Outdoor', 'Restaurant', 'Coworking', 'Other'];
  const capacityRanges = ['10-20', '20-40', '40-80', '80-150', '150+'];
  const eventFormats = ['Music', 'Comedy', 'Workshops', 'Networking', 'Art', 'Food Events'];

  const offerings = [
    {
      id: 'space',
      title: 'Venue Space',
      description: 'Physical venue space',
      hasSubOptions: true,
      subOptions: [
        { id: 'indoor', label: 'Indoor Space' },
        { id: 'outdoor', label: 'Outdoor Space' },
        { id: 'stage', label: 'Stage Area' },
      ],
    },
    {
      id: 'av',
      title: 'Audio / Visual Equipment',
      description: 'Sound and visual systems',
      hasSubOptions: true,
      subOptions: [
        { id: 'mic', label: 'Microphones' },
        { id: 'speakers', label: 'Speakers' },
        { id: 'projector', label: 'Projector' },
        { id: 'lighting', label: 'Lighting' },
      ],
    },
    {
      id: 'furniture',
      title: 'Furniture & Seating',
      description: 'Tables, chairs, and seating',
      hasSubOptions: true,
      subOptions: [
        { id: 'tables', label: 'Tables' },
        { id: 'chairs', label: 'Chairs' },
        { id: 'bar_stools', label: 'Bar Stools' },
      ],
    },
    {
      id: 'fnb',
      title: 'F&B Services',
      description: 'Food and beverage options',
      hasSubOptions: true,
      subOptions: [
        { id: 'catering', label: 'Catering' },
        { id: 'bar_service', label: 'Bar Service' },
        { id: 'kitchen_access', label: 'Kitchen Access' },
      ],
    },
    {
      id: 'staff',
      title: 'Staff Support',
      description: 'Venue staff assistance',
      hasSubOptions: true,
      subOptions: [
        { id: 'service_staff', label: 'Service Staff' },
        { id: 'security', label: 'Security' },
        { id: 'tech_support', label: 'Technical Support' },
      ],
    },
    {
      id: 'marketing',
      title: 'Marketing Support',
      description: 'Promotional assistance',
      hasSubOptions: true,
      subOptions: [
        { id: 'social_media', label: 'Social Media Promotion' },
        { id: 'venue_listing', label: 'Venue Website Listing' },
        { id: 'email_blast', label: 'Email to Customers' },
      ],
    },
    {
      id: 'storage',
      title: 'Storage / Parking',
      description: 'Storage and parking facilities',
      hasSubOptions: true,
      subOptions: [
        { id: 'equipment_storage', label: 'Equipment Storage' },
        { id: 'parking', label: 'Parking' },
      ],
    },
    {
      id: 'ticketing',
      title: 'Ticketing Support',
      description: 'Help with ticket sales',
      hasSubOptions: true,
      subOptions: [
        { id: 'counter_sales', label: 'Counter Sales' },
        { id: 'online_support', label: 'Online Support' },
      ],
    },
  ];

  const handleOfferingToggle = (offeringId) => {
    const updatedOfferings = { ...formData.venueOfferings };
    
    if (updatedOfferings[offeringId]?.selected) {
      delete updatedOfferings[offeringId];
    } else {
      updatedOfferings[offeringId] = { selected: true, subOptions: {} };
    }
    
    setFormData({ ...formData, venueOfferings: updatedOfferings });
  };

  const handleSubOptionToggle = (parentId, subOptionId) => {
    const updatedOfferings = { ...formData.venueOfferings };
    const subOptions = updatedOfferings[parentId]?.subOptions || {};
    
    if (subOptions[subOptionId]) {
      delete subOptions[subOptionId];
    } else {
      subOptions[subOptionId] = { selected: true };
    }
    
    updatedOfferings[parentId].subOptions = subOptions;
    setFormData({ ...formData, venueOfferings: updatedOfferings });
  };

  const openCommentModal = (fieldName, parentField) => {
    setCommentModal({ isOpen: true, fieldName, parentField });
  };

  const handleSaveComment = (comment) => {
    const updatedOfferings = { ...formData.venueOfferings };
    updatedOfferings[commentModal.parentField].comment = comment;
    setFormData({ ...formData, venueOfferings: updatedOfferings });
  };

  const getExistingComment = () => {
    return formData.venueOfferings?.[commentModal.parentField]?.comment || '';
  };

  return (
    <div className="space-y-16">
      {/* Venue Snapshot */}
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{
                background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
              }}
            >
              1
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">VENUE SNAPSHOT</h2>
              <p className="text-gray-400 text-sm">Tell us about your venue</p>
            </div>
          </div>
        </div>

        {/* Venue Type */}
        <div>
          <label className="block text-white text-base mb-4">
            1. Venue Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {venueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFormData({ ...formData, venueType: type })}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  formData.venueType === type
                    ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                    : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-white text-base mb-4">
            2. Capacity Range <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {capacityRanges.map((range) => (
              <button
                key={range}
                onClick={() => setFormData({ ...formData, capacityRange: range })}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  formData.capacityRange === range
                    ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                    : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Event Formats */}
        <div>
          <label className="block text-white text-base mb-4">
            3. Preferred Event Formats
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {eventFormats.map((format) => {
              const isSelected = formData.preferredFormats?.includes(format);
              return (
                <button
                  key={format}
                  onClick={() => {
                    const formats = formData.preferredFormats || [];
                    const updated = isSelected
                      ? formats.filter(f => f !== format)
                      : [...formats, format];
                    setFormData({ ...formData, preferredFormats: updated });
                  }}
                  className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                      : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {format}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Venue Offerings */}
      <div className="space-y-8">
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
              <h2 className="text-white text-xl font-semibold">WHAT WE PROVIDE</h2>
              <p className="text-gray-400 text-sm">Select all services you can offer</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-white text-base mb-4">
            Select all offerings <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-4">
            {offerings.map((offering) => {
              const isSelected = formData.venueOfferings?.[offering.id]?.selected;
              const isHovered = hoveredCard === offering.id;
              const hasComment = formData.venueOfferings?.[offering.id]?.comment;
              
              const selectedSubOptions = offering.subOptions?.filter((subOption) => 
                formData.venueOfferings?.[offering.id]?.subOptions?.[subOption.id]?.selected
              ) || [];
              
              return (
                <div
                  key={offering.id}
                  onMouseEnter={() => isSelected && setHoveredCard(offering.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <SelectableCard
                    title={offering.title}
                    description={offering.description}
                    isSelected={isSelected}
                    onClick={() => handleOfferingToggle(offering.id)}
                  >
                    {offering.hasSubOptions && isSelected && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {(isHovered ? offering.subOptions : selectedSubOptions).map((subOption) => {
                          const isSubSelected =
                            formData.venueOfferings?.[offering.id]?.subOptions?.[subOption.id]?.selected;
                          
                          return (
                            <button
                              key={subOption.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubOptionToggle(offering.id, subOption.id);
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
                              openCommentModal(offering.title, offering.id);
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
                              openCommentModal(offering.title, offering.id);
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

export default VenueOfferingsSection;
