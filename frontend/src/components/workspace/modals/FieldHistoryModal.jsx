import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, Edit2, FileText, ThumbsUp } from 'lucide-react';
import { api } from '../../../config/api';

const FieldHistoryModal = ({
  isOpen,
  onClose,
  collaborationId,
  section,
  field,
  preloadedHistory
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (preloadedHistory) {
        setHistory(preloadedHistory);
        setLoading(false);
      } else {
        fetchHistory();
      }
    }
  }, [isOpen, section, field]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspace/${collaborationId}/history/${section}/${field}`);
      
      if (response.data.success) {
        setHistory(response.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return '';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'proposed':
        return <FileText className="w-4 h-4" />;
      case 'accepted':
        return <Check className="w-4 h-4" />;
      case 'modified':
      case 'updated':
        return <Edit2 className="w-4 h-4" />;
      case 'agreed':
        return <ThumbsUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'proposed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'accepted':
      case 'agreed':
        return 'bg-[#7878E9]/10 text-[#7878E9] border-[#7878E9]/20';
      case 'modified':
      case 'updated':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'declined':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-600 italic">Not set</span>;
    }

    if (typeof value === 'object') {
      // Date objects
      if (value.date) {
        return `${value.date} ${value.startTime || ''} ${value.endTime ? `- ${value.endTime}` : ''}`.trim();
      }
      if (value.startDate) {
        const formatDatePart = (d) => {
          if (typeof d === 'object' && d !== null) {
            const parts = [d.date || ''];
            if (d.startTime) parts.push(d.startTime);
            if (d.endTime) parts.push(`- ${d.endTime}`);
            return parts.join(' ');
          }
          return d || '';
        };
        const start = formatDatePart(value.startDate);
        const end = value.endDate ? ` to ${formatDatePart(value.endDate)}` : '';
        const flex = value.flexible ? ' (Flexible)' : '';
        return `${start}${end}${flex}`;
      }
      // Sub-options objects - show selected keys as chips
      if (!Array.isArray(value)) {
        const selectedKeys = Object.entries(value)
          .filter(([k, v]) => v === true || (typeof v === 'object' && v?.selected === true))
          .map(([k]) => k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        if (selectedKeys.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {selectedKeys.map(k => (
                <span key={k} className="px-2 py-0.5 bg-gray-800 text-white text-xs rounded border border-gray-700">{k}</span>
              ))}
            </div>
          );
        }
      }
      // Arrays
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return JSON.stringify(value);
    }

    return String(value);
  };

  const fieldLabel = field.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white">View History</h3>
            <p className="text-sm text-gray-400 mt-1">{fieldLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7878E9' }} />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={index} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)}
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-px h-full bg-gray-800 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4">
                      {/* Action Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold capitalize">
                            {entry.action}
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            by {entry.changedBy.name}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>

                      {/* Value Changes */}
                      {entry.action !== 'agreed' && (
                        <div className="space-y-2">
                          {entry.previousValue !== null && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Previous value:</p>
                              <p className="text-sm text-gray-400 bg-gray-900/50 px-3 py-2 rounded border border-gray-800">
                                {formatValue(entry.previousValue)}
                              </p>
                            </div>
                          )}
                          {entry.newValue !== null && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">New value:</p>
                              <p className="text-sm text-white bg-gray-900/50 px-3 py-2 rounded border border-gray-700">
                                {formatValue(entry.newValue)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldHistoryModal;
