import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Users, Phone, Mail, Upload, X, Check, AlertCircle } from 'lucide-react'
import axios from 'axios'
import API_BASE_URL from '../config/api.js'
import { useAuth } from '../contexts/AuthContext'

const VenueOnboarding = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    venueName: '',
    city: '',
    locality: '',
    venueType: '',
    capacityRange: '',
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    amenities: [],
    rules: {
      alcoholAllowed: false,
      smokingAllowed: false,
      minimumAge: 18,
      soundRestrictions: '',
      additionalRules: ''
    },
    pricing: {
      hourlyRate: '',
      minimumBooking: ''
    },
    photos: []
  })

  const venueTypes = [
    { value: 'cafe', label: '☕ Café', icon: '☕' },
    { value: 'bar', label: '🍺 Bar', icon: '🍺' },
    { value: 'studio', label: '🎨 Studio', icon: '🎨' },
    { value: 'club', label: '🎵 Club', icon: '🎵' },
    { value: 'outdoor', label: '🌳 Outdoor Space', icon: '🌳' },
    { value: 'restaurant', label: '🍽️ Restaurant', icon: '🍽️' },
    { value: 'coworking', label: '💼 Coworking Space', icon: '💼' },
    { value: 'other', label: '🏢 Other', icon: '🏢' }
  ]

  const capacityRanges = ['0-20', '20-40', '40-80', '80-150', '150-300', '300+']

  const amenitiesOptions = [
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'parking', label: 'Parking', icon: '🅿️' },
    { value: 'ac', label: 'Air Conditioning', icon: '❄️' },
    { value: 'sound_system', label: 'Sound System', icon: '🔊' },
    { value: 'projector', label: 'Projector', icon: '📽️' },
    { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { value: 'bar', label: 'Bar', icon: '🍹' },
    { value: 'outdoor_seating', label: 'Outdoor Seating', icon: '🪑' },
    { value: 'stage', label: 'Stage', icon: '🎭' },
    { value: 'dance_floor', label: 'Dance Floor', icon: '💃' },
    { value: 'green_room', label: 'Green Room', icon: '🚪' },
    { value: 'security', label: 'Security', icon: '🛡️' }
  ]

  const calculateProgress = () => {
    const fields = [
      formData.venueName,
      formData.city,
      formData.locality,
      formData.venueType,
      formData.capacityRange,
      formData.contactPerson.name,
      formData.contactPerson.phone || formData.contactPerson.email,
      formData.amenities.length > 0,
      formData.photos.length > 0
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    // In production, upload to Cloudinary
    // For now, create placeholder URLs
    const urls = files.map((file, index) => URL.createObjectURL(file))
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...urls].slice(0, 6) // Max 6 photos
    }))
  }

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        {
          venueProfile: formData,
          onboardingCompleted: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      navigate('/dashboard')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                Venue Setup
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete your venue profile to start receiving booking requests
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{progress}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {progress < 80 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>{80 - progress}% more — venues with photos get more requests</span>
            </div>
          )}
          {progress >= 80 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Great! Your profile looks complete</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your venue name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Locality *
                  </label>
                  <input
                    type="text"
                    name="locality"
                    value={formData.locality}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Bandra West"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {venueTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, venueType: type.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.venueType === type.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">{type.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacity Range *
                </label>
                <select
                  name="capacityRange"
                  value={formData.capacityRange}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select capacity range</option>
                  {capacityRanges.map(range => (
                    <option key={range} value={range}>{range} people</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Person</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="contactPerson.name"
                  value={formData.contactPerson.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPerson.phone"
                    value={formData.contactPerson.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contactPerson.email"
                    value={formData.contactPerson.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="contact@venue.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Amenities</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenitiesOptions.map(amenity => (
                <label
                  key={amenity.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.amenities.includes(amenity.value)
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.value)}
                    onChange={() => handleAmenityToggle(amenity.value)}
                    className="hidden"
                  />
                  <span className="text-xl">{amenity.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Venue Photos
              <span className="text-sm font-normal text-gray-500 ml-2">(Up to 6 photos)</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img src={photo} alt={`Venue ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {formData.photos.length < 6 && (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Rules */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Venue Rules</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rules.alcoholAllowed"
                    checked={formData.rules.alcoholAllowed}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Alcohol Allowed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rules.smokingAllowed"
                    checked={formData.rules.smokingAllowed}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Smoking Allowed</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Age
                </label>
                <input
                  type="number"
                  name="rules.minimumAge"
                  value={formData.rules.minimumAge}
                  onChange={handleInputChange}
                  min="0"
                  max="99"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sound Restrictions
                </label>
                <input
                  type="text"
                  name="rules.soundRestrictions"
                  value={formData.rules.soundRestrictions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., No loud music after 10 PM"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={isLoading || progress < 50}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VenueOnboarding
