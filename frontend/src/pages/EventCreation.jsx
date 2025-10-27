import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, UserPlus, ChevronDown } from 'lucide-react'
import axios from 'axios'
import API_BASE_URL from '../config/api.js'
import { useAuth } from '../contexts/AuthContext'

const EventCreation = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [],
    date: '',
    time: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    maxParticipants: '',
    price: {
      amount: 0,
      currency: 'USD'
    },
    community: '',
    coHosts: [],
    requirements: [],
    isPrivate: false
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false)
  const [showCoHostDropdown, setShowCoHostDropdown] = useState(false)

  const categories = [
    'Sip & Savor',
    'Sweat & Play',
    'Art & DIY',
    'Social Mixers',
    'Adventure & Outdoors',
    'Epic Screenings',
    'Indoor & Board Games',
    'Music & Performance'
  ]

  const communities = [
    'Food Lovers United',
    'Fitness Enthusiasts',
    'Creative Minds',
    'Tech Professionals',
    'Outdoor Adventurers'
  ]

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

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category].slice(0, 3) // Max 3 categories
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to create an event')
        navigate('/login')
        return
      }

      console.log('Event data:', formData)
      
      // Prepare the event data for the API
      const eventData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants),
        date: formData.date,
        time: formData.time
      }

      // Make API call to create event
      const response = await axios.post(`${API_BASE_URL}/api/events`, eventData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Event created successfully:', response.data)
      alert('Event created successfully!')
      
      // Navigate back to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to create event:', error)
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data.message || 'Failed to create event'
        const errors = error.response.data.errors
        
        if (errors && errors.length > 0) {
          alert(`Validation errors:\n${errors.map(err => err.msg).join('\n')}`)
        } else {
          alert(errorMessage)
        }
      } else {
        alert('Network error. Please check if the backend server is running.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Create New Event</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Title */}
          <div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Event Title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Event Description */}
          <div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Event Description"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Categories */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🏷️</span>
                </div>
                <span className={formData.categories.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.categories.length > 0 
                    ? `Categories (${formData.categories.length}/3)`
                    : 'Categories (up to 3)'
                  }
                </span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </button>
            
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          disabled={formData.categories.length >= 3 && !formData.categories.includes(category)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {formData.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.categories.map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleInputChange}
                placeholder="Add Location - Search or enter address"
                className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <span className="absolute right-3 top-3 text-sm text-gray-500">Tap to select</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="location.city"
                value={formData.location.city}
                onChange={handleInputChange}
                placeholder="City"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                name="location.state"
                value={formData.location.state}
                onChange={handleInputChange}
                placeholder="State"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Community (Optional) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className={formData.community ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.community || 'Community (Optional)'}
                </span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Participants and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                placeholder="Participants"
                min="1"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="price.amount"
                value={formData.price.amount}
                onChange={handleInputChange}
                placeholder="Price"
                min="0"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Co-host */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCoHostDropdown(!showCoHostDropdown)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center mr-3">
                  <UserPlus className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-500">Co-host (Optional)</span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-center space-x-8 mb-6">
              <button
                type="button"
                className="flex flex-col items-center text-primary-600"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mb-1">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">EVENT</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center text-gray-400"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mb-1">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">COMMUNITY</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center text-gray-400"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-xs">📝</span>
                </div>
                <span className="text-sm">POST</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Event...
                </div>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventCreation