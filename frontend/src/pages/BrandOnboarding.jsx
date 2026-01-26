import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Target, Mail, Phone, Globe, Instagram, Upload, X, Check, AlertCircle } from 'lucide-react'
import { api } from '../config/api.js'
import { useAuth } from '../contexts/AuthContext'

const BrandOnboarding = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    brandName: '',
    brandCategory: '',
    targetCity: [],
    sponsorshipType: [],
    collaborationIntent: [],
    contactPerson: {
      name: '',
      workEmail: '',
      phone: '',
      designation: ''
    },
    brandDescription: '',
    website: '',
    instagram: '',
    logo: ''
  })

  const brandCategories = [
    { value: 'food_beverage', label: 'Food & Beverage', icon: '🍽️' },
    { value: 'wellness_fitness', label: 'Wellness & Fitness', icon: '💪' },
    { value: 'lifestyle', label: 'Lifestyle', icon: '✨' },
    { value: 'tech', label: 'Tech', icon: '💻' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'fashion', label: 'Fashion', icon: '👗' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'other', label: 'Other', icon: '🏢' }
  ]

  const sponsorshipTypes = [
    { value: 'barter', label: 'Barter', description: 'Product/service exchange' },
    { value: 'paid_monetary', label: 'Paid/Monetary', description: 'Cash sponsorship' },
    { value: 'product_sampling', label: 'Product Sampling', description: 'Free samples to attendees' },
    { value: 'co-marketing', label: 'Co-Marketing', description: 'Joint promotion' }
  ]

  const collaborationIntents = [
    { value: 'sponsorship', label: 'Sponsorship', icon: '🤝' },
    { value: 'sampling', label: 'Sampling', icon: '🎁' },
    { value: 'popups', label: 'Pop-ups', icon: '🏪' },
    { value: 'experience_partnerships', label: 'Experience Partnerships', icon: '✨' },
    { value: 'brand_activation', label: 'Brand Activation', icon: '🚀' },
    { value: 'content_creation', label: 'Content Creation', icon: '📸' }
  ]

  const indianCities = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 
    'Pune', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
    'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad'
  ]

  const calculateProgress = () => {
    const fields = [
      formData.brandName,
      formData.brandCategory,
      formData.targetCity.length > 0,
      formData.sponsorshipType.length > 0,
      formData.collaborationIntent.length > 0,
      formData.contactPerson.name,
      formData.contactPerson.workEmail,
      formData.brandDescription,
      formData.website || formData.instagram
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
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

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // In production, upload to Cloudinary
      const url = URL.createObjectURL(file)
      setFormData(prev => ({ ...prev, logo: url }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await api.put(
        '/users/profile',
        {
          brandProfile: formData,
          onboardingCompleted: true
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
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-orange-600" />
                Brand Setup
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete your brand profile to explore collaborations
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">{progress}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {progress < 65 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>{65 - progress}% more — brands with descriptions get better matches</span>
            </div>
          )}
          {progress >= 65 && progress < 100 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <AlertCircle className="h-4 w-4" />
              <span>Add collaboration intent to get relevant requests</span>
            </div>
          )}
          {progress === 100 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Your brand can now explore collaborations on IndulgeOut</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Brand Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Brand Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {brandCategories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, brandCategory: cat.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.brandCategory === cat.value
                          ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">{cat.label.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Description * (1-2 lines)
                </label>
                <textarea
                  name="brandDescription"
                  value={formData.brandDescription}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of your brand and what you offer"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.brandDescription.length}/200 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Cities * (Select multiple)
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {indianCities.map(city => (
                      <label key={city} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetCity.includes(city)}
                          onChange={() => handleMultiSelect('targetCity', city)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{city}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formData.targetCity.length} cities selected</p>
              </div>
            </div>
          </div>

          {/* Sponsorship Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sponsorship Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sponsorship Type * (Select all that apply)
                </label>
                <div className="space-y-2">
                  {sponsorshipTypes.map(type => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.sponsorshipType.includes(type.value)
                          ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.sponsorshipType.includes(type.value)}
                        onChange={() => handleMultiSelect('sponsorshipType', type.value)}
                        className="mt-1 w-4 h-4 text-orange-600 rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collaboration Intent * (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {collaborationIntents.map(intent => (
                    <label
                      key={intent.value}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.collaborationIntent.includes(intent.value)
                          ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.collaborationIntent.includes(intent.value)}
                        onChange={() => handleMultiSelect('collaborationIntent', intent.value)}
                        className="hidden"
                      />
                      <span className="text-2xl">{intent.icon}</span>
                      <span className="text-xs font-medium text-center text-gray-900 dark:text-white">{intent.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Person</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="contactPerson.designation"
                    value={formData.contactPerson.designation}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Marketing Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    name="contactPerson.workEmail"
                    value={formData.contactPerson.workEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="work@brand.com"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Online Presence */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Online Presence</h2>
            
            <div className="space-y-4">
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
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://yourbrand.com"
                  />
                </div>
              </div>

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
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="@yourbrand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Logo
                </label>
                {formData.logo ? (
                  <div className="relative inline-block">
                    <img src={formData.logo} alt="Brand logo" className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
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
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BrandOnboarding

