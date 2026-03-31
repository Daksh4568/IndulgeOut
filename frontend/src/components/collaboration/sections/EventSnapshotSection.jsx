import React from 'react';

const EventSnapshotSection = ({ formData, setFormData }) => {
  const eventCategories = [
    'Social Mixers',
    'Wellness, Fitness & Sports',
    'Art, Music & Dance',
    'Immersive',
    'Food & Beverage',
    'Games',
  ];

  const attendeeRanges = ['20-40', '40-80', '80-150', '150+'];
  
  const eventFormats = [
    'Workshop',
    'Mixer / Social',
    'Tournament',
    'Performance / Show',
    'Panel / Talk',
    'Experiential / Activation',
  ];
  
  const targetAudienceOptions = [
    'Students',
    'Young professionals',
    'Founders / Creators',
    'Families',
    'Niche community',
  ];
  
  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Others'];

  const handleDateChange = (field, value) => {
    const currentDate = formData.eventDate && typeof formData.eventDate === 'object' ? formData.eventDate : { date: '', startTime: '', endTime: '' };
    setFormData({ ...formData, eventDate: { ...currentDate, [field]: value } });
  };

  const toggleBackupDate = () => {
    setFormData({
      ...formData,
      showBackupDate: !formData.showBackupDate,
      backupDate: !formData.showBackupDate ? { date: '', startTime: '', endTime: '' } : formData.backupDate,
    });
  };
  
  const handleFormatToggle = (format) => {
    const formats = formData.eventFormat || [];
    const updatedFormats = formats.includes(format)
      ? formats.filter(f => f !== format)
      : [...formats, format];
    setFormData({ ...formData, eventFormat: updatedFormats });
  };
  
  const handleAudienceToggle = (audience) => {
    const audiences = formData.targetAudience || [];
    const updatedAudiences = audiences.includes(audience)
      ? audiences.filter(a => a !== audience)
      : [...audiences, audience];
    setFormData({ ...formData, targetAudience: updatedAudiences });
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
            <h2 className="text-white text-xl font-semibold">EVENT SNAPSHOT</h2>
            <p className="text-gray-400 text-sm">Tell the brand about your event</p>
          </div>
        </div>
      </div>

      {/* Event Category */}
      <div>
        <label className="block text-white text-base mb-4">
          1. Event Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {eventCategories.map((category) => (
            <button
              key={category}
              onClick={() => setFormData({ ...formData, eventCategory: category })}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 text-left ${
                formData.eventCategory === category
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Expected Attendees */}
      <div>
        <label className="block text-white text-base mb-4">
          2. Expected Attendees <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {attendeeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setFormData({ ...formData, expectedAttendees: range })}
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

      {/* Event Format */}
      <div>
        <label className="block text-white text-base mb-4">
          3. Event Format <span className="text-red-500">*</span>
        </label>
        <p className="text-gray-400 text-sm mb-3">Select all formats that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {eventFormats.map((format) => (
            <button
              key={format}
              onClick={() => handleFormatToggle(format)}
              className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                formData.eventFormat?.includes(format)
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-white text-base mb-4">
          4. Target Audience <span className="text-red-500">*</span>
        </label>
        <p className="text-gray-400 text-sm mb-3">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {targetAudienceOptions.map((audience) => (
            <button
              key={audience}
              onClick={() => handleAudienceToggle(audience)}
              className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                formData.targetAudience?.includes(audience)
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {audience}
            </button>
          ))}
        </div>
        {formData.targetAudience?.includes('Niche community') && (
          <div className="mt-3">
            <input
              type="text"
              value={formData.nicheAudienceDetails || ''}
              onChange={(e) => setFormData({ ...formData, nicheAudienceDetails: e.target.value })}
              placeholder="Describe your niche community..."
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Event Date & Time */}
      <div>
        <label className="block text-white text-base mb-4">
          5. Event Date <span className="text-red-500">*</span>
        </label>
        <div className=" rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">DATE</label>
              <input
                type="date"
                value={(typeof formData.eventDate === 'object' ? formData.eventDate?.date : formData.eventDate) || ''}
                onChange={(e) => handleDateChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">START TIME</label>
              <input
                type="time"
                value={(typeof formData.eventDate === 'object' ? formData.eventDate?.startTime : '') || ''}
                onChange={(e) => handleDateChange('startTime', e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">END TIME</label>
              <input
                type="time"
                value={(typeof formData.eventDate === 'object' ? formData.eventDate?.endTime : '') || ''}
                onChange={(e) => handleDateChange('endTime', e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={toggleBackupDate}
            className="mt-4 text-indigo-400 text-sm hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            {formData.showBackupDate ? '− Remove backup date' : '+ Add backup date option'}
          </button>

          {formData.showBackupDate && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">BACKUP DATE</label>
                <input
                  type="date"
                  value={formData.backupDate?.date || ''}
                  onChange={(e) => setFormData({ ...formData, backupDate: { ...formData.backupDate, date: e.target.value } })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">START TIME</label>
                <input
                  type="time"
                  value={formData.backupDate?.startTime || ''}
                  onChange={(e) => setFormData({ ...formData, backupDate: { ...formData.backupDate, startTime: e.target.value } })}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">END TIME</label>
                <input
                  type="time"
                  value={formData.backupDate?.endTime || ''}
                  onChange={(e) => setFormData({ ...formData, backupDate: { ...formData.backupDate, endTime: e.target.value } })}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-white text-base mb-4">
          6. City <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => {
                if (city === 'Others') {
                  setFormData({ ...formData, city: 'Others', customCity: '' });
                } else {
                  setFormData({ ...formData, city, customCity: undefined });
                }
              }}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 ${
                city === 'Others'
                  ? (formData.city === 'Others' || (formData.city && !cities.slice(0, -1).includes(formData.city)))
                    ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                    : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
                  : formData.city === city
                    ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                    : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
        {(formData.city === 'Others' || (formData.city && !cities.slice(0, -1).includes(formData.city))) && (
          <div className="mt-3">
            <input
              type="text"
              value={formData.city === 'Others' ? (formData.customCity || '') : formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value || 'Others', customCity: e.target.value })}
              placeholder="Enter your city name..."
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSnapshotSection;
