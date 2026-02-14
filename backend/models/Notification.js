const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    required: true,
    enum: [
      // B2C User Notifications
      'booking_confirmed',
      'booking_failed',
      'event_reminder',
      'checkin_qr_ready',
      'rate_experience',
      'host_reply_feedback',
      'profile_incomplete',
      
      // Community Organizer Notifications
      'profile_incomplete_community_organizer',
      'kyc_pending',
      'event_draft_incomplete',
      'event_published',
      'first_booking_received',
      'milestone_reached',
      'event_nearing_full',
      'capacity_reached',
      'revenue_milestone',
      'ratings_updated',
      'low_booking_alert',
      'venue_response_received',
      'venue_counter_received',
      'venue_confirmation_required',
      'venue_declined_request',
      'brand_proposal_received',
      'brand_counter_received',
      'brand_confirmation_required',
      'brand_declined_proposal',
      'respond_to_feedback',
      
      // Brand Sponsor Notifications
      'profile_incomplete_brand_sponsor',
      'community_proposal_received',
      'community_counter_received',
      'approval_required',
      'proposal_declined',
      'performance_report_ready',
      
      // Venue Notifications
      'profile_incomplete_venue',
      'hosting_request_received',
      'community_counter_received',
      'confirmation_required',
      'community_declined_proposal',
      'venue_rating_updated',
      
      // Collaboration-specific (Generic for all types)
      'communityToVenue_received',
      'communityToBrand_received',
      'brandToCommunity_received',
      'venueToCommunity_received',
      'counter_proposal_received',
      'counter_approved',
      'counter_rejected',
      'collaboration_approved',
      'collaboration_rejected',
      'collaboration_confirmed',
      'collaboration_declined',
      
      // Admin-specific
      'admin_review_required',
      'admin_counter_review_required',
      
      // Generic
      'subscription_payment_pending',
      'system_announcement'
    ]
  },
  
  category: {
    type: String,
    required: true,
    enum: ['action_required', 'status_update', 'reminder', 'milestone'],
    index: true
  },
  
  priority: {
    type: String,
    default: 'medium',
    enum: ['low', 'medium', 'high', 'urgent']
  },
  
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Related entities for deep linking
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  
  relatedCommunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  },
  
  relatedTicket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  
  relatedCollaboration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration'
  },
  
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Action button configuration
  actionButton: {
    text: String,
    link: String
  },
  
  // Delivery channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // Status tracking
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date
  },
  
  isArchived: {
    type: Boolean,
    default: false
  },
  
  archivedAt: {
    type: Date
  },
  
  // Email delivery tracking
  emailSent: {
    type: Boolean,
    default: false
  },
  
  emailSentAt: {
    type: Date
  },
  
  // Auto-expiry (30 days)
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Instance methods
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return await this.save();
};

// Static methods
notificationSchema.statics.markManyAsRead = async function(notificationIds, userId) {
  return await this.updateMany(
    { 
      _id: { $in: notificationIds },
      recipient: userId
    },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { 
      recipient: userId,
      isRead: false
    },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    isArchived: false
  });
};

notificationSchema.statics.getByCategory = async function(userId, category, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  const query = {
    recipient: userId,
    category,
    isArchived: false
  };
  
  const [notifications, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedEvent', 'title date')
      .populate('relatedCommunity', 'name')
      .populate('relatedUser', 'name profilePicture'),
    this.countDocuments(query)
  ]);
  
  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

notificationSchema.statics.deleteAllRead = async function(userId) {
  return await this.deleteMany({
    recipient: userId,
    isRead: true
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
