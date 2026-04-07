import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { api } from '../config/api';
import CityDropdown from './CityDropdown';

const UserDetailsModal = ({ isOpen, onClose, onSave, existingAge, existingGender, existingCity, existingInterests }) => {
  const [age, setAge] = useState(existingAge || '');
  const [gender, setGender] = useState(existingGender || '');
  const [city, setCity] = useState(existingCity || '');
  const [interests, setInterests] = useState(existingInterests || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [interestsDropdownOpen, setInterestsDropdownOpen] = useState(false);

  const interestOptions = [
    'Social Mixers',
    'Wellness, Fitness & Sports',
    'Art, Music & Dance',
    'Immersive',
    'Food & Beverage',
    'Games'
  ];

  if (!isOpen) return null;

  // Only show fields that are missing
  const needsAge = !existingAge;
  const needsGender = !existingGender;
  const needsCity = !existingCity;
  const needsInterests = !existingInterests || existingInterests.length === 0;

  const handleSubmit = async () => {
    setError('');

    // Validate only the missing fields
    if (needsAge && (!age || age < 13 || age > 100)) {
      setError('Please enter a valid age (13–100)');
      return;
    }
    if (needsGender && !gender) {
      setError('Please select your gender');
      return;
    }
    if (needsCity && !city.trim()) {
      setError('Please enter your city');
      return;
    }
    if (needsInterests && interests.length === 0) {
      setError('Please select at least one interest');
      return;
    }

    setSaving(true);
    try {
      const updateData = {};
      if (needsAge) updateData.age = parseInt(age, 10);
      if (needsGender) updateData.gender = gender;
      if (needsCity) updateData.location = { city: city.trim() };
      if (needsInterests) updateData.interests = interests;

      await api.put('/users/profile', updateData);
      onSave({ age: parseInt(age, 10) || existingAge, gender: gender || existingGender, city: city.trim() || existingCity, interests: interests.length > 0 ? interests : existingInterests });
    } catch (err) {
      console.error('Error updating user details:', err);
      setError('Failed to save details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
            <User className="h-7 w-7 text-white" />
          </div>

          <p className="text-gray-300 text-sm text-center mb-6">
            Help us understand you a little better so we can show you events and experiences that you'll enjoy.
          </p>

          <div className="space-y-4">
            {/* Age */}
            {needsAge && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Age</label>
                <input
                  type="number"
                  placeholder="Your age"
                  min="13"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Gender */}
            {needsGender && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                >
                  <option value="" className="bg-zinc-800">Select gender</option>
                  <option value="Male" className="bg-zinc-800">Male</option>
                  <option value="Female" className="bg-zinc-800">Female</option>
                  <option value="Non-binary" className="bg-zinc-800">Non-binary</option>
                  <option value="Prefer not to say" className="bg-zinc-800">Prefer not to say</option>
                </select>
              </div>
            )}

            {/* City */}
            {needsCity && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">City</label>
                <CityDropdown
                  value={city}
                  onChange={(val) => setCity(val)}
                  placeholder="Select your city"
                />
              </div>
            )}

            {/* Interests */}
            {needsInterests && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Interests</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setInterestsDropdownOpen(!interestsDropdownOpen)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-700 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-between"
                  >
                    <span className={interests.length > 0 ? 'text-white' : 'text-gray-500'}>
                      {interests.length > 0 ? `${interests.length} interest${interests.length > 1 ? 's' : ''} selected` : 'Select interests'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${interestsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {interestsDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-auto">
                      {interestOptions.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-700 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={interests.includes(opt)}
                            onChange={() => {
                              setInterests(prev =>
                                prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt]
                              );
                            }}
                            className="rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-zinc-900"
                          />
                          <span className="text-sm text-gray-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {interests.map((interest) => (
                      <span key={interest} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-700/30">
                        {interest}
                        <button
                          type="button"
                          onClick={() => setInterests(prev => prev.filter(i => i !== interest))}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full mt-6 py-3 rounded-full text-white font-semibold text-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
