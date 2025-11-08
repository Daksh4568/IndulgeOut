const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'community_member'],
    default: 'user'
  },
  interests: [{
    type: String,
    enum: [
      'Sip & Savor',
      'Sweat & Play', 
      'Art & DIY',
      'Social Mixers',
      'Adventure & Outdoors',
      'Epic Screenings',
      'Indoor & Board Games',
      'Music & Performance'
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
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);