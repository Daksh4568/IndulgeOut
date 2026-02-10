const mongoose = require('mongoose');

const collaborationCounterSchema = new mongoose.Schema({
  // Reference to original proposal
  collaborationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration',
    required: true,
  },

  // Responder information
  responderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  responderType: {
    type: String,
    enum: ['community', 'venue', 'brand'],
    required: true,
  },

  // Counter proposal data
  counterData: {
    // Field-by-field responses
    fieldResponses: {
      type: Map,
      of: {
        action: {
          type: String,
          enum: ['accept', 'modify', 'decline'],
          required: true,
        },
        modifiedValue: mongoose.Schema.Types.Mixed, // The new value if modified
        note: {
          type: String,
          maxlength: 120, // As per specs
        },
      },
    },

    // Venue-specific: House Rules (for Venue → Community counter)
    houseRules: {
      alcohol: {
        allowed: Boolean,
        note: String,
      },
      soundLimit: String,
      ageRestriction: String,
      setupWindow: String,
      additionalRules: String,
    },

    // Commercial counter-offer
    commercialCounter: {
      model: String, // revenueShare, flatRental, coverCharge, etc.
      value: mongoose.Schema.Types.Mixed,
      note: String,
    },

    // General counter notes
    generalNotes: String,
  },

  // Status
  status: {
    type: String,
    enum: [
      'pending_admin_review',  // Submitted, waiting for admin
      'approved',              // Admin approved, delivered
      'rejected',              // Admin rejected
      'flagged',               // Flagged for review
    ],
    default: 'pending_admin_review',
    required: true,
  },

  // Admin review fields
  adminReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  adminReviewedAt: Date,
  adminNotes: String, // Private admin notes
  rejectionReason: String,

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
collaborationCounterSchema.index({ collaborationId: 1, createdAt: -1 });
collaborationCounterSchema.index({ responderId: 1 });
collaborationCounterSchema.index({ status: 1, createdAt: -1 });

// Virtual to calculate response time
collaborationCounterSchema.virtual('responseTime').get(function() {
  return this.createdAt;
});

// Method to check if user is the responder
collaborationCounterSchema.methods.isResponder = function(userId) {
  return this.responderId.equals(userId);
};

// Static method to get pending counter reviews
collaborationCounterSchema.statics.getPendingReviews = function() {
  return this.find({ status: 'pending_admin_review' })
    .populate('responderId', 'name email role profilePicture')
    .populate({
      path: 'collaborationId',
      populate: {
        path: 'proposerId recipientId',
        select: 'name email role profilePicture',
      },
    })
    .sort({ createdAt: 1 }); // Oldest first
};

// Method to count modifications
collaborationCounterSchema.methods.countModifications = function() {
  let count = 0;
  if (this.counterData.fieldResponses) {
    this.counterData.fieldResponses.forEach((response) => {
      if (response.action === 'modify') count++;
    });
  }
  return count;
};

// Method to count declines
collaborationCounterSchema.methods.countDeclines = function() {
  let count = 0;
  if (this.counterData.fieldResponses) {
    this.counterData.fieldResponses.forEach((response) => {
      if (response.action === 'decline') count++;
    });
  }
  return count;
};

module.exports = mongoose.model('CollaborationCounter', collaborationCounterSchema);
