import React, { useState } from 'react';
import SelectableCard from '../shared/SelectableCard';
import AddCommentModal from '../shared/AddCommentModal';

const PricingSection = ({ formData, setFormData, proposalType }) => {
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    fieldName: '',
    modelId: '',
  });
  
  const [hoveredCard, setHoveredCard] = useState(null);

  // Venue pricing models (for communityToVenue)
  const venuePricingModels = [
    {
      id: 'revenueShare',
      title: 'Revenue Share',
      description: 'Share a percentage of ticket sales with the venue',
      hasInput: true,
      inputType: 'percentage',
      options: ['20%', '30%', '40%', 'Open to discussion'],
    },
    {
      id: 'flatRental',
      title: 'Flat Rental Fee',
      description: 'Pay a fixed amount to rent the space',
      hasInput: true,
      inputType: 'amount',
      placeholder: 'Enter amount',
    },
    {
      id: 'coverCharge',
      title: 'Cover Charge per Person',
      description: 'Pay the venue a fixed amount per attendee',
      hasInput: true,
      inputType: 'amount',
      placeholder: 'Enter amount per person',
    },
  ];

  // Brand pricing models (for communityToBrand)
  const brandPricingModels = [
    {
      id: 'cashSponsorship',
      title: 'Cash Sponsorship',
      description: 'Fixed monetary sponsorship amount',
      hasInput: true,
      inputType: 'amount',
      placeholder: 'Enter sponsorship amount',
    },
    {
      id: 'barter',
      title: 'Barter / In-Kind',
      description: 'Products, prizes, vouchers, or services',
      hasInput: true,
      inputType: 'text',
      placeholder: 'Describe the barter (e.g., "50 product samples + 10 vouchers")',
    },
    {
      id: 'stallCost',
      title: 'Stall/Booth Fee',
      description: 'Booth or sales space rental at the event',
      hasInput: true,
      inputType: 'amount',
      placeholder: 'Enter stall cost',
    },
    {
      id: 'revenueShare',
      title: 'Revenue Share',
      description: 'Share a percentage of event or activation revenue',
      hasInput: true,
      inputType: 'percentage',
      options: ['20%', '30%', '40%', 'Open to discussion'],
    },
  ];

  // Select pricing models based on proposal type
  const pricingModels = proposalType === 'communityToBrand' ? brandPricingModels : venuePricingModels;

  const handleModelToggle = (modelId) => {
    const updatedPricing = { ...formData.pricing };
    
    if (updatedPricing[modelId]?.selected) {
      // Deselect
      delete updatedPricing[modelId];
    } else {
      // Select
      updatedPricing[modelId] = { selected: true };
    }
    
    setFormData({ ...formData, pricing: updatedPricing });
  };

  const handleValueChange = (modelId, value) => {
    const updatedPricing = { ...formData.pricing };
    if (!updatedPricing[modelId]) {
      updatedPricing[modelId] = { selected: true };
    }
    updatedPricing[modelId].value = value;
    setFormData({ ...formData, pricing: updatedPricing });
  };

  const openCommentModal = (fieldName, modelId) => {
    setCommentModal({
      isOpen: true,
      fieldName,
      modelId,
    });
  };

  const handleSaveComment = (comment) => {
    const updatedPricing = { ...formData.pricing };
    if (!updatedPricing[commentModal.modelId]) {
      updatedPricing[commentModal.modelId] = { selected: true };
    }
    updatedPricing[commentModal.modelId].comment = comment;
    setFormData({ ...formData, pricing: updatedPricing });
  };

  const getExistingComment = () => {
    return formData.pricing?.[commentModal.modelId]?.comment || '';
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
            3
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">PRICING & PAYMENT</h2>
            <p className="text-gray-400 text-sm">
              {proposalType === 'communityToBrand' 
                ? 'What commercial model works for both parties?' 
                : 'How do you want to pay the venue?'}
            </p>
          </div>
        </div>
      </div>

      {/* Question 6: Pricing Model */}
      <div>
        <label className="block text-white text-base mb-4">
          6. Choose your preferred pricing model <span className="text-red-500">*</span>
        </label>
        
        <div className="space-y-4">
          {pricingModels.map((model) => {
            const isSelected = formData.pricing?.[model.id]?.selected;
            const savedValue = formData.pricing?.[model.id]?.value;
            const savedComment = formData.pricing?.[model.id]?.comment;
            const isHovered = hoveredCard === model.id;
            
            return (
              <div
                key={model.id}
                onMouseEnter={() => isSelected && setHoveredCard(model.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <SelectableCard
                  title={model.title}
                  description={model.description}
                  isSelected={isSelected}
                  onClick={() => handleModelToggle(model.id)}
                >
                  {/* Input Fields (shown when selected AND (hovering OR no value)) */}
                  {model.hasInput && isSelected && (isHovered || !savedValue) && (
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {model.inputType === 'percentage' && model.options ? (
                        // Percentage buttons
                        <>
                          {model.options.map((option) => (
                            <button
                              key={option}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleValueChange(model.id, option);
                              }}
                              className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                                savedValue === option
                                  ? 'bg-gray-800 border border-gray-700 text-white'
                                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </>
                      ) : model.inputType === 'text' ? (
                        // Text input for barter description
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={savedValue || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleValueChange(model.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={model.placeholder}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ) : (
                        // Amount input
                        <div className="relative flex-1 max-w-xs">
                          <span className="absolute left-4 top-3 text-gray-400">₹</span>
                          <input
                            type="number"
                            value={savedValue || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleValueChange(model.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={model.placeholder}
                            className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                      
                      {/* Comment buttons */}
                      {isHovered && !savedComment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(model.title, model.id);
                          }}
                          onMouseEnter={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-lg transition-all text-sm font-medium text-white hover:opacity-90"
                          style={{
                            background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                          }}
                        >
                          Add Comment
                        </button>
                      )}
                      
                      {savedComment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(model.title, model.id);
                          }}
                          onMouseEnter={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-lg transition-all text-sm font-medium text-indigo-400 hover:text-indigo-300 underline bg-transparent"
                        >
                          View Comment
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Display saved value (shown when NOT hovering AND value exists) */}
                  {isSelected && !isHovered && savedValue && (
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-medium">
                        {model.inputType === 'amount' ? `₹${savedValue}` : savedValue}
                      </span>
                      
                      {savedComment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(model.title, model.id);
                          }}
                          onMouseEnter={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-lg transition-all text-sm font-medium text-indigo-400 hover:text-indigo-300 underline bg-transparent"
                        >
                          View Comment
                        </button>
                      )}
                    </div>
                  )}
                </SelectableCard>
              </div>
            );
          })}
        </div>

        {/* Additional Commercial Notes */}
        <div className="mt-6">
          <label className="block text-gray-400 text-sm mb-2">
            Additional commercial notes (optional)
          </label>
          <textarea
            value={formData.pricing?.additionalNotes || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                pricing: { ...formData.pricing, additionalNotes: e.target.value },
              })
            }
            placeholder="E.g., flexible on weekdays, minimum guarantee, bar sales expectations..."
            className="w-full h-24 px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
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

export default PricingSection;
