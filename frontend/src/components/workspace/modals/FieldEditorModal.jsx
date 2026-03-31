import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { api } from '../../../config/api';
import { getFieldDefinition } from '../../../config/fieldDefinitions';

const FieldEditorModal = ({
  isOpen,
  onClose,
  collaborationId,
  collaboration,
  workspace,
  section,
  field,
  isInitiator,
  onSave
}) => {
  const [value, setValue] = useState(null);
  const [agrees, setAgrees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fieldDefinition = getFieldDefinition(field);
  const isReadOnly = fieldDefinition.type === 'readonly';

  useEffect(() => {
    if (isOpen && section && field) {
      // Get current value from workspace sections data
      let currentValue;
      if (workspace?.sections) {
        const wsSection = workspace.sections.find(s => s.key === section);
        const wsField = wsSection?.fields?.find(f => f.key === field);
        if (wsField) {
          currentValue = isInitiator ? wsField.initiatorValue : wsField.recipientValue;
        }
      }
      
      // Fallback to formData if workspace value not found
      if (currentValue === undefined || currentValue === null) {
        currentValue = isInitiator 
          ? (collaboration?.formData?.[section]?.[field] || collaboration?.formData?.[field])
          : collaboration?.response?.counterOffer?.fieldResponses?.[field]?.modifiedValue;
      }
      
      setValue(currentValue !== undefined && currentValue !== null ? currentValue : getDefaultValue());
    }
  }, [isOpen, workspace, collaboration, section, field, isInitiator]);

  const getDefaultValue = () => {
    switch (fieldDefinition.type) {
      case 'multi-select':
        return [];
      case 'selectable-card':
      case 'checkbox-group':
        return {};
      case 'pricing-model':
        return '';
      case 'number':
        return '';
      case 'daterange':
      case 'event-datetime':
        return {};
      default:
        return '';
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await api.put(`/workspace/${collaborationId}/field`, {
        section,
        field,
        value,
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

  const isValueValid = () => {
    if (isReadOnly) return false;
    
    switch (fieldDefinition.type) {
      case 'text':
      case 'select':
        return value && value.toString().trim().length > 0;
      case 'number':
        return value !== '' && value !== null && !isNaN(value);
      case 'multi-select':
        return Array.isArray(value) && value.length > 0;
      case 'selectable-card':
      case 'checkbox-group':
        if (typeof value === 'object' && value !== null) {
          return Object.keys(value).some(k => value[k] === true || value[k]?.selected === true);
        }
        return !!value;
      case 'pricing-model':
        return value !== '' && value !== null && value !== undefined;
      case 'daterange':
      case 'event-datetime':
        return value && typeof value === 'object' && (value.date || value.startDate);
      default:
        return true;
    }
  };

  const renderFieldInput = () => {
    if (isReadOnly) {
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            This field is read-only reference information.
          </p>
          <div className="mt-3 p-3 bg-gray-800 rounded-lg">
            <p className="text-white">{String(value || 'Not provided')}</p>
          </div>
        </div>
      );
    }

    switch (fieldDefinition.type) {
      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-white mb-3">Select an option</label>
            <div className="grid grid-cols-2 gap-3">
              {fieldDefinition.options.map(option => (
                <button
                  key={option}
                  onClick={() => setValue(option)}
                  className={`py-3 px-4 rounded-xl border-2 transition-all text-left ${
                    value === option
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'multi-select':
        return (
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Select all that apply
            </label>
            <div className="grid grid-cols-2 gap-3">
              {fieldDefinition.options.map(option => {
                const isSelected = Array.isArray(value) && value.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => {
                      const newValue = isSelected
                        ? value.filter(v => v !== option)
                        : [...(Array.isArray(value) ? value : []), option];
                      setValue(newValue);
                    }}
                    className={`py-3 px-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500 text-white'
                        : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {fieldDefinition.allowCustom && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Or enter custom value..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      setValue([...(Array.isArray(value) ? value : []), e.target.value.trim()]);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        );

      case 'selectable-card': {
        // Render like select/multi-select: grid cards with sub-option chips
        const subOptions = fieldDefinition.subOptions || [];
        const currentValue = (typeof value === 'object' && value !== null) ? value : {};
        
        return (
          <div>
            {fieldDefinition.description && (
              <p className="text-sm text-gray-400 mb-4">{fieldDefinition.description}</p>
            )}
            
            {subOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Select specific needs:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {subOptions.map(subOpt => {
                    const isSubSelected = currentValue[subOpt.id] === true || currentValue[subOpt.id]?.selected === true;
                    return (
                      <button
                        key={subOpt.id}
                        onClick={() => {
                          const newValue = { ...currentValue };
                          if (isSubSelected) {
                            delete newValue[subOpt.id];
                          } else {
                            newValue[subOpt.id] = { selected: true };
                          }
                          setValue(newValue);
                        }}
                        className={`py-3 px-4 rounded-xl border-2 transition-all text-left ${
                          isSubSelected
                            ? 'bg-indigo-500/10 border-indigo-500 text-white'
                            : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        {subOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {subOptions.length === 0 && (
              <p className="text-sm text-gray-400">No specific sub-options for this field.</p>
            )}
          </div>
        );
      }

      case 'pricing-model': {
        // Render pricing model like PricingSection: percentage buttons or amount input
        const { inputType, options, placeholder } = fieldDefinition;
        const currentStr = typeof value === 'string' ? value : (typeof value === 'number' ? String(value) : '');

        return (
          <div>
            {fieldDefinition.description && (
              <p className="text-sm text-gray-400 mb-4">{fieldDefinition.description}</p>
            )}

            {inputType === 'percentage' && options ? (
              <div>
                <label className="block text-sm font-medium text-white mb-3">Select percentage</label>
                <div className="flex flex-wrap gap-3">
                  {options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setValue(opt)}
                      className={`px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                        value === opt
                          ? 'bg-gray-800 border border-gray-600 text-white'
                          : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : inputType === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Enter details</label>
                <input
                  type="text"
                  value={currentStr}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder || 'Enter value'}
                  className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Enter amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={currentStr}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder || 'Enter amount'}
                    className="w-full pl-8 pr-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'event-datetime':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date</label>
              <input
                type="date"
                value={value?.date || ''}
                onChange={(e) => setValue({ ...value, date: e.target.value })}
                className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Time</label>
                <input
                  type="time"
                  value={value?.startTime || ''}
                  onChange={(e) => setValue({ ...value, startTime: e.target.value })}
                  className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Time</label>
                <input
                  type="time"
                  value={value?.endTime || ''}
                  onChange={(e) => setValue({ ...value, endTime: e.target.value })}
                  className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 'daterange':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Date</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">DATE</label>
                  <input
                    type="date"
                    value={typeof value?.startDate === 'object' ? value?.startDate?.date || '' : value?.startDate || ''}
                    onChange={(e) => {
                      const current = typeof value?.startDate === 'object' ? value.startDate : { date: value?.startDate || '', startTime: '', endTime: '' };
                      setValue({ ...value, startDate: { ...current, date: e.target.value } });
                    }}
                    className="w-full px-3 py-2.5 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">START TIME</label>
                  <input
                    type="time"
                    value={typeof value?.startDate === 'object' ? value?.startDate?.startTime || '' : ''}
                    onChange={(e) => {
                      const current = typeof value?.startDate === 'object' ? value.startDate : { date: value?.startDate || '', startTime: '', endTime: '' };
                      setValue({ ...value, startDate: { ...current, startTime: e.target.value } });
                    }}
                    className="w-full px-3 py-2.5 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">END TIME</label>
                  <input
                    type="time"
                    value={typeof value?.startDate === 'object' ? value?.startDate?.endTime || '' : ''}
                    onChange={(e) => {
                      const current = typeof value?.startDate === 'object' ? value.startDate : { date: value?.startDate || '', startTime: '', endTime: '' };
                      setValue({ ...value, startDate: { ...current, endTime: e.target.value } });
                    }}
                    className="w-full px-3 py-2.5 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">End Date</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">DATE</label>
                  <input
                    type="date"
                    value={typeof value?.endDate === 'object' ? value?.endDate?.date || '' : value?.endDate || ''}
                    onChange={(e) => {
                      const current = typeof value?.endDate === 'object' ? value.endDate : { date: value?.endDate || '', startTime: '', endTime: '' };
                      setValue({ ...value, endDate: { ...current, date: e.target.value } });
                    }}
                    className="w-full px-3 py-2.5 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">START TIME</label>
                  <input
                    type="time"
                    value={typeof value?.endDate === 'object' ? value?.endDate?.startTime || '' : ''}
                    onChange={(e) => {
                      const current = typeof value?.endDate === 'object' ? value.endDate : { date: value?.endDate || '', startTime: '', endTime: '' };
                      setValue({ ...value, endDate: { ...current, startTime: e.target.value } });
                    }}
                    className="w-full px-3 py-2.5 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">END TIME</label>
                  <input
                    type="time"
                    value={typeof value?.endDate === 'object' ? value?.endDate?.endTime || '' : ''}
                    onChange={(e) => {
                      const current = typeof value?.endDate === 'object' ? value.endDate : { date: value?.endDate || '', startTime: '', endTime: '' };
                      setValue({ ...value, endDate: { ...current, endTime: e.target.value } });
                    }}
                    className="w-full px-3 py-2.5 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={value?.flexible || false}
                onChange={(e) => setValue({ ...value, flexible: e.target.checked })}
                className="rounded border-gray-600 text-[#7878E9]"
              />
              Flexible on dates
            </label>
          </div>
        );

      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Enter value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={fieldDefinition.min || 0}
              max={fieldDefinition.max}
              className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
              placeholder={`Enter ${fieldDefinition.label.toLowerCase()}`}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Enter value</label>
            <textarea
              value={value || ''}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder={`Enter ${fieldDefinition.label.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] flex items-center justify-between px-6 py-4 border-b border-gray-800 z-10">
          <div>
            <h3 className="text-xl font-bold text-white">Edit Field</h3>
            <p className="text-sm text-gray-400 mt-1">{fieldDefinition.label}</p>
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

          {renderFieldInput()}
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="sticky bottom-0 bg-[#1a1a1a] flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isValueValid()}
              className="flex items-center gap-2 px-5 py-2 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
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
        )}
      </div>
    </div>
  );
};

export default FieldEditorModal;
