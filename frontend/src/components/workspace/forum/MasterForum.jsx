import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { api } from '../../../config/api';

const MasterForum = ({
  collaborationId,
  messages,
  myName,
  otherName,
  isLocked,
  onRefresh
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      setError('');

      const response = await api.post(`/workspace/${collaborationId}/forum`, {
        message: newMessage.trim()
      });

      if (response.data.success) {
        setNewMessage('');
        await onRefresh();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message');
      
      // Show error for 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (err) {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      if (isToday) {
        return 'Today';
      }
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (err) {
      return '';
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0a0a0a] border-b border-gray-800">
        <h3 className="text-lg font-bold text-white">{myName} × {otherName}</h3>
        <p className="text-sm text-gray-400 mt-0.5">Collaboration started</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-800"></div>
              <span className="text-xs text-gray-500 font-medium">{date}</span>
              <div className="flex-1 h-px bg-gray-800"></div>
            </div>

            {/* Messages for this date */}
            {msgs.map((message, index) => (
              <div key={index} className="mb-3">
                {message.messageType === 'system_notification' ? (
                  /* System Message */
                  <div className="flex justify-center">
                    <div className="px-3 py-1.5 bg-gray-800/50 text-gray-400 text-xs rounded-full">
                      {message.message}
                    </div>
                  </div>
                ) : (
                  /* User Message */
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">
                        {message.author.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isLocked && (
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSendMessage}>
            {error && (
              <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                rows={2}
                maxLength={500}
                disabled={sending}
                className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              {newMessage.length}/500 characters • Press Enter to send
            </p>
          </form>
        </div>
      )}

      {isLocked && (
        <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">Collaboration confirmed. Messages disabled.</p>
        </div>
      )}
    </div>
  );
};

export default MasterForum;
