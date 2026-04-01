import React from 'react';

const CampaignObjectivesSection = ({ formData, setFormData }) => {
  const objectives = [
    { id: 'brand_awareness', label: 'Brand Awareness' },
    { id: 'product_trials', label: 'Product Trial / Sampling' },
    { id: 'lead_generation', label: 'Lead Generation' },
    { id: 'sales', label: 'Sales Conversion' },
    { id: 'engagement', label: 'Community Engagement' },
    { id: 'market_testing', label: 'Market Testing' },
    { id: 'content_creation', label: 'Content Creation' },
  ];

  const eventFormats = [
    'Workshop',
    'Mixer / Social',
    'Tournament',
    'Performance / Show',
    'Panel / Talk',
    'Experiential / Activation',
    'Open to suggestions',
  ];

  const audienceOptions = [
    { id: 'students', label: 'Students' },
    { id: 'young_professionals', label: 'Young Professionals' },
    { id: 'founders_creators', label: 'Founders / Creators' },
    { id: 'families', label: 'Families' },
    { id: 'niche_community', label: 'Niche Community' },
  ];
  
  const cities = [
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Pune',
    'Kolkata',
    'Any City',
    'Others',
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

  const handleAudienceToggle = (audienceId) => {
    const audiences = formData.targetAudience || [];
    const updatedAudiences = audiences.includes(audienceId)
      ? audiences.filter(a => a !== audienceId)
      : [...audiences, audienceId];
    setFormData({ ...formData, targetAudience: updatedAudiences });
  };

  const handleDateChange = (field, value) => {
    const current = typeof formData.eventDate === 'object' ? formData.eventDate : { date: '', startTime: '', endTime: '' };
    setFormData({
      ...formData,
      eventDate: { ...current, [field]: value }
    });
  };

  const handleBackupDateChange = (field, value) => {
    const current = formData.backupDate || { date: '', startTime: '', endTime: '' };
    setFormData({
      ...formData,
      backupDate: { ...current, [field]: value }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {audienceOptions.map((audience) => (
            <button
              key={audience.id}
              onClick={() => handleAudienceToggle(audience.id)}
              className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                formData.targetAudience?.includes(audience.id)
                  ? 'bg-indigo-500 bg-opacity-10 border-indigo-500 text-white'
                  : 'bg-black border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <span>{audience.label}</span>
            </button>
          ))}
        </div>
        {formData.targetAudience?.includes('niche_community') && (
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
          value={
            formData.city && !cities.includes(formData.city) && formData.city !== ''
              ? 'Others'
              : formData.city || ''
          }
          onChange={(e) => {
            if (e.target.value === 'Others') {
              setFormData({ ...formData, city: 'Others', customCity: '' });
            } else {
              setFormData({ ...formData, city: e.target.value, customCity: undefined });
            }
          }}
          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {(formData.city === 'Others' || (formData.city && !cities.includes(formData.city) && formData.city !== '')) && (
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

      {/* Event Date */}
      <div>
        <label className="block text-white text-base mb-4">
          5. Event Date <span className="text-red-500">*</span>
        </label>
        <p className="text-gray-400 text-sm mb-3">Helps communities assess feasibility.</p>
        
        <div className="bg-zinc-900 border border-gray-800 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">DATE</label>
              <input
                type="date"
                value={typeof formData.eventDate === 'object' ? formData.eventDate?.date || '' : formData.eventDate || ''}
                onChange={(e) => handleDateChange('date', e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">START TIME</label>
              <input
                type="time"
                value={typeof formData.eventDate === 'object' ? formData.eventDate?.startTime || '' : ''}
                onChange={(e) => handleDateChange('startTime', e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">END TIME</label>
              <input
                type="time"
                value={typeof formData.eventDate === 'object' ? formData.eventDate?.endTime || '' : ''}
                onChange={(e) => handleDateChange('endTime', e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Backup Date Toggle */}
        <button
          type="button"
          onClick={() => {
            const show = !formData.showBackupDate;
            setFormData({
              ...formData,
              showBackupDate: show,
              backupDate: show ? (formData.backupDate || { date: '', startTime: '', endTime: '' }) : formData.backupDate
            });
          }}
          className="text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors"
        >
          {formData.showBackupDate ? '− Remove backup date' : '+ Add backup date'}
        </button>

        {/* Backup Date */}
        {formData.showBackupDate && (
          <div className="mt-4 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-3">Backup Date</p>
            <div className="bg-zinc-900 border border-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">DATE</label>
                  <input
                    type="date"
                    value={formData.backupDate?.date || ''}
                    onChange={(e) => handleBackupDateChange('date', e.target.value)}
                    className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">START TIME</label>
                  <input
                    type="time"
                    value={formData.backupDate?.startTime || ''}
                    onChange={(e) => handleBackupDateChange('startTime', e.target.value)}
                    className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">END TIME</label>
                  <input
                    type="time"
                    value={formData.backupDate?.endTime || ''}
                    onChange={(e) => handleBackupDateChange('endTime', e.target.value)}
                    className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignObjectivesSection;
