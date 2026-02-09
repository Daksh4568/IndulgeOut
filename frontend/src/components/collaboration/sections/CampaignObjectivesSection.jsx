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
    </div>
  );
};

export default CampaignObjectivesSection;
