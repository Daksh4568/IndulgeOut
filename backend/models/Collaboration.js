const mongoose = require('mongoose');

/**
 * Collaboration Model - Structured Proposal Forms
 * Supports 4 collaboration types with admin review workflow
 */

const collaborationSchema = new mongoose.Schema({
  // Collaboration type
  type: {
    type: String,
    enum: ['communityToVenue', 'communityToBrand', 'brandToCommunity', 'venueToCommunity'],
    required: true,
  },

  // Proposer information
  proposerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  proposerType: {
    type: String,
    enum: ['community', 'venue', 'brand'],
    required: true,
  },

  // Recipient information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientType: {
    type: String,
    enum: ['community', 'venue', 'brand'],
    required: true,
  },

  // Status workflow
  status: {
    type: String,
    enum: [
      'draft',                      // Saved but not submitted
      'pending_admin_review',       // Submitted, waiting for admin
      'approved_delivered',         // Admin approved, delivered to recipient
      'rejected',                   // Admin rejected
      'counter_pending_review',     // Counter received, waiting for admin review
      'counter_delivered',          // Counter approved and delivered
      'confirmed',                  // Final agreement reached
      'declined',                   // Declined by either party
      'flagged'                     // Flagged for compliance review
    ],
    default: 'draft',
    required: true,
  },

  // Form data (flexible structure based on type)
  formData: {
    // Community → Venue fields
    eventType: String,
    expectedAttendees: String,
    seatingCapacity: String,
    eventDate: {
      date: String,
      startTime: String,
      endTime: String,
    },
    showBackupDate: Boolean,
    backupDate: {
      date: String,
      startTime: String,
      endTime: String,
    },
    requirements: mongoose.Schema.Types.Mixed, // Nested object of requirements

    // Community → Brand fields
    eventCategory: String,
    targetAudience: String,
    city: String,
    brandDeliverables: mongoose.Schema.Types.Mixed, // Nested object of deliverables

    // Brand → Community fields
    campaignObjectives: mongoose.Schema.Types.Mixed,
    preferredFormats: [String],
    brandOffers: mongoose.Schema.Types.Mixed,
    brandExpectations: mongoose.Schema.Types.Mixed,

    // Venue → Community fields
    venueType: String,
    capacityRange: String,
    venueOfferings: mongoose.Schema.Types.Mixed,
    commercialModels: mongoose.Schema.Types.Mixed,
    additionalTerms: String,

    // Shared fields
    pricing: mongoose.Schema.Types.Mixed, // For commercial terms
    supportingInfo: {
      images: [String], // Array of Cloudinary URLs
      note: String,
    },
  },

  // Admin review fields
  adminReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  adminReviewedAt: Date,
  adminNotes: String, // Private notes for admin use
  rejectionReason: String, // Shown to user if rejected
  complianceFlags: [String], // Auto-detected issues

  // Counter tracking
  hasCounter: {
    type: Boolean,
    default: false,
  },
  latestCounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollaborationCounter',
  },

  // Metadata
  isDraft: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for efficient queries
collaborationSchema.index({ proposerId: 1, createdAt: -1 });
collaborationSchema.index({ recipientId: 1, createdAt: -1 });
collaborationSchema.index({ status: 1, createdAt: -1 });
collaborationSchema.index({ type: 1 });

// Virtual for proposal age
collaborationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Method to check if user is involved
collaborationSchema.methods.isUserInvolved = function(userId) {
  return this.proposerId.equals(userId) || this.recipientId.equals(userId);
};

// Method to get user's role in collaboration
collaborationSchema.methods.getUserRole = function(userId) {
  if (this.proposerId.equals(userId)) return 'proposer';
  if (this.recipientId.equals(userId)) return 'recipient';
  return null;
};

// Static method to get pending admin reviews
collaborationSchema.statics.getPendingReviews = function() {
  return this.find({ status: 'pending_admin_review' })
    .populate('proposerId', 'name email role profilePicture')
    .populate('recipientId', 'name email role profilePicture')
    .sort({ createdAt: 1 }); // Oldest first
};

// Static method to get user's collaborations
collaborationSchema.statics.getUserCollaborations = function(userId) {
  return this.find({
    $or: [{ proposerId: userId }, { recipientId: userId }],
    isDraft: false,
  })
    .populate('proposerId', 'name email role profilePicture')
    .populate('recipientId', 'name email role profilePicture')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Collaboration', collaborationSchema);
