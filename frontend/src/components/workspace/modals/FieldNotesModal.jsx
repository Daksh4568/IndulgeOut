import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { api } from '../../../config/api';

const FieldNotesModal = ({
  isOpen,
  onClose,
  collaborationId,
  section,
  field,
  myName,
  onRefresh,
  preloadedNotes,
  isReadOnly
}) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (preloadedNotes) {
        setNotes(preloadedNotes);
        setLoading(false);
      } else {
        fetchNotes();
      }
    }
  }, [isOpen, section, field]);

  useEffect(() => {
    scrollToBottom();
  }, [notes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspace/${collaborationId}/notes/${section}/${field}`);
      
      if (response.data.success) {
        setNotes(response.data.notes || []);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) return;

    try {
      setSending(true);
      setError('');

      const response = await api.post(`/workspace/${collaborationId}/notes`, {
        section,
        field,
        message: newNote.trim()
      });

      if (response.data.success) {
        setNewNote('');
        await fetchNotes();
        await onRefresh();
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError(err.response?.data?.error || 'Failed to add note');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return '';
    }
  };

  const fieldLabel = field.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white">Notes: {fieldLabel}</h3>
            <p className="text-sm text-gray-400 mt-1">Field-specific discussion</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7878E9' }} />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No notes yet. Add the first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">
                      {note.author.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(note.createdAt)}
                    </span>
                  </div>
                  <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {note.message}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {!isReadOnly && (
        <div className="px-6 py-4 border-t border-gray-800">
          <form onSubmit={handleAddNote}>
            {error && (
              <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                maxLength={500}
                disabled={sending}
                className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#7878E9] resize-none disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !newNote.trim()}
                className="p-2.5 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              {newNote.length}/500 characters • No contact info allowed
            </p>
          </form>
        </div>
        )}
      </div>
    </div>
  );
};

export default FieldNotesModal;
