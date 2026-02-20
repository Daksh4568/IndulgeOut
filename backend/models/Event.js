const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  categories: [{
    type: String,
    required: true,
    enum: ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'],
    trim: true
  }],
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coHosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
    max: 10000 // Support up to 10,000 participants for large events
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: [0, 'Current participants cannot be negative'],
    validate: {
      validator: function(value) {
        return value >= 0 && value <= this.maxParticipants;
      },
      message: 'Current participants must be between 0 and maxParticipants'
    }
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    groupingOffer: {
      tierLabel: String,
      tierPeople: Number,
      tierPrice: Number
    },
    questionnaireResponses: [{
      question: String,
      answer: String
    }]
  }],
  price: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  groupingOffers: {
    enabled: {
      type: Boolean,
      default: false
    },
    tiers: [{
      label: {
        type: String,
        default: ''
      },
      people: {
        type: Number,
        default: 0,
        min: 0  // Allow 0 for unfilled tiers
      },
      price: {
        type: Number,
        default: 0,
        min: 0
      }
    }]
  },
  questionnaire: {
    enabled: {
      type: Boolean,
      default: false
    },
    questions: [{
      question: {
        type: String,
        trim: true
      }
    }]
  },
  images: [String],
  tags: [String],
  requirements: [String],
  mood: {
    type: String,
    enum: ['chill', 'energetic', 'creative', 'social', 'adventure'],
    default: 'social'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  community: {
    type: String,
    required: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  registrationDeadline: Date,
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    registrations: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    clickThroughRate: {
      type: Number,
      default: 0
    },
    // Daily view tracking
    viewHistory: [{
      date: {
        type: String,  // YYYY-MM-DD format
        required: true
      },
      count: {
        type: Number,
        default: 1
      }
    }],
    // Track unique viewers
    viewedBy: [{
      user: mongoose.Schema.Types.ObjectId,
      viewedAt: Date,
      viewCount: { type: Number, default: 1 }
    }],
    clickHistory: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      source: {
        type: String,
        default: 'event_discovery'
      }
    }],
    // Last updated timestamp
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Review Statistics
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ date: 1, categories: 1, 'location.city': 1 });
eventSchema.index({ host: 1, createdBy: 1 });
// Critical index for registration queries - speeds up participant lookups
eventSchema.index({ 'participants.user': 1 });
// Index for checking event availability
eventSchema.index({ status: 1, date: 1 });

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for ticketPrice (alias for price.amount for easier access)
eventSchema.virtual('ticketPrice').get(function() {
  return this.price?.amount || 0;
});

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Categories are now hardcoded enums - no validation needed
eventSchema.pre('save', async function(next) {
  next();
});

// Categories are hardcoded - analytics calculated from events on-demand
eventSchema.post('save', async function(doc) {
  // No separate category collection to update
  // Category analytics are now aggregated from events in real-time
});

// Update current participants count (recalculate from participants array)
eventSchema.methods.updateParticipantCount = function() {
  // Sum up quantities from all registered participants
  // Note: Cancellation feature disabled, so only 'registered' status is used
  this.currentParticipants = this.participants
    .filter(p => p.status === 'registered')
    .reduce((sum, p) => sum + (p.quantity || 1), 0);
  return this.save();
};

// Track event view (using atomic operations to prevent version conflicts)
eventSchema.methods.trackView = async function(userId = null) {
  const today = new Date().toISOString().split('T')[0];
  const Event = this.constructor;
  
  // Use atomic operations to prevent version conflicts
  const updateOps = {
    $inc: { 'analytics.views': 1 },
    $set: { 'analytics.lastUpdated': new Date() }
  };
  
  // Add daily view record atomically
  await Event.findByIdAndUpdate(
    this._id,
    {
      ...updateOps,
      $push: {
        'analytics.viewHistory': {
          $each: [{ date: today, count: 1 }],
          $slice: -90 // Keep only last 90 days
        }
      }
    },
    { new: true }
  );
  
  // Handle user-specific tracking separately if userId provided
  if (userId) {
    const event = await Event.findById(this._id);
    const existingViewer = event.analytics.viewedBy.find(v => v.user.toString() === userId.toString());
    
    if (existingViewer) {
      // Update existing viewer
      await Event.findOneAndUpdate(
        { _id: this._id, 'analytics.viewedBy.user': userId },
        {
          $inc: { 'analytics.viewedBy.$.viewCount': 1 },
          $set: { 'analytics.viewedBy.$.viewedAt': new Date() }
        }
      );
    } else {
      // Add new viewer
      await Event.findByIdAndUpdate(
        this._id,
        {
          $push: { 'analytics.viewedBy': { user: userId, viewedAt: new Date(), viewCount: 1 } },
          $inc: { 'analytics.uniqueViews': 1 }
        }
      );
    }
  }
};

// Track event click (using atomic operations to prevent version conflicts)
eventSchema.methods.trackClick = async function(userId = null, source = 'event_discovery') {
  const Event = this.constructor;
  
  const updateOps = {
    $inc: { 'analytics.clicks': 1 },
    $set: { 'analytics.lastUpdated': new Date() }
  };
  
  if (userId) {
    updateOps.$push = {
      'analytics.clickHistory': {
        user: userId,
        timestamp: new Date(),
        source
      }
    };
  }
  
  await Event.findByIdAndUpdate(this._id, updateOps);
  
  // Update click-through rate in a separate operation
  const event = await Event.findById(this._id);
  if (event.analytics.views > 0) {
    const ctr = (event.analytics.clicks / event.analytics.views * 100).toFixed(2);
    await Event.findByIdAndUpdate(
      this._id,
      { $set: { 'analytics.clickThroughRate': ctr } }
    );
  }
};

// Update conversion rate
eventSchema.methods.updateConversionRate = async function() {
  if (this.analytics.views > 0) {
    this.analytics.conversionRate = (this.currentParticipants / this.analytics.views * 100).toFixed(2);
  }
  this.analytics.lastUpdated = new Date();
  await this.save();
};

module.exports = mongoose.model('Event', eventSchema);