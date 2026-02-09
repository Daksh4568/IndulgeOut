import React, { useState } from 'react';
import SelectableCard from '../shared/SelectableCard';
import AddCommentModal from '../shared/AddCommentModal';

const VenueCommercialSection = ({ formData, setFormData }) => {
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    fieldName: '',
    parentField: '',
  });
  
  const [hoveredCard, setHoveredCard] = useState(null);

  const commercialModels = [
    {
      id: 'rental',
      title: 'Flat Rental Fee',
      description: 'Fixed amount for venue rental',
      hasInput: true,
      inputType: 'currency',
    },
    {
      id: 'cover',
      title: 'Cover Charge per Person',
      description: 'Per-person entry fee',
      hasInput: true,
      inputType: 'currency',
    },
    {
      id: 'revenueShare',
      title: 'Revenue Share',
      description: 'Percentage of ticket/bar sales',
      hasInput: true,
      inputType: 'percentage',
      options: ['20%', '30%', '40%', 'Open to discussion'],
    },
    {
      id: 'barter',
      title: 'Barter / No Fee',
      description: 'Promotion in exchange for space',
      hasInput: false,
    },
  ];

  const handleModelToggle = (modelId) => {
    const updatedModels = { ...formData.commercialModels };
    
    if (updatedModels[modelId]?.selected) {
      delete updatedModels[modelId];
    } else {
      updatedModels[modelId] = { selected: true };
    }
    
    setFormData({ ...formData, commercialModels: updatedModels });
  };

  const handleInputChange = (modelId, value) => {
    const updatedModels = { ...formData.commercialModels };
    updatedModels[modelId] = {
      ...updatedModels[modelId],
      value,
    };
    setFormData({ ...formData, commercialModels: updatedModels });
  };

  const openCommentModal = (fieldName, parentField) => {
    setCommentModal({ isOpen: true, fieldName, parentField });
  };

  const handleSaveComment = (comment) => {
    const updatedModels = { ...formData.commercialModels };
    updatedModels[commentModal.parentField].comment = comment;
    setFormData({ ...formData, commercialModels: updatedModels });
  };

  const getExistingComment = () => {
    return formData.commercialModels?.[commentModal.parentField]?.comment || '';
  };

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
            3
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">COMMERCIAL TERMS</h2>
            <p className="text-gray-400 text-sm">Select your preferred payment model</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-white text-base mb-4">
          Select payment model <span className="text-red-500">*</span>
        </label>
        
        <div className="space-y-4">
          {commercialModels.map((model) => {
            const isSelected = formData.commercialModels?.[model.id]?.selected;
            const isHovered = hoveredCard === model.id;
            const savedValue = formData.commercialModels?.[model.id]?.value;
            const hasComment = formData.commercialModels?.[model.id]?.comment;
            
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
                  {model.hasInput && isSelected && (
                    <div className="mt-3 space-y-3">
                      {/* Show input when hovering OR when no value saved */}
                      {(isHovered || !savedValue) && (
                        <>
                          {model.inputType === 'currency' && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg overflow-hidden max-w-md">
                                <span className="px-4 text-gray-400 text-lg">₹</span>
                                <input
                                  type="text"
                                  placeholder="Enter amount"
                                  value={formData.commercialModels?.[model.id]?.value || ''}
                                  onChange={(e) => handleInputChange(model.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-4 py-2.5 bg-transparent text-white outline-none w-48"
                                />
                              </div>
                            </div>
                          )}
                          
                          {model.inputType === 'percentage' && (
                            <div className="flex flex-wrap gap-3">
                              {model.options.map((option) => (
                                <button
                                  key={option}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInputChange(model.id, option);
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
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Show saved value badge when NOT hovering and value exists */}
                      {isSelected && !isHovered && savedValue && (
                        <div className="flex items-center gap-2">
                          <span className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm font-medium">
                            {model.inputType === 'currency' ? `Rs.${savedValue}` : savedValue}
                          </span>
                        </div>
                      )}
                      
                      {/* Add Comment button when hovering */}
                      <div className="flex items-center gap-3">
                        {isHovered && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCommentModal(model.title, model.id);
                            }}
                            style={{
                              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                            }}
                            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                          >
                            Add Comment
                          </button>
                        )}
                        
                        {/* View comment link when not hovering */}
                        {!isHovered && hasComment && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCommentModal(model.title, model.id);
                            }}
                            className="px-4 py-2 text-indigo-400 rounded-lg hover:text-indigo-300 transition-colors text-sm font-medium underline"
                          >
                            View comment
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Barter model without input */}
                  {!model.hasInput && isSelected && (
                    <div className="mt-3 flex items-center gap-3">
                      {isHovered && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(model.title, model.id);
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
                            openCommentModal(model.title, model.id);
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

      {/* Additional Terms */}
      <div>
        <label className="block text-white text-base mb-2">
          Additional Terms or Notes
        </label>
        <textarea
          value={formData.additionalTerms || ''}
          onChange={(e) => setFormData({ ...formData, additionalTerms: e.target.value })}
          placeholder="Any other commercial terms or conditions we should know..."
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          rows="4"
        />
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

export default VenueCommercialSection;
