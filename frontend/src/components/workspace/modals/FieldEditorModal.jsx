import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { api } from '../../../config/api';

const FieldEditorModal = ({
  isOpen,
  onClose,
  collaborationId,
  collaboration,
  section,
  field,
  isInitiator,
  onSave
}) => {
  const [value, setValue] = useState('');
  const [agrees, setAgrees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && collaboration && section && field) {
      // Get current value from workspace
      const currentValue = isInitiator 
        ? collaboration.formData?.[field]
        : collaboration.response?.counterOffer?.fieldResponses?.[field]?.modifiedValue;
      
      if (currentValue !== undefined && currentValue !== null) {
        if (typeof currentValue === 'object') {
          setValue(JSON.stringify(currentValue, null, 2));
        } else {
          setValue(String(currentValue));
        }
      }
    }
  }, [isOpen, collaboration, section, field, isInitiator]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Parse value if it looks like JSON
      let parsedValue = value;
      if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      const response = await api.put(`/workspace/${collaborationId}/field`, {
        section,
        field,
        value: parsedValue,
        agrees
      });

      if (response.data.success) {
        await onSave();
        onClose();
      }
    } catch (err) {
      console.error('Error saving field:', err);
      setError(err.response?.data?.error || 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const fieldLabel = field.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white">Edit Field</h3>
            <p className="text-sm text-gray-400 mt-1">{fieldLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Value
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Enter field value..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the value for this field. For complex fields (dates, objects), you can use JSON format.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg">
            <input
              type="checkbox"
              id="agrees"
              checked={agrees}
              onChange={(e) => setAgrees(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="agrees" className="text-sm text-white">
              I agree with this value
            </label>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <p className="text-xs text-purple-400">
              💡 <strong>Tip:</strong> Make sure both parties agree on the value before confirming the collaboration. 
              You can continue editing until the final confirmation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !value.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Field
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldEditorModal;
