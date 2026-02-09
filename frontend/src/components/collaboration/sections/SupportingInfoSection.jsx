import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const SupportingInfoSection = ({ formData, setFormData, proposalType }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = (files) => {
    const fileArray = Array.from(files);
    const currentImages = formData.supportingInfo?.images || [];
    
    // Limit to 10 images total
    const remainingSlots = 10 - currentImages.length;
    const newImages = fileArray.slice(0, remainingSlots).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    
    setFormData({
      ...formData,
      supportingInfo: {
        ...formData.supportingInfo,
        images: [...currentImages, ...newImages],
      },
    });
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
            <p className="text-gray-400 text-sm">Photos and notes help venues respond faster</p>
          </div>
        </div>
      </div>

      {/* Upload Past Event Photos */}
      <div>
        <label className="block text-white text-base mb-4">Upload past event photos</label>
        
        {/* Image Grid (if images exist) */}
        {currentImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
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
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area (always visible if under 10 images) */}
        {currentImages.length < 10 && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500 bg-opacity-5'
                : 'border-gray-800 bg-black hover:border-gray-700'
            }`}
            onClick={() => document.getElementById('image-upload').click()}
          >
            <input
              id="image-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <p className="text-indigo-400 font-medium mb-1">Click to upload photos</p>
                <p className="text-gray-500 text-sm">
                  Up to {10 - currentImages.length} more {10 - currentImages.length === 1 ? 'image' : 'images'} • PNG, JPG
                </p>
              </div>
            </div>
          </div>
        )}

        {currentImages.length === 10 && (
          <p className="text-green-400 text-sm mt-2">✓ Maximum 10 images uploaded</p>
        )}
      </div>

      {/* Note to Venue */}
      <div>
        <label className="block text-white text-base mb-4">
          Note to {proposalType === 'communityToVenue' ? 'venue' : proposalType === 'communityToBrand' ? 'brand' : 'community'}
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
          placeholder="Anything important the venue should know?"
          className="w-full h-32 px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
    </div>
  );
};

export default SupportingInfoSection;
