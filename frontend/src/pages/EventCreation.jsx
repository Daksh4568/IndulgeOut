import React, { useState, useRef, useEffect, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, UserPlus, ChevronDown, Upload, X, Image, Search } from 'lucide-react'
import NavigationBar from '../components/NavigationBar'
import { api, API_URL } from '../config/api.js'
import { useAuth } from '../contexts/AuthContext'
import { ToastContext } from '../App'
import { EVENT_CATEGORIES, COMMUNITIES } from '../constants/eventConstants'
import locationService from '../services/locationService'

const EventCreation = () => {
  const navigate = useNavigate()
  const { id: eventId } = useParams()
  const isEditMode = Boolean(eventId)
  const { user } = useAuth()
  const toast = useContext(ToastContext)
  const locationSearchRef = useRef(null)
  
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
      zipCode: '',
      coordinates: {
        latitude: null,
        longitude: null
      }
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
  const [uploadedImages, setUploadedImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [currentUserLocation, setCurrentUserLocation] = useState(null)
  const [cities, setCities] = useState([])
  const [states, setStates] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [filteredStates, setFilteredStates] = useState([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoryAnalytics, setCategoryAnalytics] = useState([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  const communities = COMMUNITIES

  // Indian cities and states for fallback
  const indianCities = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
    'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi'
  ]

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ]

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await fetch(`${API_URL}/api/categories/flat`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }

        const data = await response.json()
        
        if (data.success && data.categories) {
          // Transform API categories to match the format expected by the form
          const formattedCategories = data.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            emoji: cat.emoji
          }))
          setCategories(formattedCategories)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error fetching categories, using fallback:', error)
        // Fallback to hardcoded categories
        setCategories(EVENT_CATEGORIES)
      } finally {
        setLoadingCategories(false)
      }
    }

    const fetchCategoryAnalytics = async () => {
      try {
        setLoadingAnalytics(true)
        const response = await api.get('/categories/popular?limit=10')
        
        if (response.data.categories) {
          setCategoryAnalytics(response.data.categories)
        }
      } catch (error) {
        console.error('Error fetching category analytics:', error)
        setCategoryAnalytics([])
      } finally {
        setLoadingAnalytics(false)
      }
    }

    fetchCategories()
    fetchCategoryAnalytics()
  }, [])

  // Fetch event data if in edit mode
  useEffect(() => {
    const fetchEventData = async () => {
      if (!isEditMode || !eventId) return

      try {
        setIsLoading(true)
        const response = await api.get(`/events/${eventId}`)

        const event = response.data.event || response.data
        console.log('Loaded event data:', event)
        
        // Check if event is in the past - prevent editing past events
        const eventDate = new Date(event.date)
        const now = new Date()
        now.setHours(0, 0, 0, 0) // Reset time to start of today
        
        if (eventDate < now) {
          toast.error('❌ Cannot edit past events. This event has already occurred.')
          navigate('/organizer/dashboard')
          return
        }
        
        // Format date for input (YYYY-MM-DD)
        let formattedDate = ''
        if (event.date) {
          try {
            if (!isNaN(eventDate.getTime())) {
              formattedDate = eventDate.toISOString().split('T')[0]
            }
          } catch (err) {
            console.error('Error formatting date:', err)
          }
        }

        // Populate form with existing event data
        setFormData({
          title: event.title || '',
          description: event.description || '',
          categories: event.categories || [],
          date: formattedDate,
          time: event.time || '',
          location: {
            address: event.location?.address || '',
            city: event.location?.city || '',
            state: event.location?.state || '',
            zipCode: event.location?.zipCode || '',
            coordinates: {
              latitude: event.location?.coordinates?.latitude || null,
              longitude: event.location?.coordinates?.longitude || null
            }
          },
          maxParticipants: event.maxParticipants || '',
          price: {
            amount: event.price?.amount || 0,
            currency: event.price?.currency || 'USD'
          },
          community: event.community || '',
          coHosts: event.coHosts || [],
          requirements: event.requirements || [],
          isPrivate: event.isPrivate || false
        })

        // Set location query for display
        if (event.location?.address) {
          setLocationQuery(event.location.address)
        }

        // Set uploaded images if they exist
        if (event.images && event.images.length > 0) {
          const imageObjects = event.images.map((url, index) => ({
            url,
            public_id: `existing_${index}`,
            resource_type: 'image'
          }))
          setUploadedImages(imageObjects)
        }

        toast.success('Event loaded for editing')
      } catch (error) {
        console.error('Error fetching event:', error)
        toast.error('Failed to load event data')
        navigate('/organizer/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventData()
  }, [isEditMode, eventId])

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
    const categoryName = typeof category === 'string' ? category : category.name;
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName].slice(0, 3) // Max 3 categories
    }))
  }

  // Location search functions
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([])
      return
    }

    setIsSearchingLocation(true)
    try {
      const results = await locationService.searchLocations(query)
      setLocationSuggestions(results.slice(0, 5)) // Limit to 5 suggestions
    } catch (error) {
      console.error('Error searching locations:', error)
      setLocationSuggestions([])
    } finally {
      setIsSearchingLocation(false)
    }
  }

  const handleLocationSearch = (e) => {
    const query = e.target.value
    setLocationQuery(query)
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: query
      }
    }))
    
    if (query.length >= 3) {
      setShowLocationSuggestions(true)
      searchLocations(query)
    } else {
      setShowLocationSuggestions(false)
      setLocationSuggestions([])
    }
  }

  const selectLocation = async (suggestion) => {
    try {
      // Extract detailed address components
      const road = suggestion.address?.road || suggestion.address?.street || suggestion.address?.building || ''
      const neighbourhood = suggestion.address?.neighbourhood || suggestion.address?.suburb || ''
      const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.address?.municipality || ''
      const state = suggestion.address?.state || suggestion.address?.province || suggestion.address?.region || ''
      const zipCode = suggestion.address?.postcode || ''
      const country = suggestion.address?.country || 'India'
      
      // Build precise address from components
      const addressParts = [road, neighbourhood, city, state, zipCode, country].filter(Boolean)
      const preciseAddress = addressParts.join(', ') || suggestion.display_name
      
      // Get coordinates
      let coords = {
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon)
      }
      
      // Try to get more precise coordinates if available
      try {
        const detailedCoords = await locationService.geocodeAddress(suggestion.display_name)
        coords = {
          latitude: detailedCoords.lat,
          longitude: detailedCoords.lng
        }
      } catch (coordError) {
        console.warn('Using suggestion coordinates directly:', coordError)
      }
      
      setFormData(prev => ({
        ...prev,
        location: {
          address: preciseAddress,
          city: city,
          state: state,
          zipCode: zipCode,
          coordinates: coords
        }
      }))
      
      // Update the search field with the precise address
      setLocationQuery(preciseAddress)
      setShowLocationSuggestions(false)
      setLocationSuggestions([])
    } catch (error) {
      console.error('Error processing location:', error)
      // Fallback to basic suggestion data
      setFormData(prev => ({
        ...prev,
        location: {
          address: suggestion.display_name,
          city: suggestion.address?.city || suggestion.address?.town || '',
          state: suggestion.address?.state || '',
          zipCode: suggestion.address?.postcode || '',
          coordinates: {
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon)
          }
        }
      }))
      
      setLocationQuery(suggestion.display_name)
      setShowLocationSuggestions(false)
      setLocationSuggestions([])
    }
  }

  const getCurrentLocation = async () => {
    try {
      setIsSearchingLocation(true)
      const location = await locationService.getCurrentLocation()
      
      // Check if we have valid coordinates
      if (!location.latitude || !location.longitude) {
        throw new Error('Could not get valid coordinates')
      }
      
      // Try to get address, but don't fail if reverse geocoding fails
      let address = null
      try {
        address = await locationService.reverseGeocode(location.latitude, location.longitude)
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError)
        address = {
          display_name: 'Address not available',
          address: {}
        }
      }
      
      setFormData(prev => ({
        ...prev,
        location: {
          address: address.display_name || 'Address not available',
          city: address.address?.city || address.address?.town || address.address?.village || '',
          state: address.address?.state || address.address?.province || '',
          zipCode: address.address?.postcode || '',
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      }))
      
      setLocationQuery(address.display_name || 'Current Location')
    } catch (error) {
      console.error('Error getting current location:', error)
      toast.warning('Could not get your current location. Please search manually.')
    } finally {
      setIsSearchingLocation(false)
    }
  }

  // Handle current location selection
  const useCurrentLocation = async () => {
    console.log('useCurrentLocation called')
    try {
      setIsSearchingLocation(true)
      console.log('Getting current location...')
      const location = await locationService.getCurrentLocation()
      console.log('Got location:', location)
      
      if (!location.latitude || !location.longitude) {
        throw new Error('Could not get valid coordinates')
      }
      
      setCurrentUserLocation({
        latitude: location.latitude,
        longitude: location.longitude
      })
      console.log('Set current user location')
      
      // Try to get address and auto-populate city/state/zipcode
      try {
        console.log('Starting reverse geocoding...')
        const address = await locationService.reverseGeocode(location.latitude, location.longitude)
        console.log('Reverse geocode result:', address)
        
        const road = address.address?.road || address.address?.street || ''
        const neighbourhood = address.address?.neighbourhood || address.address?.suburb || ''
        const city = address.city || address.address?.city || address.address?.town || address.address?.village || ''
        const state = address.state || address.address?.state || address.address?.province || ''
        const zipCode = address.address?.postcode || ''
        const country = address.address?.country || 'India'
        
        // Build precise address
        const addressParts = [road, neighbourhood, city, state, zipCode].filter(Boolean)
        const fullAddress = addressParts.join(', ')
        
        console.log('Extracted - Road:', road, 'City:', city, 'State:', state, 'Zip:', zipCode)
        
        setFormData(prev => ({
          ...prev,
          location: {
            address: fullAddress || address.display_name || 'Current Location',
            city: city,
            state: state,
            zipCode: zipCode,
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }))
        console.log('Updated form data with complete address')
        
        // Update location query - user can still edit this
        setLocationQuery(fullAddress || address.display_name || 'Current Location')
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError)
        // Still set coordinates even if reverse geocoding fails
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: 'Current Location',
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }))
        
        setLocationQuery('Current Location')
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      toast.error('Could not get your current location. Please enable location access.')
    } finally {
      setIsSearchingLocation(false)
    }
  }

  // Search cities based on input
  const searchCities = async (query) => {
    console.log('searchCities called with query:', query)
    if (!query || query.length < 2) {
      setFilteredCities([])
      return
    }
    
    try {
      // First, search in our predefined Indian cities
      const localMatches = indianCities
        .filter(city => city.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(city => ({
          name: city,
          full_name: `${city}, India`,
          coordinates: null // Will be geocoded if selected
        }))

      console.log('Local city matches:', localMatches)
      
      // If we have local matches, use them
      if (localMatches.length > 0) {
        setFilteredCities(localMatches)
        return
      }

      // Otherwise, search using location service
      console.log('Searching cities via location service for:', query)
      const suggestions = await locationService.searchLocations(query + ' city India')
      console.log('City search results:', suggestions)
      
      const cityResults = suggestions
        .filter(item => {
          // More flexible filtering for cities
          const isPlace = item.class === 'place'
          const isCity = ['city', 'town', 'village', 'municipality', 'suburb'].includes(item.type)
          return isPlace && isCity
        })
        .slice(0, 10)
        .map(item => ({
          name: item.display_name.split(',')[0],
          full_name: item.display_name,
          coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
        }))
      
      console.log('Filtered city results:', cityResults)
      setFilteredCities(cityResults)
    } catch (error) {
      console.error('Error searching cities:', error)
    }
  }

  // Search states based on input
  const searchStates = async (query) => {
    console.log('searchStates called with query:', query)
    if (!query || query.length < 2) {
      setFilteredStates([])
      return
    }
    
    try {
      // First, search in our predefined Indian states
      const localMatches = indianStates
        .filter(state => state.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map(state => ({
          name: state,
          full_name: `${state}, India`
        }))

      console.log('Local state matches:', localMatches)
      
      // Always use local matches for states as they're more reliable
      setFilteredStates(localMatches)
    } catch (error) {
      console.error('Error searching states:', error)
    }
  }

  // Handle city selection
  const selectCity = (city) => {
    console.log('Selecting city:', city)
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city: city.name,
        coordinates: city.coordinates
      }
    }))
    setShowCityDropdown(false)
    setFilteredCities([])
    
    // Show success feedback
    toast.success(`City selected: ${city.name}`)
  }

  // Handle state selection
  const selectState = (state) => {
    console.log('Selecting state:', state)
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        state: state.name
      }
    }))
    setShowStateDropdown(false)
    setFilteredStates([])
    
    // Show success feedback
    toast.success(`State selected: ${state.name}`)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(event.target)) {
        setShowLocationSuggestions(false)
        setShowCityDropdown(false)
        setShowStateDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(event.target)) {
        setShowLocationSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openCloudinaryWidget = () => {
    setIsUploading(true)
    
    // Create the Cloudinary upload widget
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dtxgkrfdn', // Your cloud name
        uploadPreset: 'indulgeout_events', // Your upload preset name
        multiple: true,
        maxFiles: 5,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxFileSize: 5000000, // 5MB
        folder: 'indulgeout/events', // Organize uploads in folders
        cropping: false, // Disable cropping for now
        showUploadMoreButton: true,
        styles: {
          palette: {
            window: "#000000",
            sourceBg: "#000000",
            windowBorder: "#8E9FBC",
            tabIcon: "#FFFFFF",
            inactiveTabIcon: "#8E9FBC",
            menuIcons: "#CCE8FF",
            link: "#408FC6",
            action: "#408FC6",
            inProgress: "#00BFFF",
            complete: "#20B832",
            error: "#EA2727",
            textDark: "#000000",
            textLight: "#FFFFFF"
          }
        },
        text: {
          en: {
            or: "or",
            back: "Back",
            advanced: "Advanced",
            close: "Close",
            no_results: "No Results"
          }
        }
      },
      (error, result) => {
        setIsUploading(false)
        
        if (error) {
          console.error('Upload error:', error)
          toast.error('Error uploading image. Please try again.')
          return
        }

        if (result.event === 'success') {
          setUploadedImages(prev => [...prev, {
            url: result.info.secure_url,
            public_id: result.info.public_id,
            id: result.info.public_id
          }])
        }

        if (result.event === 'close') {
          widget.destroy()
        }
      }
    )

    widget.open()
  }

  const removeImage = (publicId) => {
    setUploadedImages(prev => prev.filter(img => img.public_id !== publicId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Event data:', formData)
      
      // Prepare the event data for the API
      const eventData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants),
        date: formData.date,
        time: formData.time,
        images: uploadedImages.map(img => img.url) // Send Cloudinary URLs
      }

      let response
      if (isEditMode) {
        // Update existing event
        response = await api.put(`/events/${eventId}`, eventData)
        console.log('Event updated successfully:', response.data)
        toast.success('Event updated successfully!')
      } else {
        // Create new event
        response = await api.post('/events', eventData)
        console.log('Event created successfully:', response.data)
        toast.success('Event created successfully!')
      }
      
      // Navigate back to dashboard
      navigate('/organizer/dashboard')
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} event:`, error)
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data.message || `Failed to ${isEditMode ? 'update' : 'create'} event`
        const errors = error.response.data.errors
        
        if (errors && errors.length > 0) {
          toast.error(`Validation errors: ${errors.map(err => err.msg).join(', ')}`)
        } else {
          toast.error(errorMessage)
        }
      } else {
        toast.error('Network error. Please check if the backend server is running.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation Bar with Logo */}
      <NavigationBar />
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/organizer/dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span>{isEditMode ? 'Back to Dashboard' : 'Back to Dashboard'}</span>
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Event' : 'Create New Event'}
            </h1>
            <div className="w-32"></div>
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-medium placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-colors"
              required
            />
          </div>

          {/* Event Images */}
          <div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 transition-colors">
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Upload Event Images
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Upload up to 5 images to showcase your event
                  </p>
                  <button
                    type="button"
                    onClick={openCloudinaryWidget}
                    disabled={isUploading || uploadedImages.length >= 5}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Choose Images'}
                  </button>
                </div>
              </div>
              
              {/* Image Previews */}
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Uploaded Images ({uploadedImages.length}/5)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.public_id} className="relative group">
                        <img
                          src={image.url}
                          alt="Event preview"
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.public_id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🏷️</span>
                </div>
                <span className={formData.categories.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                  {formData.categories.length > 0 
                    ? `Categories (${formData.categories.length}/3)`
                    : 'Categories (up to 3)'
                  }
                </span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
            
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg transition-colors">
                <div className="p-4">
                  {/* Category Analytics - Trending Categories */}
                  {!loadingAnalytics && categoryAnalytics.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center">
                        🔥 Popular Categories
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {categoryAnalytics.slice(0, 6).map((cat) => (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => handleCategoryToggle(cat)}
                            disabled={formData.categories.length >= 3 && !formData.categories.includes(cat.name)}
                            className={`p-2 rounded-lg text-left text-xs border transition-all ${
                              formData.categories.includes(cat.name)
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="font-medium">{cat.emoji} {cat.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {cat.eventCount} events · {cat.totalParticipants} attendees
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Categories */}
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    All Categories
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {categories.map((category) => (
                      <label key={category.id || category.name} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.name)}
                          onChange={() => handleCategoryToggle(category)}
                          disabled={formData.categories.length >= 3 && !formData.categories.includes(category.name)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {category.emoji} {category.name}
                        </span>
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
                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
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
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="relative" ref={locationSearchRef}>
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={locationQuery || formData.location.address || ''}
                onChange={handleLocationSearch}
                placeholder="Search for location..."
                className="w-full pl-10 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={isSearchingLocation}
                className="absolute right-3 top-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1 font-medium transition-colors"
              >
                {isSearchingLocation ? (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>Use Current</span>
                  </>
                )}
              </button>
              
              {/* Location Suggestions Dropdown */}
              {showLocationSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {isSearchingLocation ? (
                    <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Searching...</span>
                      </div>
                    </div>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.place_id || index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectLocation(suggestion)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          selectLocation(suggestion)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {suggestion.address?.road || suggestion.address?.name || 'Unknown Location'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {suggestion.display_name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      <MapPin className="h-5 w-5 mx-auto mb-1 opacity-50" />
                      <p className="text-sm">No locations found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Current Location Display */}
            {currentUserLocation && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-200 font-medium">Current Location</span>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Use Current
                  </button>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Location coordinates: {currentUserLocation.latitude.toFixed(6)}, {currentUserLocation.longitude.toFixed(6)}
                </div>
              </div>
            )}
            
            {/* Show coordinates if available */}
            {formData.location.coordinates.latitude && formData.location.coordinates.longitude && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Location coordinates: {formData.location.coordinates.latitude.toFixed(6)}, {formData.location.coordinates.longitude.toFixed(6)}
              </div>
            )}
            
            {/* Full Address Field - Editable */}
            <div className="relative">
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleInputChange}
                placeholder="Complete address (Street, Area, Landmark)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* City Dropdown */}
              <div className="relative">
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={(e) => {
                    handleInputChange(e)
                    searchCities(e.target.value)
                    setShowCityDropdown(true)
                  }}
                  onFocus={() => {
                    if (formData.location.city) {
                      searchCities(formData.location.city)
                    }
                    setShowCityDropdown(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredCities.length > 0) {
                      e.preventDefault()
                      selectCity(filteredCities[0])
                    } else if (e.key === 'Escape') {
                      setShowCityDropdown(false)
                    }
                  }}
                  placeholder="City * (Start typing...)"
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
                {formData.location.city && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, city: '' }
                      }))
                      setShowCityDropdown(false)
                      setFilteredCities([])
                    }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                
                {/* City Suggestions Dropdown */}
                {showCityDropdown && filteredCities.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                      {filteredCities.length} cit{filteredCities.length > 1 ? 'ies' : 'y'} found • Click to select or press Enter
                    </div>
                    {filteredCities.map((city, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectCity(city)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          selectCity(city)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0 cursor-pointer"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {city.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {city.full_name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* State Dropdown */}
              <div className="relative">
                <input
                  type="text"
                  name="location.state"
                  value={formData.location.state}
                  onChange={(e) => {
                    handleInputChange(e)
                    searchStates(e.target.value)
                    setShowStateDropdown(true)
                  }}
                  onFocus={() => {
                    if (formData.location.state) {
                      searchStates(formData.location.state)
                    }
                    setShowStateDropdown(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredStates.length > 0) {
                      e.preventDefault()
                      selectState(filteredStates[0])
                    } else if (e.key === 'Escape') {
                      setShowStateDropdown(false)
                    }
                  }}
                  placeholder="State * (Start typing...)"
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
                {formData.location.state && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, state: '' }
                      }))
                      setShowStateDropdown(false)
                      setFilteredStates([])
                    }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                
                {/* State Suggestions Dropdown */}
                {showStateDropdown && filteredStates.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                      {filteredStates.length} state{filteredStates.length > 1 ? 's' : ''} found • Click to select or press Enter
                    </div>
                    {filteredStates.map((state, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectState(state)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          selectState(state)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0 cursor-pointer"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {state.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {state.full_name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Zip Code Field */}
            <div className="relative">
              <input
                type="text"
                name="location.zipCode"
                value={formData.location.zipCode}
                onChange={handleInputChange}
                placeholder="Zip/Postal Code (Optional)"
                maxLength="10"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Community (Optional) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-left bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className={formData.community ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                  {formData.community || 'Community (Optional)'}
                </span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          {/* Participants and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                placeholder="Participants"
                min="1"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="number"
                name="price.amount"
                value={formData.price.amount}
                onChange={handleInputChange}
                placeholder="Price"
                min="0"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Co-host */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCoHostDropdown(!showCoHostDropdown)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-left bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center mr-3">
                  <UserPlus className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-500 dark:text-gray-400">Co-host (Optional)</span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors">
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
                className="flex flex-col items-center text-gray-400 dark:text-gray-500"
              >
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mb-1">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">COMMUNITY</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center text-gray-400 dark:text-gray-500"
              >
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mb-1">
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
                  {isEditMode ? 'Updating Event...' : 'Creating Event...'}
                </div>
              ) : (
                isEditMode ? 'Update Event' : 'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventCreation