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
      // General Notifications
      'welcome',
      
      // B2C User Notifications
      'booking_confirmed',
      'booking_failed',
      'event_reminder',
      'checkin_qr_ready',
      'rate_experience',
      'host_reply_feedback',
      'profile_incomplete_user',
      
      // Host/Community Notifications - Action Required
      'profile_incomplete_host',
      'kyc_pending',
      'event_draft_incomplete',
      'subscription_payment_pending',
      'venue_response_received',
      'venue_counter_proposal',
      'venue_confirmation_required',
      'venue_declined_request',
      'brand_proposal_received',
      'brand_counter_received',
      'brand_confirmation_required',
      'brand_declined_proposal',
      'respond_to_feedback',
      
      // Host/Community Notifications - Status Updates
      'event_published',
      'first_booking_received',
      'milestone_reached',
      'event_nearing_full',
      'revenue_milestone',
      'capacity_reached',
      'ratings_updated',
      
      // Brand Notifications - Action Required
      'profile_incomplete_brand',
      'community_proposal_received',
      'community_counter_proposal',
      'approval_required_brand',
      'proposal_declined_brand',
      'subscription_payment_pending_brand',
      
      // Brand Notifications - Status Updates
      'event_reminder_brand',
      'performance_report_ready_brand',
      
      // Venue Notifications - Action Required
      'profile_incomplete_venue',
      'hosting_request_received',
      'community_counter_received',
      'confirmation_required_venue',
      'community_declined_proposal',
      'subscription_payment_pending_venue',
      
      // Venue Notifications - Status Updates
      'event_reminder_venue',
      'venue_rating_updated',
      'performance_report_ready_venue'
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
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  // Associated data references
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
    link: String,
    action: String // e.g., 'complete_profile', 'view_event', 'approve_request'
  },
  // Notification state
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  // Metadata
  metadata: {
    icon: String,
    color: String,
    emoji: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  // Delivery channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  // Delivery status
  deliveryStatus: {
    inApp: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
    email: { type: String, enum: ['pending', 'sent', 'failed', 'bounced'], default: 'pending' },
    push: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sms: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
  },
  // Auto-expire notifications after certain time
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago display
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Method to archive notification
notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  await this.save();
  return this;
};

// Static method to mark multiple as read
notificationSchema.statics.markManyAsRead = async function(notificationIds, userId) {
  return this.updateMany(
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

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isArchived: false
  });
};

// Static method to get notifications by category
notificationSchema.statics.getByCategory = async function(userId, category, options = {}) {
  const { limit = 20, skip = 0, includeRead = true } = options;
  
  const query = {
    recipient: userId,
    category,
    isArchived: false
  };
  
  if (!includeRead) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate('relatedEvent', 'title date location images')
    .populate('relatedCommunity', 'name coverImage')
    .populate('relatedUser', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Notification', notificationSchema);
