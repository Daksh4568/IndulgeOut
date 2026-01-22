const mongoose = require('mongoose');

/**
 * Collaboration Request Model
 * Manages partnership requests between Communities, Venues, and Brands
 */

const collaborationSchema = new mongoose.Schema({
  // Request Type
  type: {
    type: String,
    enum: ['venue_request', 'brand_sponsorship', 'community_partnership'],
    required: true,
    index: true
  },
  
  // Initiator (Who sent the request)
  initiator: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userType: {
      type: String,
      enum: ['community_organizer', 'venue', 'brand_sponsor'],
      required: true
    },
    name: String,  // Community/Venue/Brand name
    profileImage: String
  },
  
  // Recipient (Who receives the request)
  recipient: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userType: {
      type: String,
      enum: ['community_organizer', 'venue', 'brand_sponsor'],
      required: true
    },
    name: String,
    profileImage: String
  },
  
  // Status Workflow - Updated to include admin review
  status: {
    type: String,
    enum: [
      'submitted',          // Initial submission by community
      'admin_approved',     // Approved by admin, forwarded to vendor
      'admin_rejected',     // Rejected by admin
      'vendor_accepted',    // Vendor accepted the request
      'vendor_rejected',    // Vendor rejected the request
      'completed',          // Collaboration completed successfully
      'cancelled',          // Cancelled by initiator
      'expired'             // Expired without response
    ],
    default: 'submitted',
    index: true
  },
  
  // Admin Review (New - IndulgeOut admin review)
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'  // Admin user
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'pending_info'],
      default: null
    },
    notes: String  // Admin's internal notes or reason for rejection
  },
  
  // Request Details
  requestDetails: {
    // For Event-specific collaborations
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    eventName: String,
    eventDate: Date,
    
    // Collaboration specifics
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    
    // For Venue Requests
    venueRequest: {
      date: Date,
      timeSlot: String,
      expectedAttendees: Number,
      eventType: String,
      specialRequirements: String,
      budgetRange: String  // 'free', 'revenue_share', 'rental'
    },
    
    // For Brand Sponsorships
    brandSponsorship: {
      sponsorshipType: [{
        type: String,
        enum: ['barter', 'paid_monetary', 'product_sampling', 'co-marketing']
      }],
      collaborationFormat: [{
        type: String,
        enum: ['sponsorship', 'sampling', 'popups', 'experience_partnerships', 'brand_activation', 'content_creation']
      }],
      expectedReach: Number,
      targetAudience: String,
      budgetProposed: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'INR' }
      },
      deliverables: String
    },
    
    // For Community Partnerships
    communityPartnership: {
      partnershipType: String,  // 'co-host', 'cross-promotion', 'joint-event'
      proposedBenefits: String,
      expectedOutcome: String
    }
  },
  
  // Response from recipient
  response: {
    message: String,
    respondedAt: Date,
    counterOffer: {
      terms: String,
      budgetAdjustment: Number
    }
  },
  
  // Timeline
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)  // 14 days
  },
  acceptedAt: Date,
  rejectedAt: Date,
  cancelledAt: Date,
  
  // Priority for recipient's action queue
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Communication Thread
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  
  // Tracking
  viewedByRecipient: {
    type: Boolean,
    default: false
  },
  viewedAt: Date,
  
  // Tags for filtering
  tags: [String],
  
  // Internal notes (admin only)
  internalNotes: String
  
}, {
  timestamps: true
});

// Indexes for efficient queries
collaborationSchema.index({ 'initiator.user': 1, status: 1 });
collaborationSchema.index({ 'recipient.user': 1, status: 1 });
collaborationSchema.index({ type: 1, status: 1 });
collaborationSchema.index({ createdAt: -1 });
collaborationSchema.index({ expiresAt: 1 });

// Virtual for days until expiration
collaborationSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const days = Math.ceil((this.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
});

// Methods
collaborationSchema.methods.accept = async function(responseMessage = '') {
  // Only vendors can accept after admin approval
  if (this.status !== 'admin_approved') {
    throw new Error('Collaboration must be admin-approved before vendor can respond');
  }
  this.status = 'vendor_accepted';
  this.acceptedAt = new Date();
  this.response = {
    message: responseMessage,
    respondedAt: new Date()
  };
  await this.save();
};

collaborationSchema.methods.reject = async function(responseMessage = '') {
  // Only vendors can reject after admin approval
  if (this.status !== 'admin_approved') {
    throw new Error('Collaboration must be admin-approved before vendor can respond');
  }
  this.status = 'vendor_rejected';
  this.rejectedAt = new Date();
  this.response = {
    message: responseMessage,
    respondedAt: new Date()
  };
  await this.save();
};

collaborationSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  await this.save();
};

collaborationSchema.methods.markAsViewed = async function() {
  if (!this.viewedByRecipient) {
    this.viewedByRecipient = true;
    this.viewedAt = new Date();
    await this.save();
  }
};

collaborationSchema.methods.addMessage = async function(senderId, messageText) {
  this.messages.push({
    sender: senderId,
    message: messageText,
    sentAt: new Date(),
    read: false
  });
  await this.save();
};

// Statics
collaborationSchema.statics.getPendingForUser = async function(userId) {
  // Vendors see only admin-approved requests
  return this.find({
    'recipient.user': userId,
    status: 'admin_approved',
    expiresAt: { $gt: new Date() }
  }).sort({ priority: 1, createdAt: -1 });
};

collaborationSchema.statics.getSentByUser = async function(userId, status = null) {
  const query = {
    'initiator.user': userId
  };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

collaborationSchema.statics.getReceivedByUser = async function(userId, status = null) {
  const query = {
    'recipient.user': userId,
    status: { $in: ['admin_approved', 'vendor_accepted', 'vendor_rejected', 'completed'] }  // Only show admin-approved onwards
  };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

collaborationSchema.statics.getActionRequired = async function(userId) {
  // Vendors see admin-approved requests awaiting their response
  return this.find({
    'recipient.user': userId,
    status: 'admin_approved',
    expiresAt: { $gt: new Date() }
  })
  .sort({ priority: -1, createdAt: -1 })
  .populate('initiator.user', 'name profilePicture')
  .populate('requestDetails.eventId', 'title date');
};

// Auto-expire old requests
collaborationSchema.statics.expireOldRequests = async function() {
  const result = await this.updateMany(
    {
      status: { $in: ['submitted', 'admin_approved'] },  // Can expire if not yet responded
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result.modifiedCount;
};

// Pre-save middleware to set priority based on event date proximity
collaborationSchema.pre('save', function(next) {
  if (this.requestDetails?.eventDate) {
    const daysUntilEvent = Math.ceil((this.requestDetails.eventDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilEvent <= 7) {
      this.priority = 'high';
    } else if (daysUntilEvent <= 14) {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  next();
});

module.exports = mongoose.model('Collaboration', collaborationSchema);
