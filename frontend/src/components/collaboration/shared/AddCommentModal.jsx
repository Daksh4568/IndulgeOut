import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddCommentModal = ({ isOpen, onClose, onSave, fieldName, existingComment = '' }) => {
  const [comment, setComment] = useState(existingComment);

  useEffect(() => {
    setComment(existingComment);
  }, [existingComment]);

  const handleSave = () => {
    onSave(comment);
    onClose();
  };

  const handleCancel = () => {
    setComment(existingComment); // Reset to original
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-2xl mx-4 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Add Comment</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-3">
            Your Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Enter your comment about the ${fieldName}...`}
            className="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            maxLength={120}
          />
          <div className="text-right text-xs text-gray-500 mt-2">
            {comment.length}/120 characters
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
            }}
            className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Save Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCommentModal;
