import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  User, Mail, Phone, MapPin, Edit2, Save, X, 
  Building2, Users, Sparkles, Upload, Trash2, LogOut,
  CreditCard, HelpCircle, Shield, Camera, Plus, CheckCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import NavigationBar from '../components/NavigationBar'
import SupportModal from '../components/SupportModal'
import { api } from '../config/api.js'

const ProfileNew = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated, loading: authLoading, isHostPartner, isCommunityOrganizer, isVenue, isBrandSponsor } = useAuth()
  
  // Refs
  const fileInputRef = useRef(null)
  const photoInputRef = useRef(null)
  const payoutSectionRef = useRef(null)
  
  // State
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  
  // Section-based editing
  const [editingSection, setEditingSection] = useState(null)
  
  // Forms
  const [profileForm, setProfileForm] = useState({ 
    name: '', bio: '', phoneNumber: '', city: '',
    instagram: '', facebook: '', website: '', linkedin: ''
  })
  const [hostingForm, setHostingForm] = useState({
    preferredCities: [],
    preferredCategories: [],
    preferredEventFormats: [],
    preferredCollaborationTypes: [],
    preferredAudienceTypes: [],
    nicheCommunityDescription: ''
  })
  const [payoutForm, setPayoutForm] = useState({
    accountNumber: '', ifscCode: '', accountHolderName: '',
    bankName: '', accountType: 'savings', panNumber: '', gstNumber: ''
  })
  const [venueDetailsForm, setVenueDetailsForm] = useState({
    capacityRange: '', alcoholAllowed: false, smokingAllowed: false,
    ageLimit: '18+', entryCutoffTime: '', soundRestrictions: '', additionalRules: ''
  })
  
  // Constants
  const categoryOptions = [
    'Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance',
    'Immersive', 'Food & Beverage', 'Games'
  ]
  
  const brandCategoryOptions = [
    'food_beverage', 'wellness_fitness', 'lifestyle', 'tech',
    'entertainment', 'fashion', 'education', 'other'
  ]
  
  const collaborationIntentOptions = [
    'sponsorship', 'sampling', 'popups', 'experience_partnerships',
    'brand_activation', 'content_creation'
  ]

  // Fetch profile data
  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchProfileData()
  }, [isAuthenticated, authLoading, navigate])

  // Handle deep linking to payout section
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const section = params.get('section')
    if (section === 'payout' && profileData && !loading) {
      setEditingSection('payout')
      setTimeout(() => {
        payoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [location, profileData, loading])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')
      setProfileData(response.data.user)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  // Edit handlers
  const handleEditSection = (section) => {
    setEditingSection(section)
    
    if (section === 'profile') {
      // Get social links based on user type
      let socialLinks = {};
      if (isCommunityOrganizer) {
        socialLinks = profileData.communityProfile || {};
      } else if (isVenue) {
        socialLinks = profileData.venueProfile || {};
      } else if (isBrandSponsor) {
        socialLinks = profileData.brandProfile || {};
      } else {
        // B2C users - get from base socialLinks field
        socialLinks = profileData.socialLinks || {};
      }
      
      setProfileForm({
        name: profileData.name || '',
        bio: profileData.bio || '',
        phoneNumber: profileData.phoneNumber || '',
        city: profileData.location?.city || '',
        instagram: socialLinks?.instagram || '',
        facebook: socialLinks?.facebook || '',
        website: socialLinks?.website || '',
        linkedin: socialLinks?.linkedin || ''
      })
    } else if (section === 'hosting') {
      if (isCommunityOrganizer) {
        setHostingForm({
          preferredCities: profileData.communityProfile?.preferredCities || [],
          preferredCategories: profileData.communityProfile?.preferredCategories || [],
          preferredEventFormats: profileData.communityProfile?.preferredEventFormats || [],
          preferredCollaborationTypes: profileData.communityProfile?.preferredCollaborationTypes || [],
          preferredAudienceTypes: profileData.communityProfile?.preferredAudienceTypes || [],
          nicheCommunityDescription: profileData.communityProfile?.nicheCommunityDescription || ''
        })
      } else if (isVenue) {
        setHostingForm({
          preferredCities: profileData.venueProfile?.preferredCities || [],
          preferredCategories: profileData.venueProfile?.preferredCategories || [],
          preferredEventFormats: profileData.venueProfile?.preferredEventFormats || [],
          preferredCollaborationTypes: profileData.venueProfile?.preferredCollaborationTypes || [],
          preferredAudienceTypes: profileData.venueProfile?.preferredAudienceTypes || [],
          nicheCommunityDescription: profileData.venueProfile?.nicheCommunityDescription || ''
        })
      }
    } else if (section === 'payout') {
      setPayoutForm({
        accountNumber: profileData.payoutInfo?.accountNumber || '',
        ifscCode: profileData.payoutInfo?.ifscCode || '',
        accountHolderName: profileData.payoutInfo?.accountHolderName || '',
        bankName: profileData.payoutInfo?.bankName || '',
        accountType: profileData.payoutInfo?.accountType || 'savings',
        panNumber: profileData.payoutInfo?.panNumber || '',
        gstNumber: profileData.payoutInfo?.gstNumber || ''
      })
    } else if (section === 'venue') {
      setVenueDetailsForm({
        capacityRange: profileData.venueProfile?.capacityRange || '',
        alcoholAllowed: profileData.venueProfile?.rules?.alcoholAllowed || false,
        smokingAllowed: profileData.venueProfile?.rules?.smokingAllowed || false,
        ageLimit: profileData.venueProfile?.rules?.ageLimit || '18+',
        entryCutoffTime: profileData.venueProfile?.rules?.entryCutoffTime || '',
        soundRestrictions: profileData.venueProfile?.rules?.soundRestrictions || '',
        additionalRules: profileData.venueProfile?.rules?.additionalRules || ''
      })
    }
  }

  // Save handlers
  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const payload = {
        name: profileForm.name,
        phoneNumber: profileForm.phoneNumber,
        bio: profileForm.bio,
        location: { city: profileForm.city }
      };
      
      // Add social links for all user types
      payload.socialLinks = {
        instagram: profileForm.instagram,
        facebook: profileForm.facebook,
        website: profileForm.website
      };
      
      // Add LinkedIn for brand sponsors only
      if (isBrandSponsor) {
        payload.socialLinks.linkedin = profileForm.linkedin;
      }
      
      const response = await api.put('/users/profile', payload)
      setProfileData(response.data.user)
      setEditingSection(null)
      setMessage({ type: 'success', text: 'Profile updated!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveHostingPreferences = async () => {
    try {
      setSaving(true)
      const response = await api.put('/users/profile/hosting-preferences', hostingForm)
      setProfileData(response.data.user)
      setEditingSection(null)
      setMessage({ type: 'success', text: 'Hosting preferences updated!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update hosting preferences' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePayout = async () => {
    try {
      setSaving(true)
      const response = await api.put('/users/profile/payout', payoutForm)
      setProfileData(response.data.user)
      setEditingSection(null)
      setMessage({ type: 'success', text: 'Payout information updated!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update payout information' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveVenueDetails = async () => {
    try {
      setSaving(true)
      const response = await api.put('/users/profile/venue-details', {
        capacityRange: venueDetailsForm.capacityRange,
        rules: {
          alcoholAllowed: venueDetailsForm.alcoholAllowed,
          smokingAllowed: venueDetailsForm.smokingAllowed,
          ageLimit: venueDetailsForm.ageLimit,
          entryCutoffTime: venueDetailsForm.entryCutoffTime,
          soundRestrictions: venueDetailsForm.soundRestrictions,
          additionalRules: venueDetailsForm.additionalRules
        }
      })
      setProfileData(response.data.user)
      setEditingSection(null)
      setMessage({ type: 'success', text: 'Venue details updated!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update venue details' })
    } finally {
      setSaving(false)
    }
  }

  // Photo handlers
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    try {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const response = await api.post('/users/upload-profile-picture', { imageData: reader.result })
        setProfileData(response.data.user)
        setMessage({ type: 'success', text: 'Profile picture updated!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload picture' })
    } finally {
      setIsUploading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    const currentPhotos = isCommunityOrganizer 
      ? profileData.communityProfile?.pastEventPhotos || []
      : profileData.venueProfile?.photos || []
    
    if (currentPhotos.length >= 5) {
      setMessage({ type: 'error', text: 'Maximum 5 photos allowed' })
      return
    }

    try {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const response = await api.post('/users/profile/photos', { imageData: reader.result })
        setProfileData(response.data.user)
        setMessage({ type: 'success', text: 'Photo uploaded!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload photo' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async (photoUrl) => {
    if (!confirm('Delete this photo?')) return
    
    try {
      setIsUploading(true)
      const response = await api.delete('/users/profile/photos', { data: { photoUrl } })
      setProfileData(response.data.user)
      setMessage({ type: 'success', text: 'Photo deleted!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete photo' })
    } finally {
      setIsUploading(false)
    }
  }

  const getUserInitials = () => {
    if (!profileData?.name) return '?'
    return profileData.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const toggleArrayItem = (arr, item) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Failed to load profile data</p>
        </div>
      </div>
    )
  }

  // Get photos array
  const photos = isCommunityOrganizer 
    ? profileData.communityProfile?.pastEventPhotos || []
    : isVenue 
    ? profileData.venueProfile?.photos || []
    : []

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      
      {/* Animations CSS */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in forwards;
        }
        .transition-card {
          transition: all 0.3s ease-in-out;
        }
        .transition-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(120, 120, 233, 0.1);
        }
      `}</style>
      
      {/* Message Banner */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            message.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        {/* B2C User Layout */}
        {profileData.role === 'user' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interests Column */}
            <div className="space-y-6">
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <h2 className="text-xl font-bold text-white mb-4">My Interests</h2>
                {profileData.interests && profileData.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/50">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No interests added yet. Update your profile to add interests.</p>
                )}
              </div>
            </div>

            {/* Profile Column */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Profile</h2>
                  {editingSection !== 'profile' && (
                    <button 
                      onClick={() => handleEditSection('profile')}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Profile Picture */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {profileData.profilePicture ? (
                      <img 
                        src={profileData.profilePicture} 
                        alt="Profile" 
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                        {getUserInitials()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-1.5 hover:bg-purple-700 transition-colors"
                    >
                      <Camera className="h-3 w-3 text-white" />
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{profileData.name}</h3>
                    <p className="text-gray-400 text-sm">{profileData.email}</p>
                  </div>
                </div>

                {editingSection === 'profile' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Name</label>
                      <input 
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Bio</label>
                      <textarea 
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows="3"
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Apply'}
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileData.bio && (
                      <p className="text-gray-300">{profileData.bio}</p>
                    )}
                    <div className="flex items-center text-gray-400 text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      {profileData.location?.city || 'Not specified'}
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Phone className="h-4 w-4 mr-2" />
                      {profileData.phoneNumber || 'Not specified'}
                    </div>
                    
                    {/* Logout Button */}
                    <div className="pt-4 border-t border-gray-800">
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Help & Support Section */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-purple-500" />
                  <h3 className="text-white font-semibold">Help & Support</h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Help Center
                  </button>
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Contact Support
                  </button>
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Terms & Privacy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* B2B Partner Layout (Community, Venue, Brand) */}
        {isHostPartner && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Profile Card with Purple Gradient */}
              <div className="bg-gradient-to-br from-[#7878E9] to-[#3D3DD4] rounded-lg p-6 transition-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {profileData.profilePicture ? (
                      <img 
                        src={profileData.profilePicture} 
                        alt="Profile" 
                        className="h-16 w-16 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                        {getUserInitials()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {isCommunityOrganizer && profileData.communityProfile?.communityName}
                        {isVenue && profileData.venueProfile?.venueName}
                        {isBrandSponsor && profileData.brandProfile?.brandName}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {isCommunityOrganizer && 'Community Organizer'}
                        {isVenue && 'Venue Partner'}
                        {isBrandSponsor && 'Brand Partner'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-white/90">
                  {isCommunityOrganizer && profileData.communityProfile?.communityDescription}
                  {isBrandSponsor && profileData.brandProfile?.brandDescription}
                </p>
              </div>

              {/* Community Photos / Venue Photos (5 slots) */}
              {(isCommunityOrganizer || isVenue) && (
                <div className="bg-[#171717] rounded-lg p-6 transition-card">
                  <h3 className="text-white font-semibold mb-4">
                    {isCommunityOrganizer ? 'Community Photos' : 'Venue Photos'} ({photos.length}/5)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                        <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleDeletePhoto(photo)}
                          disabled={isUploading}
                          className="absolute top-1 right-1 bg-red-600 rounded-full p-1 hover:bg-red-700 transition-colors"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploading}
                        className="aspect-square rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 hover:border-purple-600 transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-8 w-8 text-gray-500" />
                      </button>
                    )}
                  </div>
                  <input 
                    ref={photoInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Contact Information</h3>
                  {editingSection !== 'profile' && (
                    <button 
                      onClick={() => handleEditSection('profile')}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {editingSection === 'profile' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Name</label>
                      <input 
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Phone</label>
                      <input 
                        type="tel"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">City</label>
                      <input 
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    
                    {/* Social Links for All Users */}
                    <>
                      <div className="border-t border-gray-700 my-3 pt-3">
                        <p className="text-gray-400 text-xs font-semibold mb-2">SOCIAL LINKS</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Instagram</label>
                        <input 
                          type="text"
                          value={profileForm.instagram}
                          onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                          placeholder="@yourusername or profile URL"
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Facebook</label>
                        <input 
                          type="text"
                          value={profileForm.facebook}
                          onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                          placeholder="Facebook page URL"
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Website</label>
                        <input 
                          type="text"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                          placeholder="https://yourwebsite.com"
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                      {isBrandSponsor && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">LinkedIn</label>
                          <input 
                            type="text"
                            value={profileForm.linkedin}
                            onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                            placeholder="LinkedIn company URL"
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      )}
                    </>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Apply'}
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-300">
                      <User className="h-4 w-4 mr-3 text-gray-500" />
                      {profileData.name}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Mail className="h-4 w-4 mr-3 text-gray-500" />
                      {profileData.email}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Phone className="h-4 w-4 mr-3 text-gray-500" />
                      {profileData.phoneNumber || 'Not specified'}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                      {profileData.location?.city || 'Not specified'}
                    </div>
                    
                    {/* Social Links for All Users */}
                    {(() => {
                      // Get social links based on user type
                      let socialLinks = {};
                      if (isCommunityOrganizer) {
                        socialLinks = profileData.communityProfile || {};
                      } else if (isVenue) {
                        socialLinks = profileData.venueProfile || {};
                      } else if (isBrandSponsor) {
                        socialLinks = profileData.brandProfile || {};
                      } else {
                        socialLinks = profileData.socialLinks || {};
                      }
                      
                      return (
                        <>
                          <div className="border-t border-gray-700 my-3 pt-3">
                            <p className="text-gray-400 text-xs font-semibold mb-2">SOCIAL LINKS</p>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-gray-500 text-xs">Instagram</p>
                              <p className="text-gray-300 text-sm break-all">
                                {socialLinks?.instagram || <span className="text-gray-500 italic">Not specified</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Facebook</p>
                              <p className="text-gray-300 text-sm break-all">
                                {socialLinks?.facebook || <span className="text-gray-500 italic">Not specified</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Website</p>
                              <p className="text-gray-300 text-sm break-all">
                                {socialLinks?.website || <span className="text-gray-500 italic">Not specified</span>}
                              </p>
                            </div>
                            {isBrandSponsor && (
                              <div>
                                <p className="text-gray-500 text-xs">LinkedIn</p>
                                <p className="text-gray-300 text-sm break-all">
                                  {socialLinks?.linkedin || <span className="text-gray-500 italic">Not specified</span>}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Payout/KYC Section */}
              <div ref={payoutSectionRef} className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-400" />
                    <h3 className="text-white font-semibold">Payout & KYC</h3>
                  </div>
                  {editingSection !== 'payout' && (
                    <button 
                      onClick={() => handleEditSection('payout')}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {editingSection === 'payout' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Account Number</label>
                      <input 
                        type="text"
                        value={payoutForm.accountNumber}
                        onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">IFSC Code</label>
                      <input 
                        type="text"
                        value={payoutForm.ifscCode}
                        onChange={(e) => setPayoutForm({ ...payoutForm, ifscCode: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Account Holder Name</label>
                      <input 
                        type="text"
                        value={payoutForm.accountHolderName}
                        onChange={(e) => setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">PAN Number</label>
                      <input 
                        type="text"
                        value={payoutForm.panNumber}
                        onChange={(e) => setPayoutForm({ ...payoutForm, panNumber: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePayout}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Apply'}
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profileData.payoutInfo?.accountNumber ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Account</span>
                          <span className="text-gray-300">••••{profileData.payoutInfo.accountNumber.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">IFSC</span>
                          <span className="text-gray-300">{profileData.payoutInfo.ifscCode}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">PAN</span>
                          <span className="text-gray-300">{profileData.payoutInfo.panNumber || 'Not provided'}</span>
                        </div>
                        <div className="mt-3 flex items-center text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          KYC Details Added
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">No payout details added yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Logout Section */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>

              {/* Help & Support Section */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-purple-500" />
                  <h3 className="text-white font-semibold">Help & Support</h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Help Center
                  </button>
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Contact Support
                  </button>
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Terms & Privacy
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Hosting Preferences & Venue Details - Scrollable */}
              {(isCommunityOrganizer || isVenue) && (
                <div className="bg-[#171717] rounded-lg p-6 transition-card">
                  <h3 className="text-white font-semibold mb-4">
                    {isVenue ? 'Hosting Preferences & Venue Details' : 'Hosting Preferences'}
                  </h3>
                  
                  <div className="max-h-[700px] overflow-y-auto space-y-6 pr-2">
                    {/* Hosting Preferences Subsection */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-gray-300 font-medium">Preferences</h4>
                        {editingSection !== 'hosting' && (
                          <button 
                            onClick={() => handleEditSection('hosting')}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4 text-gray-400" />
                          </button>
                        )}
                      </div>

                      {editingSection === 'hosting' ? (
                        <div className="space-y-4">
                          <div>
                        <label className="block text-sm text-gray-400 mb-2">Preferred Cities</label>
                        <input 
                          type="text"
                          value={hostingForm.preferredCities.join(', ')}
                          onChange={(e) => setHostingForm({ ...hostingForm, preferredCities: e.target.value.split(',').map(c => c.trim()) })}
                          placeholder="Mumbai, Delhi, Bangalore"
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Preferred Categories</label>
                        <div className="flex flex-wrap gap-2">
                          {categoryOptions.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setHostingForm({
                                ...hostingForm,
                                preferredCategories: toggleArrayItem(hostingForm.preferredCategories, cat)
                              })}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                hostingForm.preferredCategories.includes(cat)
                                  ? 'bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white shadow-md shadow-purple-500/50'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(isCommunityOrganizer || isVenue) && (
                        <>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Preferred Event Formats</label>
                            <div className="flex flex-wrap gap-2">
                              {categoryOptions.map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => setHostingForm({
                                    ...hostingForm,
                                    preferredEventFormats: toggleArrayItem(hostingForm.preferredEventFormats, cat)
                                  })}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    hostingForm.preferredEventFormats.includes(cat)
                                      ? 'bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white shadow-md shadow-purple-500/50'
                                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Preferred Audience Types</label>
                            <div className="flex flex-wrap gap-2">
                              {categoryOptions.map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => setHostingForm({
                                    ...hostingForm,
                                    preferredAudienceTypes: toggleArrayItem(hostingForm.preferredAudienceTypes, cat)
                                  })}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    hostingForm.preferredAudienceTypes.includes(cat)
                                      ? 'bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white shadow-md shadow-purple-500/50'
                                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Niche Community Description</label>
                            <textarea 
                              value={hostingForm.nicheCommunityDescription}
                              onChange={(e) => setHostingForm({ ...hostingForm, nicheCommunityDescription: e.target.value })}
                              rows="3"
                              placeholder="Describe your community's niche..."
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={handleSaveHostingPreferences}
                          disabled={saving}
                          className="flex-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Apply'}
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Preferred Cities</p>
                        {(isCommunityOrganizer ? profileData.communityProfile?.preferredCities : profileData.venueProfile?.preferredCities)?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(isCommunityOrganizer ? profileData.communityProfile.preferredCities : profileData.venueProfile.preferredCities).map((city, idx) => (
                              <span key={idx} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                                {city}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">Not specified</p>
                        )}
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Preferred Categories</p>
                        {(isCommunityOrganizer ? profileData.communityProfile?.preferredCategories : profileData.venueProfile?.preferredCategories)?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(isCommunityOrganizer ? profileData.communityProfile.preferredCategories : profileData.venueProfile.preferredCategories).map((cat, idx) => (
                              <span key={idx} className="px-3 py-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/50">
                                {cat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">Not specified</p>
                        )}
                      </div>

                      {(isCommunityOrganizer || isVenue) && (
                        <>
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Preferred Event Formats</p>
                            {(isCommunityOrganizer ? profileData.communityProfile?.preferredEventFormats : profileData.venueProfile?.preferredEventFormats)?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(isCommunityOrganizer ? profileData.communityProfile.preferredEventFormats : profileData.venueProfile.preferredEventFormats).map((format, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/50">
                                    {format}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm italic">Not specified</p>
                            )}
                          </div>

                          <div>
                            <p className="text-gray-400 text-sm mb-2">Preferred Audience Types</p>
                            {(isCommunityOrganizer ? profileData.communityProfile?.preferredAudienceTypes : profileData.venueProfile?.preferredAudienceTypes)?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(isCommunityOrganizer ? profileData.communityProfile.preferredAudienceTypes : profileData.venueProfile.preferredAudienceTypes).map((type, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/50">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm italic">Not specified</p>
                            )}
                          </div>

                          {isCommunityOrganizer && (
                            <div>
                              <p className="text-gray-400 text-sm mb-2">Niche Description</p>
                              <p className="text-gray-300 text-sm">
                                {profileData.communityProfile?.nicheCommunityDescription || <span className="text-gray-500 italic">Not specified</span>}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Venue Details Subsection (Venue Only) */}
                {isVenue && (
                  <div className="border-t border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-gray-300 font-medium">Venue Details</h4>
                      {editingSection !== 'venue' && (
                        <button 
                          onClick={() => handleEditSection('venue')}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </div>

                    {editingSection === 'venue' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Capacity Range</label>
                          <select
                            value={venueDetailsForm.capacityRange}
                            onChange={(e) => setVenueDetailsForm({ ...venueDetailsForm, capacityRange: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          >
                            <option value="">Select capacity</option>
                            <option value="0-20">0-20</option>
                            <option value="20-40">20-40</option>
                            <option value="40-80">40-80</option>
                            <option value="80-150">80-150</option>
                            <option value="150-300">150-300</option>
                            <option value="300+">300+</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Age Limit</label>
                          <select
                            value={venueDetailsForm.ageLimit}
                            onChange={(e) => setVenueDetailsForm({ ...venueDetailsForm, ageLimit: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          >
                            <option value="All Ages">All Ages</option>
                            <option value="18+">18+</option>
                            <option value="21+">21+</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Entry Cutoff Time</label>
                          <input 
                            type="text"
                            value={venueDetailsForm.entryCutoffTime}
                            onChange={(e) => setVenueDetailsForm({ ...venueDetailsForm, entryCutoffTime: e.target.value })}
                            placeholder="e.g., 11:00 PM"
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Alcohol Allowed</span>
                          <button
                            onClick={() => setVenueDetailsForm({ ...venueDetailsForm, alcoholAllowed: !venueDetailsForm.alcoholAllowed })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              venueDetailsForm.alcoholAllowed ? 'bg-purple-600' : 'bg-gray-700'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              venueDetailsForm.alcoholAllowed ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Smoking Allowed</span>
                          <button
                            onClick={() => setVenueDetailsForm({ ...venueDetailsForm, smokingAllowed: !venueDetailsForm.smokingAllowed })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              venueDetailsForm.smokingAllowed ? 'bg-purple-600' : 'bg-gray-700'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              venueDetailsForm.smokingAllowed ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={handleSaveVenueDetails}
                            disabled={saving}
                            className="flex-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Apply'}
                          </button>
                          <button
                            onClick={() => setEditingSection(null)}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-[#7878E9]/20 via-[#5858DB]/15 to-[#3D3DD4]/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                          <p className="text-gray-400 text-xs mb-1">Capacity</p>
                          <p className="text-white font-medium">{profileData.venueProfile?.capacityRange || 'Not set'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#7878E9]/20 via-[#5858DB]/15 to-[#3D3DD4]/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                          <p className="text-gray-400 text-xs mb-1">Age Limit</p>
                          <p className="text-white font-medium">{profileData.venueProfile?.rules?.ageLimit || '18+'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#7878E9]/20 via-[#5858DB]/15 to-[#3D3DD4]/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                          <p className="text-gray-400 text-xs mb-1">Entry Cutoff</p>
                          <p className="text-white font-medium">{profileData.venueProfile?.rules?.entryCutoffTime || 'Not set'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#7878E9]/20 via-[#5858DB]/15 to-[#3D3DD4]/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                          <p className="text-gray-400 text-xs mb-1">Restrictions</p>
                          <p className="text-white font-medium">
                            {profileData.venueProfile?.rules?.alcoholAllowed ? '🍺' : '🚫'} 
                            {profileData.venueProfile?.rules?.smokingAllowed ? ' 🚬' : ' 🚭'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

              {/* Brand Preferences Section */}
              {isBrandSponsor && (
                <div className="bg-[#171717] rounded-lg p-6 transition-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Brand Preferences</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Target Cities</p>
                      {profileData.brandProfile?.targetCity?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.brandProfile.targetCity.map((city, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                              {city}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Not specified</p>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm mb-2">Brand Category</p>
                      {profileData.brandProfile?.brandCategory ? (
                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/50">
                          {profileData.brandProfile.brandCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Not specified</p>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm mb-2">Collaboration Intent</p>
                      {profileData.brandProfile?.collaborationIntent?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.brandProfile.collaborationIntent.map((intent, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/50">
                              {intent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Not specified</p>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm mb-2">Sponsorship Types</p>
                      {profileData.brandProfile?.sponsorshipType?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.brandProfile.sponsorshipType.map((type, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/50">
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Help & Support */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Help & Support</h3>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                  >
                    Help Center
                  </button>
                  <button 
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                  >
                    Contact Support
                  </button>
                  <button 
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Terms & Privacy
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-semibold"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Support Modal */}
      <SupportModal 
        isOpen={supportModalOpen} 
        onClose={() => setSupportModalOpen(false)}
        userRole={
          isCommunityOrganizer ? 'Community Organizer' :
          isVenue ? 'Venue Partner' :
          isBrandSponsor ? 'Brand Sponsor' :
          'Regular User'
        }
      />
    </div>
  )
}

export default ProfileNew
