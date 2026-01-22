import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, 
  Building2, Users, Sparkles, Globe, Instagram, Facebook,
  Heart, Clock, TrendingUp, CheckCircle, AlertCircle, Camera,
  Home, Settings, LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import NavigationBar from '../components/NavigationBar'
import axios from 'axios'
import API_BASE_URL from '../config/api.js'

const Profile = () => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, isHostPartner, isCommunityOrganizer, isVenue, isBrandSponsor } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState({
    // Basic fields
    name: '',
    phoneNumber: '',
    bio: '',
    city: '',
    // Community Organizer fields
    communityName: '',
    communityDescription: '',
    primaryCategory: '',
    instagramHandle: '',
    websiteUrl: '',
    // Venue fields
    venueName: '',
    venueDescription: '',
    capacity: '',
    amenities: '',
    // Brand fields
    companyName: '',
    brandDescription: '',
    industry: '',
    targetAudience: ''
  })
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchProfileData()
  }, [isAuthenticated, navigate])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setProfileData(response.data.user)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfileData(user) // Fallback to context user
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      // Initialize form with current data based on user type
      const baseForm = {
        name: profileData.name || '',
        phoneNumber: profileData.phoneNumber || '',
        bio: profileData.bio || '',
        city: profileData.location?.city || ''
      }

      if (isCommunityOrganizer && profileData.communityProfile) {
        baseForm.communityName = profileData.communityProfile.communityName || ''
        baseForm.communityDescription = profileData.communityProfile.communityDescription || ''
        baseForm.primaryCategory = profileData.communityProfile.primaryCategory || ''
        baseForm.instagramHandle = profileData.communityProfile.instagramHandle || ''
        baseForm.websiteUrl = profileData.communityProfile.websiteUrl || ''
      } else if (isVenue && profileData.venueProfile) {
        baseForm.venueName = profileData.venueProfile.venueName || ''
        baseForm.venueDescription = profileData.venueProfile.description || ''
        baseForm.capacity = profileData.venueProfile.capacity || ''
        baseForm.amenities = profileData.venueProfile.amenities?.join(', ') || ''
      } else if (isBrandSponsor && profileData.brandProfile) {
        baseForm.companyName = profileData.brandProfile.companyName || ''
        baseForm.brandDescription = profileData.brandProfile.description || ''
        baseForm.industry = profileData.brandProfile.industry || ''
        baseForm.targetAudience = profileData.brandProfile.targetAudience || ''
      }

      setEditForm(baseForm)
    }
    setIsEditing(!isEditing)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      
      const updateData = {
        name: editForm.name,
        phoneNumber: editForm.phoneNumber,
        bio: editForm.bio,
        location: {
          city: editForm.city
        }
      }

      // Add role-specific data
      if (isCommunityOrganizer) {
        updateData.communityProfile = {
          communityName: editForm.communityName,
          communityDescription: editForm.communityDescription,
          primaryCategory: editForm.primaryCategory,
          instagramHandle: editForm.instagramHandle,
          websiteUrl: editForm.websiteUrl
        }
      } else if (isVenue) {
        updateData.venueProfile = {
          venueName: editForm.venueName,
          description: editForm.venueDescription,
          capacity: parseInt(editForm.capacity) || 0,
          amenities: editForm.amenities.split(',').map(a => a.trim()).filter(a => a)
        }
      } else if (isBrandSponsor) {
        updateData.brandProfile = {
          companyName: editForm.companyName,
          description: editForm.brandDescription,
          industry: editForm.industry,
          targetAudience: editForm.targetAudience
        }
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        updateData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      setProfileData(response.data.user)
      setIsEditing(false)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadge = () => {
    if (!profileData) return null

    if (profileData.role === 'user') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
          <User className="h-4 w-4" />
          User
        </span>
      )
    }

    const badges = {
      'community_organizer': {
        icon: <Users className="h-4 w-4" />,
        label: 'Community Organizer',
        color: 'purple'
      },
      'venue': {
        icon: <Building2 className="h-4 w-4" />,
        label: 'Venue Partner',
        color: 'blue'
      },
      'brand_sponsor': {
        icon: <Sparkles className="h-4 w-4" />,
        label: 'Brand Partner',
        color: 'orange'
      }
    }

    const badge = badges[profileData.hostPartnerType]
    if (!badge) return null

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-${badge.color}-100 dark:bg-${badge.color}-900/30 text-${badge.color}-800 dark:text-${badge.color}-300 rounded-full text-sm font-medium`}>
        {badge.icon}
        {badge.label}
      </span>
    )
  }

  const calculateProfileCompletion = () => {
    if (!profileData) return 0

    const fields = [
      profileData.name,
      profileData.email,
      profileData.phoneNumber,
      profileData.bio,
      profileData.location?.city
    ]

    // Add role-specific fields
    if (isCommunityOrganizer && profileData.communityProfile) {
      fields.push(
        profileData.communityProfile.communityName,
        profileData.communityProfile.communityDescription,
        profileData.communityProfile.primaryCategory
      )
    } else if (isVenue && profileData.venueProfile) {
      fields.push(
        profileData.venueProfile.venueName,
        profileData.venueProfile.description,
        profileData.venueProfile.capacity
      )
    } else if (isBrandSponsor && profileData.brandProfile) {
      fields.push(
        profileData.brandProfile.companyName,
        profileData.brandProfile.description,
        profileData.brandProfile.industry
      )
    }

    const filledFields = fields.filter(field => field && field !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  const getOnboardingStatus = () => {
    if (!profileData) return null

    const progress = calculateProfileCompletion()
    const isComplete = progress === 100

    return (
      <div className="flex items-center gap-3">
        {isComplete ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Profile Complete</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{progress}% Complete</span>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load profile data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {profileData.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profileData.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {getRoleBadge()}
                  {getOnboardingStatus()}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Mail className="h-5 w-5 text-gray-400" />
              <span>{profileData.email}</span>
            </div>
            {profileData.phoneNumber && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Phone className="h-5 w-5 text-gray-400" />
                <span>+91 {profileData.phoneNumber}</span>
              </div>
            )}
            {profileData.location?.city && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span>{profileData.location.city}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>Joined {new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Bio Section */}
          {profileData.bio && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bio</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profileData.bio}</p>
            </div>
          )}
        </div>

        {/* Regular User Interests */}
        {profileData.role === 'user' && profileData.interests && profileData.interests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary-600" />
              My Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profileData.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Community Organizer Profile */}
        {isCommunityOrganizer && profileData.communityProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Community Profile
            </h2>
            
            <div className="space-y-6">
              {/* Community Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Community Name</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{profileData.communityProfile.communityName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Primary Category</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{profileData.communityProfile.primaryCategory}</p>
                </div>
              </div>

              {/* Community Type */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Community Type</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  profileData.communityProfile.communityType === 'open' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                }`}>
                  {profileData.communityProfile.communityType === 'open' ? 'Open Community' : 'Curated Community'}
                </span>
              </div>

              {/* Description */}
              {profileData.communityProfile.communityDescription && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Description</label>
                  <p className="text-gray-700 dark:text-gray-300">{profileData.communityProfile.communityDescription}</p>
                </div>
              )}

              {/* Contact Person */}
              {profileData.communityProfile.contactPerson && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Contact Person</label>
                    <p className="text-gray-900 dark:text-white">{profileData.communityProfile.contactPerson.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
                    <p className="text-gray-900 dark:text-white">{profileData.communityProfile.contactPerson.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Phone</label>
                    <p className="text-gray-900 dark:text-white">{profileData.communityProfile.contactPerson.phone}</p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profileData.communityProfile.instagramHandle || profileData.communityProfile.facebookPage || profileData.communityProfile.websiteUrl) && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Social Media</label>
                  <div className="flex flex-wrap gap-3">
                    {profileData.communityProfile.instagramHandle && (
                      <a href={`https://instagram.com/${profileData.communityProfile.instagramHandle}`} target="_blank" rel="noopener noreferrer" 
                         className="flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                        <Instagram className="h-4 w-4" />
                        @{profileData.communityProfile.instagramHandle}
                      </a>
                    )}
                    {profileData.communityProfile.facebookPage && (
                      <a href={profileData.communityProfile.facebookPage} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </a>
                    )}
                    {profileData.communityProfile.websiteUrl && (
                      <a href={profileData.communityProfile.websiteUrl} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Experience & Audience */}
              {(profileData.communityProfile.pastEventExperience || profileData.communityProfile.typicalAudienceSize) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileData.communityProfile.pastEventExperience && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Events Hosted</label>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profileData.communityProfile.pastEventExperience}</p>
                    </div>
                  )}
                  {profileData.communityProfile.typicalAudienceSize && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Typical Audience</label>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profileData.communityProfile.typicalAudienceSize}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Venue Profile */}
        {isVenue && profileData.venueProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Venue Profile
            </h2>
            
            <div className="space-y-6">
              {/* Venue Name & Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Venue Name</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{profileData.venueProfile.venueName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">City</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{profileData.venueProfile.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Locality</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{profileData.venueProfile.locality}</p>
                </div>
              </div>

              {/* Venue Type & Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Venue Type</label>
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium capitalize">
                    {profileData.venueProfile.venueType}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Capacity Range</label>
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                    {profileData.venueProfile.capacityRange}
                  </span>
                </div>
              </div>

              {/* Contact Person */}
              {profileData.venueProfile.contactPerson && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Contact Person</label>
                    <p className="text-gray-900 dark:text-white">{profileData.venueProfile.contactPerson.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
                    <p className="text-gray-900 dark:text-white">{profileData.venueProfile.contactPerson.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Phone</label>
                    <p className="text-gray-900 dark:text-white">{profileData.venueProfile.contactPerson.phone}</p>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {profileData.venueProfile.amenities && profileData.venueProfile.amenities.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.venueProfile.amenities.map((amenity, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm capitalize">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {profileData.venueProfile.rules && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`p-3 rounded-lg ${profileData.venueProfile.rules.alcoholAllowed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Alcohol</p>
                    <p className={`font-semibold ${profileData.venueProfile.rules.alcoholAllowed ? 'text-green-600' : 'text-red-600'}`}>
                      {profileData.venueProfile.rules.alcoholAllowed ? 'Allowed' : 'Not Allowed'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${profileData.venueProfile.rules.smokingAllowed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Smoking</p>
                    <p className={`font-semibold ${profileData.venueProfile.rules.smokingAllowed ? 'text-green-600' : 'text-red-600'}`}>
                      {profileData.venueProfile.rules.smokingAllowed ? 'Allowed' : 'Not Allowed'}
                    </p>
                  </div>
                  {profileData.venueProfile.rules.minimumAge && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Min Age</p>
                      <p className="font-semibold text-blue-600">{profileData.venueProfile.rules.minimumAge}+</p>
                    </div>
                  )}
                  {profileData.venueProfile.rules.soundRestrictions && (
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Sound</p>
                      <p className="font-semibold text-orange-600">Restricted</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing */}
              {profileData.venueProfile.pricing && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Pricing Information</label>
                  <p className="text-gray-700 dark:text-gray-300">
                    ₹{profileData.venueProfile.pricing.hourlyRate?.toLocaleString('en-IN') || 0}/hour 
                    (Min: {profileData.venueProfile.pricing.minimumBooking || 0} hours)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Brand Profile */}
        {isBrandSponsor && profileData.brandProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              Brand Profile
            </h2>
            
            <div className="space-y-6">
              {/* Brand Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Brand Name</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{profileData.brandProfile.brandName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
                  <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium capitalize">
                    {profileData.brandProfile.brandCategory?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Description */}
              {profileData.brandProfile.brandDescription && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">About</label>
                  <p className="text-gray-700 dark:text-gray-300">{profileData.brandProfile.brandDescription}</p>
                </div>
              )}

              {/* Target Cities */}
              {profileData.brandProfile.targetCity && profileData.brandProfile.targetCity.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Target Cities</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.brandProfile.targetCity.map((city, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm">
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsorship Type */}
              {profileData.brandProfile.sponsorshipType && profileData.brandProfile.sponsorshipType.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Sponsorship Types</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.brandProfile.sponsorshipType.map((type, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collaboration Intents */}
              {profileData.brandProfile.collaborationIntent && profileData.brandProfile.collaborationIntent.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Collaboration Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.brandProfile.collaborationIntent.map((intent, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm capitalize">
                        {intent.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Person */}
              {profileData.brandProfile.contactPerson && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Contact Person</label>
                    <p className="text-gray-900 dark:text-white">{profileData.brandProfile.contactPerson.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Work Email</label>
                    <p className="text-gray-900 dark:text-white">{profileData.brandProfile.contactPerson.workEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Designation</label>
                    <p className="text-gray-900 dark:text-white">{profileData.brandProfile.contactPerson.designation}</p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profileData.brandProfile.websiteUrl || profileData.brandProfile.instagramHandle) && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Online Presence</label>
                  <div className="flex flex-wrap gap-3">
                    {profileData.brandProfile.websiteUrl && (
                      <a href={profileData.brandProfile.websiteUrl} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    {profileData.brandProfile.instagramHandle && (
                      <a href={`https://instagram.com/${profileData.brandProfile.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                        <Instagram className="h-4 w-4" />
                        @{profileData.brandProfile.instagramHandle}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Budget */}
              {profileData.brandProfile.budget && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Budget Range</label>
                  <p className="text-gray-700 dark:text-gray-300">
                    ₹{profileData.brandProfile.budget.min?.toLocaleString('en-IN') || 0} - ₹{profileData.brandProfile.budget.max?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-green-600" />
                Edit Profile
              </h3>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {/* Basic Fields (All Users) */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={editForm.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter city"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tell us about yourself..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Community Organizer Fields */}
            {isCommunityOrganizer && (
              <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Community Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Community Name
                    </label>
                    <input
                      type="text"
                      name="communityName"
                      value={editForm.communityName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter community name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Category
                    </label>
                    <input
                      type="text"
                      name="primaryCategory"
                      value={editForm.primaryCategory}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Sports, Arts, Tech"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Community Description
                    </label>
                    <textarea
                      name="communityDescription"
                      value={editForm.communityDescription}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Describe your community..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      name="instagramHandle"
                      value={editForm.instagramHandle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      name="websiteUrl"
                      value={editForm.websiteUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Venue Fields */}
            {isVenue && (
              <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Venue Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue Name
                    </label>
                    <input
                      type="text"
                      name="venueName"
                      value={editForm.venueName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter venue name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={editForm.capacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Maximum capacity"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue Description
                    </label>
                    <textarea
                      name="venueDescription"
                      value={editForm.venueDescription}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Describe your venue..."
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amenities (comma separated)
                    </label>
                    <input
                      type="text"
                      name="amenities"
                      value={editForm.amenities}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="WiFi, Parking, Audio System, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Brand Sponsor Fields */}
            {isBrandSponsor && (
              <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  Brand Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={editForm.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={editForm.industry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Technology, Food & Beverage"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand Description
                    </label>
                    <textarea
                      name="brandDescription"
                      value={editForm.brandDescription}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Describe your brand..."
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      name="targetAudience"
                      value={editForm.targetAudience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Describe your target audience"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-bounce-in">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Success!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your profile has been updated successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
