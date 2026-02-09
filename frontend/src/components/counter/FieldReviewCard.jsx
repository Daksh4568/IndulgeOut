import React, { useState } from 'react';

const FieldReviewCard = ({ 
  fieldName, 
  originalValue, 
  proposedLabel = "COMMUNITY PROPOSED",
  backupLabel = "BACKUP",
  onResponseChange,
  initialResponse = { action: null, modifiedValue: '', note: '' },
  showBackup = false,
  backupValue = null,
  allowModify = true,
  modifyPlaceholder = "Enter your modification..."
}) => {
  const [response, setResponse] = useState(initialResponse);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showModifyInput, setShowModifyInput] = useState(initialResponse.action === 'modify');

  const handleActionChange = (action) => {
    const newResponse = {
      ...response,
      action,
      modifiedValue: action === 'modify' ? response.modifiedValue : '',
      note: response.note
    };
    setResponse(newResponse);
    setShowModifyInput(action === 'modify');
    onResponseChange(newResponse);
  };

  const handleModifiedValueChange = (value) => {
    const newResponse = { ...response, modifiedValue: value };
    setResponse(newResponse);
    onResponseChange(newResponse);
  };

  const handleNoteChange = (value) => {
    const newResponse = { ...response, note: value };
    setResponse(newResponse);
    onResponseChange(newResponse);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-gray-300 text-sm font-medium mb-2">{fieldName}</h4>
      
      {/* Original Value */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">{proposedLabel}</p>
        <p className="text-white text-sm">{originalValue}</p>
      </div>

      {/* Backup Value (if applicable) */}
      {showBackup && backupValue && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">{backupLabel}</p>
          <p className="text-white text-sm">{backupValue}</p>
        </div>
      )}

      {/* Modified Value Input */}
      {showModifyInput && allowModify && (
        <div className="mb-3">
          <input
            type="text"
            value={response.modifiedValue}
            onChange={(e) => handleModifiedValueChange(e.target.value)}
            placeholder={modifyPlaceholder}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => handleActionChange('accept')}
          className={`py-2 px-3 rounded text-sm font-medium transition-all ${
            response.action === 'accept'
              ? 'bg-green-700 text-white border-2 border-green-500'
              : 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
          }`}
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Accept
        </button>

        {allowModify && (
          <button
            onClick={() => handleActionChange('modify')}
            className={`py-2 px-3 rounded text-sm font-medium transition-all ${
              response.action === 'modify'
                ? 'bg-yellow-700 text-white border-2 border-yellow-500'
                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700 hover:bg-yellow-900/50'
            }`}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modify
          </button>
        )}

        <button
          onClick={() => handleActionChange('decline')}
          className={`py-2 px-3 rounded text-sm font-medium transition-all ${
            response.action === 'decline'
              ? 'bg-red-800 text-white border-2 border-red-600'
              : 'bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50'
          } ${!allowModify ? 'col-span-1' : ''}`}
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {allowModify ? 'Decline' : "Can't provide"}
        </button>
      </div>

      {/* Add Note Button/Input */}
      {!showNoteInput ? (
        <button
          onClick={() => setShowNoteInput(true)}
          className="text-blue-400 text-xs hover:text-blue-300 flex items-center"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Add note (optional)
        </button>
      ) : (
        <div>
          <textarea
            value={response.note}
            onChange={(e) => handleNoteChange(e.target.value)}
            maxLength={120}
            placeholder="Add a note about this field (max 120 characters)..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
            rows="2"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">{response.note.length}/120</span>
            <button
              onClick={() => setShowNoteInput(false)}
              className="text-xs text-gray-400 hover:text-gray-300"
            >
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldReviewCard;
