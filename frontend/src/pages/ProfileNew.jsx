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
    name: '', bio: '', phoneNumber: '', city: '', age: '', gender: '',
    instagram: '', facebook: '', website: '', linkedin: '',
    communityName: '', shortBio: '', logo: '', coverImage: '',
    contactEmail: '', contactPhone: '', communityDescription: '',
    brandName: '', brandDescription: '', venueName: '', venueDescription: '',
    googleMapsLink: '', whatsapp: '', spaceType: '', seatingCapacity: '',
    operatingHours: '', parkingAvailability: ''
  })
  const [hostingForm, setHostingForm] = useState({
    preferredCities: [],
    preferredCategories: [],
    preferredEventFormats: [],
    preferredCollaborationTypes: [],
    preferredAudienceTypes: [],
    nicheCommunityDescription: '',
    averageEventSize: ''
  })
  const [payoutForm, setPayoutForm] = useState({
    accountNumber: '', ifscCode: '', accountHolderName: '',
    bankName: '', accountType: 'savings', panNumber: '', gstNumber: '',
    billingAddress: '', upiId: ''
  })
  const [venueDetailsForm, setVenueDetailsForm] = useState({
    capacityRange: '', alcoholAllowed: false, smokingAllowed: false,
    ageLimit: '18+', entryCutoffTime: '', soundRestrictions: '', 
    soundCutoffTime: '', additionalRules: '',
    commercialModel: '', rentalFee: '', coverChargePerGuest: '', 
    revenueSharePercentage: '', operatingDays: [],
    foodBeverageExclusivity: false, externalVendorsAllowed: true,
    decorationAllowed: true
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

  const eventFormatOptions = [
    'Workshop',
    'Mixer / Social',
    'Tournament',
    'Performance / Show',
    'Panel / Talk',
    'Experiential / Activation'
  ]

  const audienceTypeOptions = [
    'Students',
    'Young Professionals',
    'Founders / Creators',
    'Families',
    'Niche Community'
  ]

  const audienceSizeOptions = [
    '≤20',
    '20-50',
    '50-100',
    '100+'
  ]

  const venueCapacityOptions = [
    '≤30',
    '30-50',
    '50-100',
    '100+'
  ]

  const collaborationTypeOptions = [
    'Sponsorship',
    'Sampling',
    'Pop-ups',
    'Co-hosted events'
  ]

  const operatingDayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
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
      // Get social links and profile data based on user type
      let socialLinks = {};
      let communityData = {};
      let venueData = {};
      let brandData = {};
      
      if (isCommunityOrganizer) {
        socialLinks = profileData.communityProfile || {};
        communityData = profileData.communityProfile || {};
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          phoneNumber: profileData.phoneNumber || '',
          city: profileData.location?.city || '',
          age: profileData.age || '',
          gender: profileData.gender || '',
          instagram: socialLinks?.instagram || '',
          facebook: socialLinks?.facebook || '',
          website: socialLinks?.website || '',
          linkedin: socialLinks?.linkedin || '',
          communityName: communityData?.communityName || '',
          shortBio: communityData?.shortBio || '',
          communityDescription: communityData?.communityDescription || '',
          logo: communityData?.logo || '',
          coverImage: communityData?.coverImage || '',
          contactEmail: communityData?.contactPerson?.email || '',
          contactPhone: communityData?.contactPerson?.phone || ''
        });
      } else if (isVenue) {
        socialLinks = profileData.venueProfile || {};
        venueData = profileData.venueProfile || {};
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          phoneNumber: profileData.phoneNumber || '',
          city: profileData.location?.city || '',
          age: profileData.age || '',
          gender: profileData.gender || '',
          instagram: socialLinks?.instagram || '',
          facebook: socialLinks?.facebook || '',
          website: socialLinks?.website || '',
          whatsapp: venueData?.whatsapp || '',
          venueName: venueData?.venueName || '',
          venueDescription: venueData?.venueDescription || '',
          logo: venueData?.logo || '',
          coverImage: venueData?.coverImage || '',
          googleMapsLink: venueData?.googleMapsLink || '',
          spaceType: venueData?.spaceType || '',
          seatingCapacity: venueData?.seatingCapacity || '',
          operatingHours: venueData?.operatingHours || '',
          parkingAvailability: venueData?.parkingAvailability || ''
        });
      } else if (isBrandSponsor) {
        socialLinks = profileData.brandProfile || {};
        brandData = profileData.brandProfile || {};
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          phoneNumber: profileData.phoneNumber || '',
          city: profileData.location?.city || '',
          age: profileData.age || '',
          gender: profileData.gender || '',
          instagram: socialLinks?.instagram || '',
          facebook: socialLinks?.facebook || '',
          website: socialLinks?.website || '',
          linkedin: socialLinks?.linkedin || '',
          brandName: brandData?.brandName || '',
          brandDescription: brandData?.brandDescription || '',
          logo: brandData?.logo || ''
        });
      } else {
        // B2C users - get from base socialLinks field
        socialLinks = profileData.socialLinks || {};
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          phoneNumber: profileData.phoneNumber || '',
          city: profileData.location?.city || '',
          age: profileData.age || '',
          gender: profileData.gender || '',
          instagram: socialLinks?.instagram || '',
          facebook: socialLinks?.facebook || '',
          website: socialLinks?.website || ''
        });
      }
    } else if (section === 'hosting') {
      if (isCommunityOrganizer) {
        setHostingForm({
          preferredCities: profileData.communityProfile?.preferredCities || [],
          preferredCategories: profileData.communityProfile?.preferredCategories || [],
          preferredEventFormats: profileData.communityProfile?.preferredEventFormats || [],
          preferredCollaborationTypes: profileData.communityProfile?.preferredCollaborationTypes || [],
          preferredAudienceTypes: profileData.communityProfile?.preferredAudienceTypes || [],
          nicheCommunityDescription: profileData.communityProfile?.nicheCommunityDescription || '',
          averageEventSize: profileData.communityProfile?.typicalAudienceSize || ''
        })
      } else if (isVenue) {
        setHostingForm({
          preferredCities: profileData.venueProfile?.preferredCities || [],
          preferredCategories: profileData.venueProfile?.preferredCategories || [],
          preferredEventFormats: profileData.venueProfile?.preferredEventFormats || [],
          preferredCollaborationTypes: profileData.venueProfile?.preferredCollaborationTypes || [],
          preferredAudienceTypes: profileData.venueProfile?.preferredAudienceTypes || [],
          nicheCommunityDescription: profileData.venueProfile?.nicheCommunityDescription || '',
          averageEventSize: ''
        })
      } else if (isBrandSponsor) {
        setHostingForm({
          preferredCities: profileData.brandProfile?.preferredCities || [],
          preferredCategories: profileData.brandProfile?.preferredCategories || [],
          preferredEventFormats: profileData.brandProfile?.preferredEventFormats || [],
          preferredCollaborationTypes: profileData.brandProfile?.preferredCollaborationTypes || [],
          preferredAudienceTypes: profileData.brandProfile?.preferredAudienceTypes || [],
          nicheCommunityDescription: profileData.brandProfile?.nicheCommunityDescription || '',
          averageEventSize: ''
        })
      }
    } else if (section === 'payout') {
      setPayoutForm({
        accountNumber: profileData.payoutDetails?.accountNumber || '',
        ifscCode: profileData.payoutDetails?.ifscCode || '',
        accountHolderName: profileData.payoutDetails?.accountHolderName || '',
        bankName: profileData.payoutDetails?.bankName || '',
        accountType: profileData.payoutDetails?.accountType || 'savings',
        panNumber: profileData.payoutDetails?.panNumber || '',
        gstNumber: profileData.payoutDetails?.gstNumber || '',
        billingAddress: profileData.payoutDetails?.billingAddress || '',
        upiId: profileData.payoutDetails?.upiId || ''
      })
    } else if (section === 'venue') {
      setVenueDetailsForm({
        capacityRange: profileData.venueProfile?.capacityRange || '',
        alcoholAllowed: profileData.venueProfile?.rules?.alcoholAllowed || false,
        smokingAllowed: profileData.venueProfile?.rules?.smokingAllowed || false,
        ageLimit: profileData.venueProfile?.rules?.ageLimit || '18+',
        entryCutoffTime: profileData.venueProfile?.rules?.entryCutoffTime || '',
        soundRestrictions: profileData.venueProfile?.rules?.soundRestrictions || '',
        soundCutoffTime: profileData.venueProfile?.rules?.soundCutoffTime || '',
        additionalRules: profileData.venueProfile?.rules?.additionalRules || '',
        commercialModel: profileData.venueProfile?.commercialModel || '',
        rentalFee: profileData.venueProfile?.defaultPricing?.rentalFee || '',
        coverChargePerGuest: profileData.venueProfile?.defaultPricing?.coverChargePerGuest || '',
        revenueSharePercentage: profileData.venueProfile?.defaultPricing?.revenueSharePercentage || '',
        operatingDays: profileData.venueProfile?.operatingDays || [],
        foodBeverageExclusivity: profileData.venueProfile?.rules?.foodBeverageExclusivity || false,
        externalVendorsAllowed: profileData.venueProfile?.rules?.externalVendorsAllowed || true,
        decorationAllowed: profileData.venueProfile?.rules?.decorationAllowed || true
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
        age: profileForm.age,
        gender: profileForm.gender,
        location: { city: profileForm.city }
      };
      
      // For community organizers, update communityProfile
      if (isCommunityOrganizer) {
        payload.communityProfile = {
          communityName: profileForm.communityName,
          shortBio: profileForm.shortBio,
          communityDescription: profileForm.communityDescription,
          logo: profileForm.logo,
          coverImage: profileForm.coverImage,
          city: profileForm.city,
          contactPerson: {
            name: profileForm.name,
            email: profileForm.contactEmail || profileForm.email,
            phone: profileForm.contactPhone || profileForm.phoneNumber
          }
        };
        
        // Add social links to communityProfile
        payload.socialLinks = {
          instagram: profileForm.instagram,
          facebook: profileForm.facebook,
          website: profileForm.website,
          linkedin: profileForm.linkedin
        };
      } else if (isVenue) {
        // Update venue profile
        payload.venueProfile = {
          venueName: profileForm.venueName,
          venueDescription: profileForm.venueDescription,
          logo: profileForm.logo,
          coverImage: profileForm.coverImage,
          googleMapsLink: profileForm.googleMapsLink,
          whatsapp: profileForm.whatsapp,
          spaceType: profileForm.spaceType,
          seatingCapacity: profileForm.seatingCapacity,
          operatingHours: profileForm.operatingHours,
          parkingAvailability: profileForm.parkingAvailability
        };
        
        // Add social links
        payload.socialLinks = {
          instagram: profileForm.instagram,
          facebook: profileForm.facebook,
          website: profileForm.website
        };
      } else if (isBrandSponsor) {
        // Update brand profile
        payload.brandProfile = {
          brandName: profileForm.brandName,
          brandDescription: profileForm.brandDescription,
          logo: profileForm.logo,
          website: profileForm.website
        };
        
        // Add social links
        payload.socialLinks = {
          instagram: profileForm.instagram,
          facebook: profileForm.facebook,
          website: profileForm.website,
          linkedin: profileForm.linkedin
        };
      } else {
        // B2C users - base social links
        payload.socialLinks = {
          instagram: profileForm.instagram,
          facebook: profileForm.facebook,
          website: profileForm.website
        };
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
      // For community organizers, include averageEventSize in their profile
      const payload = { ...hostingForm };
      if (isCommunityOrganizer && hostingForm.averageEventSize) {
        payload.typicalAudienceSize = hostingForm.averageEventSize;
      }
      const response = await api.put('/users/profile/hosting-preferences', payload)
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

  const handleRemoveInterest = async (interestToRemove) => {
    try {
      const updatedInterests = profileData.interests.filter(i => i !== interestToRemove)
      const response = await api.put('/users/profile', { interests: updatedInterests })
      setProfileData(response.data.user)
      setMessage({ type: 'success', text: 'Interest removed!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    } catch (error) {
      console.error('Error removing interest:', error)
      setMessage({ type: 'error', text: 'Failed to remove interest' })
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

  // Calculate profile completion percentage and get missing fields
  const getProfileCompletionDetails = () => {
    if (!profileData) return { percentage: 0, missingFields: [] }
    
    const fields = []
    
    // Common fields for all users
    fields.push({ name: 'Name', value: !!profileData.name })
    fields.push({ name: 'Email', value: !!profileData.email })
    fields.push({ name: 'Phone Number', value: !!profileData.phoneNumber })
    fields.push({ name: 'City', value: !!profileData.location?.city })
    fields.push({ name: 'Profile Picture', value: !!profileData.profilePicture })
    
    if (isHostPartner) {
      // KYC/Payout details (important for all host partners)
      fields.push({ name: 'Account Holder Name', value: !!profileData.payoutDetails?.accountHolderName })
      fields.push({ name: 'Bank Account Number', value: !!profileData.payoutDetails?.accountNumber })
      fields.push({ name: 'IFSC Code', value: !!profileData.payoutDetails?.ifscCode })
      fields.push({ name: 'Billing Address', value: !!profileData.payoutDetails?.billingAddress })
      
      if (isCommunityOrganizer) {
        // Community Organizer specific fields
        fields.push({ name: 'Community Name', value: !!profileData.communityProfile?.communityName })
        fields.push({ name: 'Past Event Experience', value: !!profileData.communityProfile?.pastEventExperience })
        fields.push({ name: 'Community Description', value: !!profileData.communityProfile?.communityDescription })
        fields.push({ name: 'Event Categories (min 1)', value: (profileData.communityProfile?.category?.length > 0) || (profileData.communityProfile?.eventCategories?.length > 0) })
        fields.push({ name: 'Past Event Photos (min 1)', value: profileData.communityProfile?.pastEventPhotos?.length > 0 })
      } else if (isVenue) {
        // Venue specific fields
        fields.push({ name: 'Venue Name', value: !!profileData.venueProfile?.venueName })
        fields.push({ name: 'Venue Type', value: !!profileData.venueProfile?.venueType })
        fields.push({ name: 'Capacity Range', value: !!profileData.venueProfile?.capacityRange })
        fields.push({ name: 'Locality', value: !!profileData.venueProfile?.locality })
        fields.push({ name: 'Venue Photos (min 1)', value: profileData.venueProfile?.photos?.length > 0 })
      } else if (isBrandSponsor) {
        // Brand Sponsor specific fields
        fields.push({ name: 'Brand Name', value: !!profileData.brandProfile?.brandName })
        fields.push({ name: 'Brand Category', value: !!profileData.brandProfile?.brandCategory })
        fields.push({ name: 'Collaboration Intent (min 1)', value: profileData.brandProfile?.collaborationIntent?.length > 0 })
        fields.push({ name: 'Brand Description', value: !!profileData.brandProfile?.brandDescription })
      }
    }
    
    const completed = fields.filter(f => f.value).length
    const total = fields.length
    const percentage = Math.round((completed / total) * 100)
    const missingFields = fields.filter(f => !f.value).map(f => f.name)
    
    return { percentage, missingFields, completed, total }
  }

  // Wrapper for backward compatibility
  const calculateProfileCompletion = () => {
    return getProfileCompletionDetails().percentage
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card with Purple Gradient Header */}
              <div className="bg-[#171717] rounded-lg overflow-hidden transition-card">
                {/* Purple gradient header */}
                <div className="bg-gradient-to-br from-[#7878E9] to-[#3D3DD4] p-6 relative">
                  <button 
                    onClick={() => handleEditSection('profile')}
                    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm font-medium"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {profileData.profilePicture ? (
                        <img 
                          src={profileData.profilePicture} 
                          alt="Profile" 
                          className="h-24 w-24 rounded-xl object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-xl bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-2 border-white/30">
                          {getUserInitials()}
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-white text-purple-600 rounded-lg p-2 hover:bg-gray-100 transition-colors shadow-lg"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
                        {profileData.name}
                      </h2>
                      <p className="text-white/80 text-sm mb-4">Member</p>
                      
                      {profileData.bio && (
                        <p className="text-white/90 text-sm leading-relaxed mb-4">
                          {profileData.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information - Below gradient */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Phone */}
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium truncate">{profileData.phoneNumber || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium truncate">{profileData.email}</p>
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Instagram</p>
                        <p className="text-sm font-medium truncate">
                          {profileData.socialLinks?.instagram || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  {editingSection === 'profile' && (
                    <div className="mt-6 pt-6 border-t border-gray-800 space-y-4">
                      {/* Community Organizer Fields */}
                      {isCommunityOrganizer && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Community Name</label>
                          <input 
                            type="text"
                            value={profileForm.communityName}
                            onChange={(e) => setProfileForm({ ...profileForm, communityName: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            placeholder="Your community name"
                          />
                        </div>
                      )}
                      
                      {/* Venue Fields */}
                      {isVenue && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Venue Name</label>
                          <input 
                            type="text"
                            value={profileForm.venueName}
                            onChange={(e) => setProfileForm({ ...profileForm, venueName: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            placeholder="Your venue name"
                          />
                        </div>
                      )}
                      
                      {/* Brand Sponsor Fields */}
                      {isBrandSponsor && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Brand Name</label>
                          <input 
                            type="text"
                            value={profileForm.brandName}
                            onChange={(e) => setProfileForm({ ...profileForm, brandName: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            placeholder="Your brand name"
                          />
                        </div>
                      )}
                      
                      {/* Common Name Field */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">{isHostPartner ? 'Contact Person Name' : 'Name'}</label>
                        <input 
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                      
                      {/* Age and Gender for B2C users */}
                      {!isHostPartner && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Age</label>
                            <input 
                              type="number"
                              value={profileForm.age}
                              onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                              placeholder="Your age"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Gender</label>
                            <select
                              value={profileForm.gender}
                              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            >
                              <option value="">Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Non-binary">Non-binary</option>
                              <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                          </div>
                        </div>
                      )}
                      
                      {/* Community Short Bio */}
                      {isCommunityOrganizer && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Short Bio (2-3 lines)</label>
                          <textarea 
                            value={profileForm.shortBio}
                            onChange={(e) => setProfileForm({ ...profileForm, shortBio: e.target.value })}
                            rows="2"
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            placeholder="A brief description of your community..."
                          />
                        </div>
                      )}
                      
                      {/* Description/Bio Field */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          {isCommunityOrganizer ? 'Community Description' : 
                           isVenue ? 'Venue Description' : 
                           isBrandSponsor ? 'Brand Description' : 'Bio'}
                        </label>
                        <textarea 
                          value={isCommunityOrganizer ? profileForm.communityDescription : 
                                 isVenue ? profileForm.venueDescription :
                                 isBrandSponsor ? profileForm.brandDescription : profileForm.bio}
                          onChange={(e) => {
                            if (isCommunityOrganizer) {
                              setProfileForm({ ...profileForm, communityDescription: e.target.value });
                            } else if (isVenue) {
                              setProfileForm({ ...profileForm, venueDescription: e.target.value });
                            } else if (isBrandSponsor) {
                              setProfileForm({ ...profileForm, brandDescription: e.target.value });
                            } else {
                              setProfileForm({ ...profileForm, bio: e.target.value });
                            }
                          }}
                          rows="3"
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      
                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                        <input 
                          type="tel"
                          value={profileForm.phoneNumber}
                          onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                      
                      {/* City */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">City</label>
                        <input 
                          type="text"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          placeholder="Your city"
                        />
                      </div>
                      
                      {/* Venue Specific Fields */}
                      {isVenue && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Space Type</label>
                              <select
                                value={profileForm.spaceType}
                                onChange={(e) => setProfileForm({ ...profileForm, spaceType: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                              >
                                <option value="">Select type</option>
                                <option value="Indoor">Indoor</option>
                                <option value="Outdoor">Outdoor</option>
                                <option value="Rooftop">Rooftop</option>
                                <option value="Mixed">Mixed</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Seating Capacity</label>
                              <input 
                                type="number"
                                value={profileForm.seatingCapacity}
                                onChange={(e) => setProfileForm({ ...profileForm, seatingCapacity: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                                placeholder="Number of seats"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Operating Hours</label>
                              <input 
                                type="text"
                                value={profileForm.operatingHours}
                                onChange={(e) => setProfileForm({ ...profileForm, operatingHours: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                                placeholder="e.g. 10 AM - 11 PM"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Parking Availability</label>
                              <select
                                value={profileForm.parkingAvailability}
                                onChange={(e) => setProfileForm({ ...profileForm, parkingAvailability: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                              >
                                <option value="">Select</option>
                                <option value="Available">Available</option>
                                <option value="Not Available">Not Available</option>
                                <option value="Limited">Limited</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Google Maps Link</label>
                            <input 
                              type="url"
                              value={profileForm.googleMapsLink}
                              onChange={(e) => setProfileForm({ ...profileForm, googleMapsLink: e.target.value })}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                              placeholder="https://maps.google.com/..."
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Community Contact Fields */}
                      {isCommunityOrganizer && (
                        <>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Contact Email</label>
                            <input 
                              type="email"
                              value={profileForm.contactEmail}
                              onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                              placeholder="contact@community.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Contact Phone</label>
                            <input 
                              type="tel"
                              value={profileForm.contactPhone}
                              onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                              placeholder="Contact phone number"
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Social Links */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Instagram</label>
                          <input 
                            type="text"
                            value={profileForm.instagram}
                            onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                            placeholder="@username"
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                        {(isCommunityOrganizer || isBrandSponsor) && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">LinkedIn</label>
                            <input 
                              type="text"
                              value={profileForm.linkedin}
                              onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                              placeholder="LinkedIn URL"
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            />
                          </div>
                        )}
                        {isVenue && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">WhatsApp</label>
                            <input 
                              type="text"
                              value={profileForm.whatsapp}
                              onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                              placeholder="WhatsApp number"
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Website for all host partners and B2C with LinkedIn */}
                      {(isHostPartner || !isHostPartner) && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Website</label>
                          <input 
                            type="url"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex-1 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Logout Button */}
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Interests & Support */}
            <div className="space-y-6">
              {/* Interests Card */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Interest
                  </h3>
                  <button 
                    onClick={() => handleEditSection('interests')}
                    className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
                
                {profileData.interests && profileData.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest, idx) => (
                      <div key={idx} className="group relative">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white rounded-full text-sm font-medium shadow-md shadow-purple-500/30">
                          {interest}
                          {editingSection === 'interests' && (
                            <button 
                              onClick={() => handleRemoveInterest(interest)}
                              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No interests added yet</p>
                )}
                
                {editingSection === 'interests' && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Help & Support Section */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Help & Support</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                  >
                    Help center
                    <p className="text-gray-500 text-xs mt-0.5">Browse our knowledge base</p>
                  </button>
                  <button
                    onClick={() => navigate('/contact-us')}
                    className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                  >
                    Contact support
                    <p className="text-gray-500 text-xs mt-0.5">Get in touch with our team</p>
                  </button>
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                  >
                    Terms & privacy
                    <p className="text-gray-500 text-xs mt-0.5">Review our policies</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* B2B Partner Layout (Community, Venue, Brand) */}
        {isHostPartner && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Spans 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card with Purple Gradient Header */}
              <div className="bg-[#171717] rounded-lg overflow-hidden transition-card">
                {/* Purple gradient header */}
                <div 
                  className="p-6 relative"
                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                >
                  <button 
                    onClick={() => handleEditSection('profile')}
                    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm font-medium"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {profileData.profilePicture ? (
                        <img 
                          src={profileData.profilePicture} 
                          alt="Profile" 
                          className="h-20 w-20 rounded-xl object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                          {getUserInitials()}
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-white text-purple-600 rounded-lg p-2 hover:bg-gray-100 transition-colors shadow-lg"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
                        {isCommunityOrganizer && profileData.communityProfile?.communityName}
                        {isVenue && profileData.venueProfile?.venueName}
                        {isBrandSponsor && profileData.brandProfile?.brandName}
                      </h2>
                      
                      {/* Tags for Venue */}
                      {isVenue && profileData.venueProfile?.venueType && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {profileData.venueProfile.venueType.split(',').map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-md font-medium">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-white/80 text-sm mb-4">
                        {isCommunityOrganizer && 'Community Organizer'}
                        {isVenue && 'Venue Partner'}
                        {isBrandSponsor && 'Brand Partner'}
                      </p>
                      
                      {(isCommunityOrganizer || isBrandSponsor) && (
                        <p className="text-white/90 text-sm leading-relaxed">
                          {isCommunityOrganizer && profileData.communityProfile?.communityDescription}
                          {isBrandSponsor && profileData.brandProfile?.brandDescription}
                        </p>
                      )}
                    </div>
                  </div>
                  </div>
                </div>

              {/* Community Photos / Venue Photos / Brand Photos */}
              {(isCommunityOrganizer || isVenue || isBrandSponsor) && (
                <div className="bg-[#171717] rounded-lg p-6 transition-card">
                  <h3 className="text-white font-semibold mb-4">
                    {isCommunityOrganizer && `Community Photos (${photos.length}/5)`}
                    {isVenue && `Venue Photos (${photos.length}/5)`}
                    {isBrandSponsor && `Brand Photos (${photos.length}/5)`}
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
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
                        <Upload className="h-6 w-6 text-gray-500" />
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

              {/* Contact Links Section */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">
                    {isBrandSponsor ? 'Brand manager contact details' : 'Contact Information'}
                  </h3>
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
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <input 
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    
                    {/* Social Links */}
                    <div className="border-t border-gray-700 my-3 pt-3">
                      <p className="text-gray-400 text-xs font-semibold mb-2">SOCIAL LINKS</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Instagram</label>
                      <input 
                        type="text"
                        value={profileForm.instagram}
                        onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                        placeholder="@yourusername"
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    {!isBrandSponsor && (
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
                    )}
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
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                        style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Phone */}
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium truncate">{profileData.phoneNumber || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium truncate">{profileData.email}</p>
                      </div>
                    </div>

                    {/* Instagram */}
                    {(() => {
                      const socialLinks = isCommunityOrganizer ? profileData.communityProfile : 
                                         isVenue ? profileData.venueProfile : 
                                         profileData.brandProfile;
                      return socialLinks?.instagram && (
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Instagram</p>
                            <p className="text-sm font-medium truncate">{socialLinks.instagram}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Website */}
                    {(() => {
                      const socialLinks = isCommunityOrganizer ? profileData.communityProfile : 
                                         isVenue ? profileData.venueProfile : 
                                         profileData.brandProfile;
                      return socialLinks?.website && (
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Website</p>
                            <p className="text-sm font-medium truncate">{socialLinks.website}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* LinkedIn for Brand */}
                    {isBrandSponsor && profileData.brandProfile?.linkedin && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">LinkedIn</p>
                          <p className="text-sm font-medium truncate">{profileData.brandProfile.linkedin}</p>
                        </div>
                      </div>
                    )}

                    {/* Google Maps for Venue Only */}
                    {isVenue && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-medium truncate">{profileData.location?.city || 'View on Google Maps'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payout/KYC Section (Community Organizer Only) */}
              {isCommunityOrganizer && (
                <div ref={payoutSectionRef} className="bg-[#171717] rounded-lg p-6 transition-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-400" />
                      <h3 className="text-white font-semibold">Payouts, KYC & Compliance</h3>
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
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Manage your payment and tax information</p>
                      
                      <div className="grid grid-cols-2 gap-4">
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
                          <label className="block text-sm text-gray-400 mb-2">Account Number</label>
                          <input 
                            type="text"
                            value={payoutForm.accountNumber}
                            onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
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
                          <label className="block text-sm text-gray-400 mb-2">Billing Address</label>
                          <input 
                            type="text"
                            value={payoutForm.billingAddress || ''}
                            onChange={(e) => setPayoutForm({ ...payoutForm, billingAddress: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">GSTIN (Optional)</label>
                          <input 
                            type="text"
                            value={payoutForm.gstNumber}
                            onChange={(e) => setPayoutForm({ ...payoutForm, gstNumber: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">UPI (Optional)</label>
                          <input 
                            type="text"
                            value={payoutForm.upiId || ''}
                            onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={handleSavePayout}
                          disabled={saving}
                          className="flex-1 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profileData.payoutDetails?.accountNumber ? (
                        <>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Manage your payment and tax information</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex justify-between items-start text-sm py-2 border-b border-gray-800">
                              <span className="text-gray-400">Account Holder</span>
                              <span className="text-gray-200 font-medium text-right">{profileData.payoutDetails.accountHolderName}</span>
                            </div>
                            <div className="flex justify-between items-start text-sm py-2 border-b border-gray-800">
                              <span className="text-gray-400">Account Number</span>
                              <span className="text-gray-200 font-mono">••••{profileData.payoutDetails.accountNumber.slice(-4)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex justify-between items-start text-sm py-2 border-b border-gray-800">
                              <span className="text-gray-400">IFSC</span>
                              <span className="text-gray-200 font-mono">{profileData.payoutDetails.ifscCode}</span>
                            </div>
                            <div className="flex justify-between items-start text-sm py-2 border-b border-gray-800">
                              <span className="text-gray-400">GSTIN</span>
                              <span className="text-gray-200 font-mono">{profileData.payoutDetails.gstNumber || 'Not provided'}</span>
                            </div>
                          </div>

                          {profileData.payoutDetails.upiId && (
                            <div className="flex justify-between items-start text-sm py-2 border-b border-gray-800">
                              <span className="text-gray-400">UPI</span>
                              <span className="text-gray-200">{profileData.payoutDetails.upiId}</span>
                            </div>
                          )}

                          <div className="mt-4 pt-3 flex items-center justify-between">
                            <div className="flex items-center">
                              {profileData.payoutDetails.isVerified ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                                  <span className="text-green-400 text-sm font-medium">Verified</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-yellow-400 flex items-center justify-center">
                                    <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                                  </div>
                                  <span className="text-yellow-400 text-sm font-medium">Pending Verification</span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => navigate('/kyc-setup')}
                              className="text-xs text-purple-400 hover:text-purple-300 underline"
                            >
                              Update KYC
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-gray-400 text-sm">No payout details added yet</p>
                          <button
                            onClick={() => navigate('/kyc-setup')}
                            className="w-full text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                          >
                            Add KYC Details
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Venue Details Section (Venue Only) */}
              {isVenue && (
                <div className="bg-[#171717] rounded-lg p-6 transition-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Venue Details</h3>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Capacity</label>
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
                            <option value="18+">18+</option>
                            <option value="21+">21+</option>
                            <option value="All ages">All ages</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 py-2">
                          <input
                            type="checkbox"
                            checked={venueDetailsForm.alcoholAllowed}
                            onChange={(e) => setVenueDetailsForm({ ...venueDetailsForm, alcoholAllowed: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          <label className="text-sm text-gray-300">Alcohol Allowed</label>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                          <input
                            type="checkbox"
                            checked={venueDetailsForm.smokingAllowed}
                            onChange={(e) => setVenueDetailsForm({ ...venueDetailsForm, smokingAllowed: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          <label className="text-sm text-gray-300">Smoking Allowed</label>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveVenueDetails}
                          disabled={saving}
                          className="flex-1 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-gray-500">Capacity</span>
                        </div>
                        <span className="text-white font-medium">
                          {profileData.venueProfile?.capacityRange || 'Not specified'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-gray-500">Restrictions</span>
                        </div>
                        <span className="text-white font-medium">
                          {profileData.venueProfile?.ageLimit || 'Not specified'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">Entry cutoff</span>
                        </div>
                        <span className="text-white font-medium">
                          {profileData.venueProfile?.entryCutoffTime || 'Not specified'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">Age limit</span>
                        </div>
                        <span className="text-white font-medium">
                          18+ for all events
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Logout Button */}
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
            </div>

            {/* RIGHT COLUMN - Hosting Preferences & Help */}
            <div className="space-y-6">
              {/* Hosting Preferences */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Hosting Preferences</h3>
                  {editingSection !== 'hosting' && (
                    <button 
                      onClick={() => handleEditSection('hosting')}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                <div className="max-h-[800px] overflow-y-auto space-y-5 pr-2">{editingSection === 'hosting' ? (
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

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Preferred Event Formats</label>
                        <div className="flex flex-wrap gap-2">
                          {eventFormatOptions.map(format => (
                            <button
                              key={format}
                              onClick={() => setHostingForm({
                                ...hostingForm,
                                preferredEventFormats: toggleArrayItem(hostingForm.preferredEventFormats, format)
                              })}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                hostingForm.preferredEventFormats.includes(format)
                                  ? 'bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white shadow-md shadow-purple-500/50'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              {format}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Preferred Audience Types</label>
                        <div className="flex flex-wrap gap-2">
                          {audienceTypeOptions.map(type => (
                            <button
                              key={type}
                              onClick={() => setHostingForm({
                                ...hostingForm,
                                preferredAudienceTypes: toggleArrayItem(hostingForm.preferredAudienceTypes, type)
                              })}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                hostingForm.preferredAudienceTypes.includes(type)
                                  ? 'bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white shadow-md shadow-purple-500/50'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Preferred Collaboration Types</label>
                        <div className="flex flex-wrap gap-2">
                          {['Venue Partnership', 'Brand Sponsorship', 'Co-hosting', 'Content Collaboration', 'Cross Promotion'].map(type => (
                            <button
                              key={type}
                              onClick={() => setHostingForm({
                                ...hostingForm,
                                preferredCollaborationTypes: toggleArrayItem(hostingForm.preferredCollaborationTypes, type.toLowerCase().replace(/\s+/g, '_'))
                              })}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                hostingForm.preferredCollaborationTypes.includes(type.toLowerCase().replace(/\s+/g, '_'))
                                  ? 'bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white shadow-md shadow-purple-500/50'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isCommunityOrganizer && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Average Event Size</label>
                          <div className="flex flex-wrap gap-2">
                            {audienceSizeOptions.map(size => (
                              <button
                                key={size}
                                onClick={() => setHostingForm({
                                  ...hostingForm,
                                  averageEventSize: size
                                })}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  hostingForm.averageEventSize === size
                                    ? 'bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white shadow-md shadow-purple-500/50'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

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

                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={handleSaveHostingPreferences}
                          disabled={saving}
                          className="flex-1 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Preferred Cities */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">Preferred Cities</p>
                        {(isCommunityOrganizer ? profileData.communityProfile?.preferredCities : 
                          isVenue ? profileData.venueProfile?.preferredCities : 
                          profileData.brandProfile?.preferredCities)?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(isCommunityOrganizer ? profileData.communityProfile.preferredCities : 
                              isVenue ? profileData.venueProfile.preferredCities : 
                              profileData.brandProfile.preferredCities).map((city, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-md text-xs font-medium">
                                {city}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs italic">Not specified</p>
                        )}
                      </div>

                      {/* Preferred Categories */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">Preferred Categories</p>
                        {(isCommunityOrganizer ? profileData.communityProfile?.preferredCategories : 
                          isVenue ? profileData.venueProfile?.preferredCategories : 
                          profileData.brandProfile?.targetCategories)?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(isCommunityOrganizer ? profileData.communityProfile.preferredCategories : 
                              isVenue ? profileData.venueProfile.preferredCategories : 
                              profileData.brandProfile.targetCategories).map((cat, idx) => (
                              <span key={idx} className="px-2.5 py-1 text-white rounded-md text-xs font-medium" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs italic">Not specified</p>
                        )}
                      </div>

                      {/* Attendee Event Size (Community Only) */}
                      {isCommunityOrganizer && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">Attendee Event Size</p>
                          {profileData.communityProfile?.averageEventSize ? (
                            <div className="flex gap-2">
                              <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-md text-xs font-medium">
                                {profileData.communityProfile.averageEventSize}
                              </span>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-xs italic">Not specified</p>
                          )}
                        </div>
                      )}

                      {/* Preferred Event Formats */}
                      {isHostPartner && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">Preferred Event Formats</p>
                          {(isCommunityOrganizer ? profileData.communityProfile?.preferredEventFormats : 
                            isVenue ? profileData.venueProfile?.preferredEventFormats :
                            profileData.brandProfile?.preferredEventFormats)?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(isCommunityOrganizer ? profileData.communityProfile.preferredEventFormats : 
                                isVenue ? profileData.venueProfile.preferredEventFormats :
                                profileData.brandProfile.preferredEventFormats).map((format, idx) => (
                                <span key={idx} className="px-2.5 py-1 text-white rounded-md text-xs font-medium" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
                                  {format}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-xs italic">Not specified</p>
                          )}
                        </div>
                      )}

                      {/* Preferred Collaboration Types */}
                      {isHostPartner && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">Preferred Collaboration Types</p>
                          {(isCommunityOrganizer ? profileData.communityProfile?.preferredCollaborationTypes :
                            isVenue ? profileData.venueProfile?.preferredCollaborationTypes :
                            profileData.brandProfile?.preferredCollaborationTypes)?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(isCommunityOrganizer ? profileData.communityProfile.preferredCollaborationTypes :
                                isVenue ? profileData.venueProfile.preferredCollaborationTypes :
                                profileData.brandProfile.preferredCollaborationTypes).map((type, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-md text-xs font-medium">
                                  {type}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-xs italic">Not specified</p>
                          )}
                        </div>
                      )}

                      {/* Preferred Audience Types */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">Preferred Audience Types</p>
                        {(isCommunityOrganizer ? profileData.communityProfile?.preferredAudienceTypes : 
                          isVenue ? profileData.venueProfile?.preferredAudienceTypes : 
                          profileData.brandProfile?.preferredAudienceTypes)?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(isCommunityOrganizer ? profileData.communityProfile.preferredAudienceTypes : 
                              isVenue ? profileData.venueProfile.preferredAudienceTypes : 
                              profileData.brandProfile.preferredAudienceTypes).map((type, idx) => (
                              <span key={idx} className="px-2.5 py-1 text-white rounded-md text-xs font-medium" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
                                {type}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs italic">Not specified</p>
                        )}
                      </div>

                      {/* Niche Description */}
                      {(isCommunityOrganizer || isBrandSponsor) && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">
                            {isCommunityOrganizer ? 'Niche Community:' : 'Niche Community'}
                          </p>
                          <p className="text-gray-300 text-xs leading-relaxed">
                            {isCommunityOrganizer 
                              ? (profileData.communityProfile?.nicheCommunityDescription || <span className="text-gray-500 italic">Not specified</span>)
                              : (profileData.brandProfile?.nicheCommunityDescription || <span className="text-gray-500 italic">Not specified</span>)
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Help & Support Section */}
              <div className="bg-[#171717] rounded-lg p-6 transition-card">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Help & Support</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                  >
                    Help center
                    <p className="text-gray-500 text-xs mt-0.5">Browse our knowledge base</p>
                  </button>
                  <button
                    onClick={() => navigate('/contact-us')}
                    className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                  >
                    Contact support
                    <p className="text-gray-500 text-xs mt-0.5">Get in touch with our team</p>
                  </button>
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                  >
                    Terms & privacy
                    <p className="text-gray-500 text-xs mt-0.5">Review our policies</p>
                  </button>
                </div>
              </div>
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
