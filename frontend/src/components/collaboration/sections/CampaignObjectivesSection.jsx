import React from 'react';

const CampaignObjectivesSection = ({ formData, setFormData }) => {
  const objectives = [
    { id: 'brand_awareness', label: 'Brand Awareness', icon: '📢' },
    { id: 'product_trials', label: 'Product Trials', icon: '🎯' },
    { id: 'lead_generation', label: 'Lead Generation', icon: '📊' },
    { id: 'sales', label: 'Direct Sales', icon: '💰' },
    { id: 'engagement', label: 'Community Engagement', icon: '🤝' },
  ];

  const eventFormats = [
    'Music & Concerts',
    'Comedy Shows',
    'Workshops',
    'Networking Events',
    'Food & Cultural',
    'Sports & Fitness',
  ];
  
  const cities = [
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata',
    'Any City',
  ];

  const handleObjectiveToggle = (objectiveId) => {
    const updatedObjectives = { ...(formData.campaignObjectives || {}) };
    if (updatedObjectives[objectiveId]) {
      delete updatedObjectives[objectiveId];
    } else {
      updatedObjectives[objectiveId] = true;
    }
    setFormData({ ...formData, campaignObjectives: updatedObjectives });
  };

  const handleFormatToggle = (format) => {
    const formats = formData.preferredFormats || [];
    const updatedFormats = formats.includes(format)
      ? formats.filter(f => f !== format)
      : [...formats, format];
    setFormData({ ...formData, preferredFormats: updatedFormats });
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
            <h2 className="text-white text-xl font-semibold">CAMPAIGN OBJECTIVES</h2>
            <p className="text-gray-400 text-sm">What do you want to achieve?</p>
          </div>
        </div>
      </div>

      {/* Campaign Objectives */}
      <div>
        <label className="block text-white text-base mb-4">
          1. Select your campaign objectives <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {objectives.map((objective) => (
            <button
              key={objective.id}
              onClick={() => handleObjectiveToggle(objective.id)}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                formData.campaignObjectives?.[objective.id]
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <span className="text-2xl">{objective.icon}</span>
              <span>{objective.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-white text-base mb-4">
          2. Target Audience <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.targetAudience || ''}
          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
          placeholder="Describe your ideal audience: age group, interests, demographics..."
          className="w-full h-24 px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Preferred Event Formats */}
      <div>
        <label className="block text-white text-base mb-4">
          3. Preferred Event Formats
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {eventFormats.map((format) => (
            <button
              key={format}
              onClick={() => handleFormatToggle(format)}
              className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                formData.preferredFormats?.includes(format)
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-white text-base mb-4">
          4. City <span className="text-red-500">*</span>
        </label>
        <p className="text-gray-400 text-sm mb-3">Where do you want to collaborate?</p>
        <select
          value={formData.city || ''}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Preferred Timeline */}
      <div>
        <label className="block text-white text-base mb-4">
          5. Preferred Timeline <span className="text-red-500">*</span>
        </label>
        <p className="text-gray-400 text-sm mb-3">When do you want to run this campaign?</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={formData.timeline?.startDate || ''}
              onChange={(e) => setFormData({
                ...formData,
                timeline: { ...formData.timeline, startDate: e.target.value }
              })}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={formData.timeline?.endDate || ''}
              onChange={(e) => setFormData({
                ...formData,
                timeline: { ...formData.timeline, endDate: e.target.value }
              })}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="flexible-dates"
            checked={formData.timeline?.flexible || false}
            onChange={(e) => setFormData({
              ...formData,
              timeline: { ...formData.timeline, flexible: e.target.checked }
            })}
            className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
          />
          <label htmlFor="flexible-dates" className="text-gray-300 cursor-pointer">
            Flexible on dates
          </label>
        </div>
      </div>
    </div>
  );
};

export default CampaignObjectivesSection;
