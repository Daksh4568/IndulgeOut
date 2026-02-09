import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const EventInfoSection = ({ formData, setFormData, proposalType }) => {
  const eventTypes = [
    'Music & Concerts',
    'Comedy & Standup',
    'Art & Exhibitions',
    'Food & Culinary',
    'Workshops',
    'Networking',
  ];

  const attendeeRanges = ['10-20', '20-40', '40-80', '80+'];
  const capacityRanges = ['10-20', '20-40', '40-80', '80+'];

  const handleEventTypeSelect = (type) => {
    setFormData({ ...formData, eventType: type });
  };

  const handleAttendeeSelect = (range) => {
    setFormData({ ...formData, expectedAttendees: range });
  };

  const handleCapacitySelect = (range) => {
    setFormData({ ...formData, seatingCapacity: range });
  };

  const handleDateChange = (field, value) => {
    setFormData({
      ...formData,
      eventDate: { ...formData.eventDate, [field]: value },
    });
  };

  const toggleBackupDate = () => {
    setFormData({
      ...formData,
      showBackupDate: !formData.showBackupDate,
    });
  };

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
            1
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">EVENT DETAILS</h2>
            <p className="text-gray-400 text-sm">Basic information about your event</p>
          </div>
        </div>
      </div>

      {/* Question 1: Event Type */}
      <div>
        <label className="block text-white text-base mb-4">
          1. What type of event is this?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleEventTypeSelect(type)}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 text-left ${
                formData.eventType === type
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Question 2: Expected Attendees */}
      <div>
        <label className="block text-white text-base mb-4">
          2. How many people do you expect?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {attendeeRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleAttendeeSelect(range)}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 ${
                formData.expectedAttendees === range
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Question 3: Seating Capacity */}
      <div>
        <label className="block text-white text-base mb-4">
          3. What seating capacity do you need?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {capacityRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleCapacitySelect(range)}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 ${
                formData.seatingCapacity === range
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Question 4: Event Date and Time */}
      <div>
        <label className="block text-white text-base mb-4">
          4. When do you want to host this event?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">DATE</label>
            <div className="relative">
              <input
                type="date"
                value={formData.eventDate?.date || ''}
                onChange={(e) => handleDateChange('date', e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Calendar className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">START TIME</label>
            <div className="relative">
              <input
                type="time"
                value={formData.eventDate?.startTime || ''}
                onChange={(e) => handleDateChange('startTime', e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Clock className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">END TIME</label>
            <div className="relative">
              <input
                type="time"
                value={formData.eventDate?.endTime || ''}
                onChange={(e) => handleDateChange('endTime', e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Clock className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Add Backup Date Option */}
        <button
          onClick={toggleBackupDate}
          className="mt-4 text-indigo-400 text-sm hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          + Add backup date option
        </button>

        {/* Backup Date Fields (shown if toggled) */}
        {formData.showBackupDate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <div>
              <label className="block text-gray-400 text-sm mb-2">BACKUP DATE</label>
              <input
                type="date"
                value={formData.backupDate?.date || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    backupDate: { ...formData.backupDate, date: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">START TIME</label>
              <input
                type="time"
                value={formData.backupDate?.startTime || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    backupDate: { ...formData.backupDate, startTime: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">END TIME</label>
              <input
                type="time"
                value={formData.backupDate?.endTime || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    backupDate: { ...formData.backupDate, endTime: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventInfoSection;
