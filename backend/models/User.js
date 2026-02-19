const mongoose = require('mongoose');

const userAnalyticsSchema = new mongoose.Schema({
  // Event Registration Analytics
  registeredEvents: [{
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    category: { type: String },
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    location: {
      city: String,
      state: String,
      country: String
    }
  }],
  
  // Community Participation Analytics
  joinedCommunities: [{
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    category: { type: String },
    joinedAt: { type: Date, default: Date.now },
    activityLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'low' 
    },
    postsCount: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 }
  }],
  
  // Location Analytics
  locationHistory: [{
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: 'India' },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    frequency: { type: Number, default: 1 },
    lastSeen: { type: Date, default: Date.now }
  }],
  
  // Behavioral Analytics
  categoryPreferences: [{
    category: { type: String, required: true },
    score: { type: Number, default: 1 }, // Weighted score based on interactions
    lastInteraction: { type: Date, default: Date.now }
  }],
  
  // Search Analytics
  searchHistory: [{
    query: String,
    filters: {
      category: String,
      location: String,
      priceRange: String
    },
    resultsCount: Number,
    clickedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    searchedAt: { type: Date, default: Date.now }
  }],
  
  // Recommendation Metrics
  recommendationMetrics: {
    totalRecommendationsShown: { type: Number, default: 0 },
    recommendationsClicked: { type: Number, default: 0 },
    recommendationsRegistered: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now }
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if phoneNumber is provided
        if (!v) return true;
        // Indian mobile number validation (10 digits)
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please provide a valid Indian mobile number (10 digits)'
    }
  },
  otpVerification: {
    otp: String,
    otpExpiry: Date,
    isPhoneVerified: { type: Boolean, default: false },
    otpAttempts: { type: Number, default: 0 },
    lastOTPSent: Date
  },
  role: {
    type: String,
    enum: ['user', 'host_partner', 'admin'],
    default: 'user'
  },
  
  // Host & Partner sub-type (only applicable if role is 'host_partner')
  hostPartnerType: {
    type: String,
    enum: ['community_organizer', 'venue', 'brand_sponsor'],
    required: function() {
      return this.role === 'host_partner';
    }
  },
  
  // Admin-specific fields
  adminProfile: {
    accessLevel: {
      type: String,
      enum: ['super_admin', 'content_moderator', 'support_admin'],
      default: 'support_admin'
    },
    permissions: [{
      type: String,
      enum: [
        'manage_users',
        'manage_events', 
        'manage_collaborations',
        'view_analytics',
        'manage_payments',
        'moderate_content',
        'system_settings'
      ]
    }],
    department: String,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  },
  
  // Onboarding Progress Tracking
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingProgress: {
    percentage: { type: Number, default: 0 },
    completedSteps: [String],
    missingFields: [String],
    lastUpdated: Date
  },
  
  // Venue Profile (for hostPartnerType: 'venue')
  venueProfile: {
    venueName: String,
    city: String,
    locality: String,
    venueType: {
      type: String,
      enum: ['cafe', 'bar', 'studio', 'club', 'outdoor', 'restaurant', 'coworking', 'other']
    },
    venueDescription: String,
    logo: String,
    coverImage: String,
    googleMapsLink: String,
    whatsapp: String,
    spaceType: {
      type: String,
      enum: ['Indoor', 'Outdoor', 'Rooftop', 'Mixed']
    },
    seatingCapacity: Number,
    operatingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    operatingHours: String,
    parkingAvailability: {
      type: String,
      enum: ['Available', 'Not Available', 'Limited']
    },
    capacityRange: {
      type: String,
      enum: ['≤30', '30-50', '50-100', '100+', '0-20', '20-40', '40-80', '80-150', '150-300', '300+']
    },
    contactPerson: {
      name: String,
      phone: String,
      email: String
    },
    photos: {
      type: [String],
      validate: {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'You can upload a maximum of 5 photos'
      }
    },
    instagram: String,
    facebook: String,
    website: String,
    commercialModel: {
      type: String,
      enum: ['Rental', 'Cover Charge', 'Revenue Share', 'Mixed']
    },
    defaultPricing: {
      rentalFee: Number,
      coverChargePerGuest: Number,
      revenueSharePercentage: Number,
      currency: { type: String, default: 'INR' }
    },
    amenities: [{
      type: String,
      enum: ['wifi', 'parking', 'ac', 'sound_system', 'projector', 'kitchen', 'bar', 'outdoor_seating', 'stage', 'dance_floor', 'green_room', 'security']
    }],
    rules: {
      alcoholAllowed: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false },
      minimumAge: { type: Number, default: 18 },
      ageLimit: {
        type: String,
        enum: ['18+', '21+', 'All Ages'],
        default: '18+'
      },
      soundRestrictions: String,
      soundCutoffTime: String,
      additionalRules: String,
      entryCutoffTime: String,
      foodBeverageExclusivity: { type: Boolean, default: false },
      externalVendorsAllowed: { type: Boolean, default: true },
      decorationAllowed: { type: Boolean, default: true }
    },
    pricing: {
      hourlyRate: Number,
      minimumBooking: Number,
      currency: { type: String, default: 'INR' }
    },
    availability: {
      daysAvailable: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
      timeSlots: String
    },
    // Hosting Preferences
    preferredCities: [String],
    preferredCategories: [{
      type: String,
      enum: ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games']
    }],
    preferredEventFormats: [{
      type: String,
      enum: ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation']
    }],
    preferredCollaborationTypes: [{
      type: String,
      enum: ['venue_partnership', 'brand_sponsorship', 'co-hosting', 'content_collaboration', 'cross_promotion']
    }],
    preferredAudienceTypes: [{
      type: String,
      enum: ['Students', 'Young Professionals', 'Founders / Creators', 'Families', 'Niche Community']
    }],
    nicheCommunityDescription: String
  },
  
  // Brand Profile (for hostPartnerType: 'brand_sponsor')
  brandProfile: {
    brandName: String,
    brandCategory: {
      type: String,
      enum: ['food_beverage', 'wellness_fitness', 'lifestyle', 'tech', 'entertainment', 'fashion', 'education', 'other']
    },
    targetCity: [String],
    sponsorshipType: [{
      type: String,
      enum: ['barter', 'paid_monetary', 'product_sampling', 'co-marketing']
    }],
    collaborationIntent: [{
      type: String,
      enum: ['sponsorship', 'sampling', 'popups', 'experience_partnerships', 'brand_activation', 'content_creation']
    }],
    contactPerson: {
      name: String,
      workEmail: String,
      phone: String,
      designation: String
    },
    brandDescription: String,
    website: String,
    instagram: String,
    facebook: String,
    linkedin: String,
    logo: String,
    productPhotos: {
      type: [String],
      validate: {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'You can upload a maximum of 5 product photos'
      }
    },
    brandAssets: [String],
    budget: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' }
    },
    // Hosting Preferences
    preferredCities: [String],
    preferredCategories: [{
      type: String,
      enum: ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games']
    }],
    preferredEventFormats: [{
      type: String,
      enum: ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation']
    }],
    preferredCollaborationTypes: [{
      type: String,
      enum: ['venue_partnership', 'brand_sponsorship', 'co-hosting', 'content_collaboration', 'cross_promotion']
    }],
    preferredAudienceTypes: [{
      type: String,
      enum: ['Students', 'Young Professionals', 'Founders / Creators', 'Families', 'Niche Community']
    }],
    nicheCommunityDescription: String
  },
  
  // Enhanced Community Profile (for hostPartnerType: 'community_organizer')
  communityProfile: {
    communityName: String,
    city: String,
    category: [{
      type: String,
      enum: ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games']
    }],
    primaryCategory: String,
    communityType: {
      type: String,
      enum: ['open', 'curated'],
      default: 'open'
    },
    contactPerson: {
      name: String,
      email: String,
      phone: String
    },
    communityDescription: String,
    shortBio: String,
    logo: String, // Community logo URL
    coverImage: String, // Community cover image
    instagram: String,
    facebook: String,
    website: String,
    linkedin: String,
    pastEventPhotos: {
      type: [String],
      validate: {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'You can upload a maximum of 5 photos'
      }
    },
    pastEventExperience: {
      type: String,
      enum: ['0-5', '5-10', '10-30', '30-50', '50-100', '100+']
    },
    typicalAudienceSize: {
      type: String,
      enum: ['≤20', '20-50', '50-100', '100+', '0-20', '20-50', '50-100', '100-200', '200-500', '500+']
    },
    established: Date,
    memberCount: { type: Number, default: 0 },
    // Hosting Preferences
    preferredCities: [String],
    preferredCategories: [{
      type: String,
      enum: ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games']
    }],
    preferredEventFormats: [{
      type: String,
      enum: ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation']
    }],
    preferredCollaborationTypes: [{
      type: String,
      enum: ['venue_partnership', 'brand_sponsorship', 'co-hosting', 'content_collaboration', 'cross_promotion']
    }],
    preferredAudienceTypes: [{
      type: String,
      enum: ['Students', 'Young Professionals', 'Founders / Creators', 'Families', 'Niche Community']
    }],
    nicheCommunityDescription: String
  },
  
  // Payout Details (for all host_partner types - KYC Information)
  payoutDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    billingAddress: String,
    upiId: String,
    gstNumber: String,
    idProofDocument: String, // URL to uploaded ID proof
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    lastUpdated: Date
  },
  interests: [{
    type: String,
    enum: [
      // Legacy interests (for backward compatibility)
      'Sip & Savor',
      'Sweat & Play', 
      'Art & DIY',
      'Social Mixers',
      'Adventure & Outdoors',
      'Epic Screenings',
      'Indoor & Board Games',
      'Music & Performance',
      // New category-aligned interests
      'Wellness, Fitness & Sports',
      'Art, Music & Dance',
      'Immersive',
      'Food & Beverage',
      'Games'
    ]
  }],
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    timezone: String,
    zipCode: String
  },
  profilePicture: String,
  bio: String,
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say']
  },
  
  // Social Links (for all users)
  socialLinks: {
    instagram: String,
    facebook: String,
    website: String
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Enhanced Analytics Data
  analytics: userAnalyticsSchema,
  
  // User Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    communityUpdates: { type: Boolean, default: true },
    recommendationFrequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'], 
      default: 'weekly' 
    },
    maxTravelDistance: { type: Number, default: 50 }, // in kilometers
    preferredEventTimes: [{ 
      type: String, 
      enum: ['morning', 'afternoon', 'evening', 'night'] 
    }],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 10000 }
    }
  },
  
  registeredEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  hostedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  
  // Saved Events for Later
  savedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  
  // Rewards & Gamification
  rewards: {
    credits: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    referralCode: String,
    expiringCredits: { type: Number, default: 0 },
    expiryDate: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);