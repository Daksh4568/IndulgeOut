import React from 'react';

const EventSnapshotSection = ({ formData, setFormData }) => {
  const eventCategories = [
    'Music & Concerts',
    'Comedy & Standup',
    'Art & Exhibitions',
    'Food & Culinary',
    'Workshops',
    'Networking',
  ];

  const attendeeRanges = ['50-100', '100-250', '250-500', '500+'];
  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune'];

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

      {/* Target Audience */}
      <div>
        <label className="block text-white text-base mb-4">
          3. Target Audience Description
        </label>
        <textarea
          value={formData.targetAudience || ''}
          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
          placeholder="E.g., Young professionals aged 25-35, tech enthusiasts, startups..."
          className="w-full h-24 px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-white text-base mb-4">
          4. City <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setFormData({ ...formData, city })}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 ${
                formData.city === city
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventSnapshotSection;
