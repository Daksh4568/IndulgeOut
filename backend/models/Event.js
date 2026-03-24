const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
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
  endDate: {
    type: Date,
    default: null
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
    couponUsed: {
      code: String,
      discountType: String,
      discountValue: Number,
      discountApplied: Number
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
      default: 'INR'
    }
  },
  // Time-based pricing: host can set different prices for different date ranges
  pricingTimeline: {
    enabled: {
      type: Boolean,
      default: false
    },
    tiers: [{
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      label: {
        type: String,
        default: ''
      }
    }]
  },
  // Track all price changes (both manual edits and timeline-based)
  priceChangeHistory: [{
    previousPrice: {
      type: Number,
      required: true
    },
    newPrice: {
      type: Number,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      enum: ['manual_edit', 'timeline_automatic', 'initial_creation'],
      default: 'manual_edit'
    },
    spotsBookedAtPrevPrice: {
      type: Number,
      default: 0
    },
    // Snapshot of grouping offers at this price point
    groupingOffersSnapshot: {
      enabled: { type: Boolean, default: false },
      tiers: [{
        people: Number,
        price: Number,
        label: String
      }]
    }
  }],
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
  // Store questionnaire responses submitted by users (before payment)
  questionnaireSubmissions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    responses: [{
      question: String,
      answer: String
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    ticketNumber: String // Populated after payment
  }],
  // Coupon/Promo Code System
  coupons: {
    enabled: {
      type: Boolean,
      default: false
    },
    codes: [{
      code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
      },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
      },
      discountValue: {
        type: Number,
        required: true,
        min: 0
      },
      maxUses: {
        type: Number,
        default: null, // null means unlimited
        min: 0
      },
      currentUses: {
        type: Number,
        default: 0,
        min: 0
      },
      maxUsesPerUser: {
        type: Number,
        default: 1,
        min: 1
      },
      expiryDate: {
        type: Date,
        default: null // null means no expiry
      },
      isActive: {
        type: Boolean,
        default: true
      },
      usedBy: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        usedAt: {
          type: Date,
          default: Date.now
        },
        discountApplied: Number
      }],
      createdAt: {
        type: Date,
        default: Date.now
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
// Index for slug-based lookups
eventSchema.index({ slug: 1 });

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

// Function to generate URL-friendly slug from title
function generateSlug(title) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Fallback if slug is empty (e.g., title had only special characters)
  return slug || 'event';
}

// Categories are now hardcoded enums - no validation needed
eventSchema.pre('save', async function(next) {
  // Generate slug from title if not exists or title changed
  if (!this.slug || this.isModified('title')) {
    let baseSlug = generateSlug(this.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug uniqueness by appending counter if needed
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
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

// Get today's date string in IST (YYYY-MM-DD) for consistent comparison across timezones
function getTodayIST() {
  const now = new Date();
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + IST_OFFSET).toISOString().split('T')[0];
}

function toDateString(date) {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  return new Date(new Date(date).getTime() + IST_OFFSET).toISOString().split('T')[0];
}

// Get current effective price based on pricing timeline
eventSchema.methods.getCurrentPrice = function() {
  if (!this.pricingTimeline?.enabled || !this.pricingTimeline?.tiers?.length) {
    return this.price?.amount || 0;
  }
  
  const todayIST = getTodayIST();
  const activeTier = this.pricingTimeline.tiers.find(tier => {
    const startStr = toDateString(tier.startDate);
    const endStr = toDateString(tier.endDate);
    return todayIST >= startStr && todayIST <= endStr;
  });
  
  return activeTier ? activeTier.price : (this.price?.amount || 0);
};

// Get price at a specific date
eventSchema.methods.getPriceAtDate = function(date) {
  if (!this.pricingTimeline?.enabled || !this.pricingTimeline?.tiers?.length) {
    return this.price?.amount || 0;
  }
  
  const targetStr = toDateString(date);
  const activeTier = this.pricingTimeline.tiers.find(tier => {
    const startStr = toDateString(tier.startDate);
    const endStr = toDateString(tier.endDate);
    return targetStr >= startStr && targetStr <= endStr;
  });
  
  return activeTier ? activeTier.price : (this.price?.amount || 0);
};

// Track event view (using atomic operations to prevent version conflicts)
eventSchema.methods.trackView = async function(userId = null) {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const today = new Date(Date.now() + IST_OFFSET).toISOString().split('T')[0];
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

// ==================== COUPON VALIDATION METHODS ====================

/**
 * Validate a coupon code for a user
 * @param {String} couponCode - The coupon code to validate
 * @param {String} userId - The user ID trying to use the coupon
 * @param {Number} basePrice - The base ticket price
 * @returns {Object} - Validation result with discount details or error
 */
eventSchema.methods.validateCoupon = async function(couponCode, userId, basePrice) {
  try {
    // Check if coupons are enabled for this event
    if (!this.coupons || !this.coupons.enabled) {
      return {
        valid: false,
        message: 'Coupons are not available for this event'
      };
    }

    // Find the coupon
    const coupon = this.coupons.codes.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    
    if (!coupon) {
      return {
        valid: false,
        message: 'Invalid coupon code'
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        valid: false,
        message: 'This coupon is no longer active'
      };
    }

    // Check expiry date
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return {
        valid: false,
        message: 'This coupon has expired'
      };
    }

    // Check max uses limit
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return {
        valid: false,
        message: `This coupon has reached its usage limit (${coupon.maxUses} uses)`
      };
    }

    // Check per-user usage limit
    const userUsageCount = coupon.usedBy.filter(u => u.user.toString() === userId.toString()).length;
    if (userUsageCount >= coupon.maxUsesPerUser) {
      return {
        valid: false,
        message: `You have already used this coupon ${coupon.maxUsesPerUser} time(s)`
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((basePrice * coupon.discountValue) / 100);
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Math.min(coupon.discountValue, basePrice); // Can't discount more than the price
    }

    // Ensure final price doesn't go negative
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountApplied: discountAmount,
        finalPrice: finalPrice,
        usesRemaining: coupon.maxUses ? coupon.maxUses - coupon.currentUses : null,
        expiryDate: coupon.expiryDate
      }
    };
  } catch (error) {
    console.error('Coupon validation error:', error);
    return {
      valid: false,
      message: 'Error validating coupon code'
    };
  }
};

/**
 * Apply a coupon to a user's registration
 * @param {String} couponCode - The coupon code to apply
 * @param {String} userId - The user ID
 * @param {Number} discountApplied - The discount amount applied
 */
eventSchema.methods.applyCoupon = async function(couponCode, userId, discountApplied) {
  try {
    const coupon = this.coupons.codes.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Increment usage count
    coupon.currentUses += 1;

    // Add to usedBy array
    coupon.usedBy.push({
      user: userId,
      usedAt: new Date(),
      discountApplied: discountApplied
    });

    // Deactivate if max uses reached
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      coupon.isActive = false;
    }

    await this.save();

    return {
      success: true,
      message: 'Coupon applied successfully'
    };
  } catch (error) {
    console.error('Apply coupon error:', error);
    throw error;
  }
};

module.exports = mongoose.model('Event', eventSchema);