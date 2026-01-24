import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, MapPin, Mail, Phone, Instagram, Globe, Upload, X, Check, AlertCircle } from 'lucide-react'
import { api, API_URL } from '../config/api.js'
import { useAuth } from '../contexts/AuthContext'

const CommunityOnboarding = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  
  const [formData, setFormData] = useState({
    communityName: '',
    city: '',
    primaryCategory: '',
    communityType: 'open',
    contactPerson: {
      name: '',
      email: '',
      phone: ''
    },
    communityDescription: '',
    instagram: '',
    facebook: '',
    website: '',
    pastEventPhotos: [],
    pastEventExperience: '',
    typicalAudienceSize: ''
  })

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories/flat`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.categories) {
            setCategories(data.categories)
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  const experienceRanges = [
    { value: '0-5', label: '0-5 events', icon: '🌱' },
    { value: '5-10', label: '5-10 events', icon: '🌿' },
    { value: '10-30', label: '10-30 events', icon: '🌳' },
    { value: '30-50', label: '30-50 events', icon: '🏆' },
    { value: '50-100', label: '50-100 events', icon: '⭐' },
    { value: '100+', label: '100+ events', icon: '🚀' }
  ]

  const audienceSizes = [
    { value: '0-20', label: '0-20 people', icon: '👥' },
    { value: '20-50', label: '20-50 people', icon: '👨‍👩‍👧‍👦' },
    { value: '50-100', label: '50-100 people', icon: '🎪' },
    { value: '100-200', label: '100-200 people', icon: '🎭' },
    { value: '200-500', label: '200-500 people', icon: '🎉' },
    { value: '500+', label: '500+ people', icon: '🏟️' }
  ]

  const calculateProgress = () => {
    const fields = [
      formData.communityName,
      formData.city,
      formData.primaryCategory,
      formData.communityType,
      formData.contactPerson.name,
      formData.contactPerson.email || formData.contactPerson.phone,
      formData.communityDescription,
      formData.instagram || formData.facebook || formData.website
    ]
    const completed = fields.filter(Boolean).length
    const baseProgress = Math.round((completed / fields.length) * 100)
    
    // Bonus for action dashboard items
    let bonus = 0
    if (formData.pastEventPhotos.length > 0) bonus += 10
    if (formData.pastEventExperience) bonus += 10
    if (formData.typicalAudienceSize) bonus += 10
    
    return Math.min(baseProgress + bonus, 100)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    const urls = files.map(file => URL.createObjectURL(file))
    setFormData(prev => ({
      ...prev,
      pastEventPhotos: [...prev.pastEventPhotos, ...urls].slice(0, 6)
    }))
  }

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      pastEventPhotos: prev.pastEventPhotos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      // Update user profile with community info AND create community document
      await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        {
          communityProfile: formData,
          onboardingCompleted: true,
          createCommunity: true // Flag to create community document
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Navigate to community organizer dashboard
      navigate('/organizer/dashboard')
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
                <Users className="h-6 w-6 text-purple-600" />
                Community Setup
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete your community profile to start hosting events
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{progress}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {progress < 70 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>{70 - progress}% more — communities with descriptions get more attendees</span>
            </div>
          )}
          {progress >= 70 && progress < 100 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <AlertCircle className="h-4 w-4" />
              <span>Add a social link to build trust with venues</span>
            </div>
          )}
          {progress === 100 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Your community can now host events on IndulgeOut</span>
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
                  Community Name *
                </label>
                <input
                  type="text"
                  name="communityName"
                  value={formData.communityName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your community name"
                />
              </div>

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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Mumbai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Category *
                </label>
                <select
                  name="primaryCategory"
                  value={formData.primaryCategory}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Community Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, communityType: 'open' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.communityType === 'open'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🌍</div>
                    <div className="font-medium text-gray-900 dark:text-white">Open</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Anyone can join</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, communityType: 'curated' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.communityType === 'curated'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🔐</div>
                    <div className="font-medium text-gray-900 dark:text-white">Curated</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Approval-based</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Community Description * (1-2 lines)
                </label>
                <textarea
                  name="communityDescription"
                  value={formData.communityDescription}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of your community and what members can expect"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.communityDescription.length}/200 characters</p>
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="contactPerson.email"
                    value={formData.contactPerson.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="contact@community.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPerson.phone"
                    value={formData.contactPerson.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instagram
                </label>
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="@yourcommunity"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://yourcommunity.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Dashboard Items */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              📊 Action Dashboard (Optional - Complete later)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Past Event Photos
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {formData.pastEventPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img src={photo} alt={`Event ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.pastEventPhotos.length < 6 && (
                    <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Past Event Experience
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {experienceRanges.map(range => (
                    <button
                      key={range.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pastEventExperience: range.value }))}
                      className={`p-2 rounded-lg border-2 transition-all text-xs ${
                        formData.pastEventExperience === range.value
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-lg">{range.icon}</span>
                      <div className="font-medium text-gray-900 dark:text-white">{range.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Typical Audience Size
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {audienceSizes.map(size => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, typicalAudienceSize: size.value }))}
                      className={`p-2 rounded-lg border-2 transition-all text-xs ${
                        formData.typicalAudienceSize === size.value
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-lg">{size.icon}</span>
                      <div className="font-medium text-gray-900 dark:text-white">{size.label}</div>
                    </button>
                  ))}
                </div>
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
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CommunityOnboarding
