import React from 'react';
import { Calendar, MapPin, Check, X, Save, Loader2, Clock } from 'lucide-react';

const WorkspaceStickyBar = ({
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  isLocked,
  hasMyConfirmed,
  isFullyLocked,
  saving,
  confirming,
  onSave,
  onExit,
  onConfirm
}) => {
  const formatDate = (dateInput) => {
    if (!dateInput) return 'Date TBD';
    
    // Handle object format: {date: '2026-03-15', startTime: '10:00', endTime: '18:00'}
    if (typeof dateInput === 'object' && dateInput !== null) {
      const dateStr = dateInput.date || dateInput.startDate;
      if (!dateStr) return 'Date TBD';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      } catch (err) {
        return dateStr;
      }
    }
    
    // Handle plain string
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return dateInput;
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (err) {
      return dateInput;
    }
  };

  const formatTime = (dateInput, timeStr) => {
    // If explicit time string provided
    if (timeStr) return timeStr;
    
    // If date is object with time
    if (typeof dateInput === 'object' && dateInput !== null) {
      const parts = [];
      if (dateInput.startTime) parts.push(dateInput.startTime);
      if (dateInput.endTime) parts.push(dateInput.endTime);
      return parts.join(' - ');
    }
    return '';
  };

  const displayTime = formatTime(eventDate, eventTime);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Event Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-white">
              <span className="font-semibold">{eventName}</span>
            </div>
            
            <div className="flex items-center gap-4 text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(eventDate)}</span>
              </div>

              {displayTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{displayTime}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{eventLocation}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!isLocked && (
              <>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  onClick={onExit}
                  disabled={saving || confirming}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                  Exit Collaboration
                </button>

                <button
                  onClick={onConfirm}
                  disabled={saving || confirming}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-[#3D3DD4] rounded-full font-semibold transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm Collaboration
                    </>
                  )}
                </button>
              </>
            )}

            {isLocked && hasMyConfirmed && !isFullyLocked && (
              <div className="flex items-center gap-2 px-6 py-2 bg-white/10 rounded-full font-semibold text-white backdrop-blur-sm">
                <Check className="w-5 h-5" />
                You Confirmed · Waiting for Other Party
              </div>
            )}
            {isFullyLocked && (
              <div className="flex items-center gap-2 px-6 py-2 bg-white text-[#3D3DD4] rounded-full font-semibold">
                <Check className="w-5 h-5" />
                Collaboration Confirmed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceStickyBar;
