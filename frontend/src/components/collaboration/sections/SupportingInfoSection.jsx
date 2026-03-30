import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../../../config/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SupportingInfoSection = ({ formData, setFormData, proposalType }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const audienceProofOptions = [
    { id: 'pastSponsorBrands', label: 'Past Sponsor Brands', placeholder: 'e.g., Coca-Cola, Nike, Red Bull...' },
    { id: 'averageAttendance', label: 'Average Attendance', placeholder: 'e.g., 200-300 people per event' },
    { id: 'communitySize', label: 'Community Size', placeholder: 'e.g., 5000+ active members' },
    { id: 'repeatEventRate', label: 'Repeat Event Rate', placeholder: 'e.g., 30% of the attendees return in every subsequent event', inputType: 'percentage' },
  ];
  
  const handleAudienceProofToggle = (optionId) => {
    const currentProof = formData.audienceProof || {};
    const updated = { ...currentProof };
    
    if (updated[optionId]) {
      delete updated[optionId];
    } else {
      updated[optionId] = { selected: true, value: '' };
    }
    
    setFormData({ ...formData, audienceProof: updated });
  };
  
  const handleAudienceProofValue = (optionId, value) => {
    const currentProof = formData.audienceProof || {};
    setFormData({
      ...formData,
      audienceProof: {
        ...currentProof,
        [optionId]: { selected: true, value }
      }
    });
  };

  const handleImageUpload = async (files) => {
    setUploadError('');
    const fileArray = Array.from(files);
    const currentImages = formData.supportingInfo?.images || [];
    
    // Limit to 3 images total
    const remainingSlots = 3 - currentImages.length;
    if (remainingSlots === 0) {
      setUploadError('Maximum 3 images allowed');
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    // Validate file types and size
    const errors = [];
    const validFiles = filesToUpload.filter(file => {
      const isValidType = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg';
      if (!isValidType) {
        errors.push(`${file.name}: Only PNG and JPG formats are allowed`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (errors.length > 0) {
      setUploadError(errors.join('. '));
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // Upload to S3 via backend
      const formDataToUpload = new FormData();
      validFiles.forEach(file => {
        formDataToUpload.append('images', file);
      });

      const response = await api.post('/collaborations/upload-images', formDataToUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const uploadedImages = response.data.images.map(img => ({
          url: img.url,
          key: img.key,
        }));

        setFormData({
          ...formData,
          supportingInfo: {
            ...formData.supportingInfo,
            images: [...currentImages, ...uploadedImages],
          },
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files);
    }
  };

  const removeImage = (index) => {
    const updatedImages = [...(formData.supportingInfo?.images || [])];
    updatedImages.splice(index, 1);
    setFormData({
      ...formData,
      supportingInfo: {
        ...formData.supportingInfo,
        images: updatedImages,
      },
    });
  };

  const currentImages = formData.supportingInfo?.images || [];

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
            4
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">SUPPORTING INFO (OPTIONAL)</h2>
            <p className="text-gray-400 text-sm">{proposalType === 'communityToBrand' ? 'Photos and notes help brands respond faster' : 'Photos and notes help venues respond faster'}</p>
          </div>
        </div>
      </div>

      {/* Upload Past Event Photos */}
      <div>
        <label className="block text-white text-base mb-4">Upload past event photos</label>
        
        {/* Image Grid (if images exist) */}
        {currentImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {currentImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-800"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area (always visible if under 3 images) */}
        {currentImages.length < 3 && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500 bg-opacity-5'
                : 'border-gray-800 bg-black hover:border-gray-700'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => !uploading && document.getElementById('image-upload').click()}
          >
            <input
              id="image-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                ) : (
                  <Upload className="h-8 w-8 text-indigo-400" />
                )}
              </div>
              <div>
                <p className="text-indigo-400 font-medium mb-1">
                  {uploading ? 'Uploading...' : 'Click to upload photos'}
                </p>
                <p className="text-gray-500 text-sm">
                  Up to {3 - currentImages.length} more {3 - currentImages.length === 1 ? 'image' : 'images'} • PNG, JPG • Max 5MB each
                </p>
              </div>
            </div>
          </div>
        )}

        {currentImages.length === 3 && (
          <p className="text-green-400 text-sm mt-2">✓ Maximum 3 images uploaded</p>
        )}

        {uploadError && (
          <p className="text-red-400 text-sm mt-2">{uploadError}</p>
        )}
      </div>

      {/* Audience Proof Section (Only for communityToBrand) */}
      {proposalType === 'communityToBrand' && (
        <div>
          <label className="block text-white text-base mb-4">
            Audience Proof <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-400 text-sm mb-4">
            Help brands assess your community's credibility
          </p>
          
          <div className="space-y-4">
            {audienceProofOptions.map((option) => {
              const isSelected = formData.audienceProof?.[option.id]?.selected;
              const value = formData.audienceProof?.[option.id]?.value || '';
              
              return (
                <div key={option.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id={option.id}
                      checked={isSelected}
                      onChange={() => handleAudienceProofToggle(option.id)}
                      className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <label htmlFor={option.id} className="text-white font-medium cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                  
                  {isSelected && (
                    option.inputType === 'percentage' ? (
                      <div className="relative w-full">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => {
                            const num = e.target.value;
                            if (num === '' || (Number(num) >= 0 && Number(num) <= 100)) {
                              handleAudienceProofValue(option.id, num);
                            }
                          }}
                          placeholder={option.placeholder}
                          className="w-full px-4 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleAudienceProofValue(option.id, e.target.value)}
                        placeholder={option.placeholder}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note to Venue/Brand */}
      <div>
        <label className="block text-white text-base mb-4">
          Additional Notes:
        </label>
        <textarea
          value={formData.supportingInfo?.note || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              supportingInfo: {
                ...formData.supportingInfo,
                note: e.target.value,
              },
            })
          }
          placeholder={proposalType === 'communityToBrand' ? 'Anything important the brand should know?' : proposalType === 'communityToVenue' ? 'Anything important the venue should know?' : 'Anything important the community should know?'}
          className="w-full h-32 px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
    </div>
  );
};

export default SupportingInfoSection;
