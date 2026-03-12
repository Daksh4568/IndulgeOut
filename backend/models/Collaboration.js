const mongoose = require('mongoose');

/**
 * Collaboration Request Model
 * Manages partnership requests between Communities, Venues, and Brands
 */

const collaborationSchema = new mongoose.Schema({
  // Request Type
  type: {
    type: String,
    enum: [
      'communityToVenue',
      'communityToBrand',
      'venueToCommunity',
      'brandToCommunity'
    ],
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
    name: {
      type: String,
      required: true
    },
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
    name: {
      type: String,
      required: true
    },
    profileImage: String
  },
  
  // Form data from proposal
  formData: mongoose.Schema.Types.Mixed,
  
  // Status Workflow
  status: {
    type: String,
    enum: [
      'submitted',          // Initial submission
      'admin_approved',     // Approved by admin, forwarded to vendor
      'admin_rejected',     // Rejected by admin
      'vendor_accepted',    // Vendor accepted/submitted counter
      'counter_delivered',  // Admin approved counter, delivered to initiator
      'vendor_rejected',    // Vendor rejected the request
      'completed',          // Collaboration completed successfully
      'cancelled',          // Cancelled by initiator
      'expired'             // Expired without response
    ],
    default: 'submitted',
    index: true
  },
  
  // Admin Review
  adminReview: {
    // Initial proposal review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'  // Admin user
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'pending_info']
    },
    notes: String,  // Admin's internal notes or reason for rejection
    
    // Counter proposal review
    counterReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'  // Admin user who reviewed counter
    },
    counterReviewedAt: Date,
    counterDecision: {
      type: String,
      enum: ['approved', 'rejected']
    },
    counterNotes: String  // Admin's notes on counter review
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
      terms: String,  // JSON stringified full counter data
      fieldResponses: mongoose.Schema.Types.Mixed,  // Accept/Modify/Decline for each field
      houseRules: mongoose.Schema.Types.Mixed,  // Venue-specific rules
      brandTerms: mongoose.Schema.Types.Mixed,  // Brand-specific terms
      communityTerms: mongoose.Schema.Types.Mixed,  // Community-specific terms
      communityCommitments: mongoose.Schema.Types.Mixed,  // Community commitments (for brand->community)
      commercialCounter: mongoose.Schema.Types.Mixed,  // Modified commercial terms
      budgetAdjustment: Number
    }
  },
  
  // ===== COLLABORATION WORKSPACE =====
  // Interactive negotiation workspace for B2B stakeholder collaboration
  workspace: {
    // Workspace activation status
    isActive: {
      type: Boolean,
      default: false  // Activated after counter_delivered
    },
    
    // Lock after both parties confirm
    isLocked: {
      type: Boolean,
      default: false
    },
    
    // Track who confirmed the collaboration
    confirmedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userType: String,  // 'community' or 'vendor'
      confirmedAt: Date
    }],
    
    // Field-level agreement tracking
    // Key format: "sectionKey.fieldKey" (e.g., "eventDetails.eventType")
    fieldAgreements: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
      // Structure of each field:
      // {
      //   initiatorValue: Mixed,        // Current value from initiator
      //   recipientValue: Mixed,        // Current value from recipient
      //   initiatorAgrees: Boolean,     // Does initiator agree?
      //   recipientAgrees: Boolean,     // Does recipient agree?
      //   status: 'agreed|pending|disputed',
      //   lastModifiedBy: {
      //     user: ObjectId,
      //     userType: String,
      //     at: Date
      //   }
      // }
    },
    
    // Field-specific comments/notes
    // Key format: "sectionKey.fieldKey"
    fieldNotes: {
      type: Map,
      of: [mongoose.Schema.Types.Mixed],
      default: new Map()
      // Structure of each note:
      // [{
      //   author: {
      //     user: ObjectId,
      //     userType: String,
      //     name: String,
      //     profileImage: String
      //   },
      //   message: String,
      //   createdAt: Date,
      //   isSystemMessage: Boolean
      // }]
    },
    
    // Field change history
    // Key format: "sectionKey.fieldKey"
    fieldHistory: {
      type: Map,
      of: [mongoose.Schema.Types.Mixed],
      default: new Map()
      // Structure of each history entry:
      // [{
      //   changedBy: {
      //     user: ObjectId,
      //     userType: String,
      //     name: String
      //   },
      //   previousValue: Mixed,
      //   newValue: Mixed,
      //   action: 'proposed|accepted|modified|declined|agreed|updated',
      //   timestamp: Date
      // }]
    },
    
    // Master discussion forum
    forumMessages: [{
      author: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        userType: String,
        name: String,
        profileImage: String
      },
      message: String,
      messageType: {
        type: String,
        enum: ['user_message', 'system_notification'],
        default: 'user_message'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Section-level status tracking
    // Key: section name (e.g., "eventDetails")
    sectionStatus: {
      type: Map,
      of: String,  // 'agreed' | 'pending' | 'partial'
      default: new Map()
    },
    
    // Last activity timestamp
    lastActivityAt: Date,
    
    // Pending changes (not yet saved)
    pendingChanges: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    }
  },
  
  // Workspace activity log (for timeline)
  workspaceActivity: [{
    actor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      userType: String
    },
    action: String,  // "edited_field", "added_comment", "agreed_section", "saved_changes"
    target: String,  // "eventDetails.eventType" or section name
    description: String,  // Human-readable description
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
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

// ===== WORKSPACE METHODS =====

/**
 * Initialize workspace after counter is delivered
 * Parses counter data and sets up initial field agreements
 */
collaborationSchema.methods.initializeWorkspace = async function() {
  if (this.workspace.isActive) {
    throw new Error('Workspace already initialized');
  }
  
  if (this.status !== 'counter_delivered') {
    throw new Error('Can only initialize workspace after counter is delivered');
  }
  
  // Activate workspace
  this.workspace.isActive = true;
  this.workspace.lastActivityAt = new Date();
  
  // Add system message to forum
  this.workspace.forumMessages.push({
    author: {
      user: null,
      userType: 'system',
      name: 'System'
    },
    message: 'Collaboration workspace started',
    messageType: 'system_notification',
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

/**
 * Update field value in workspace
 */
collaborationSchema.methods.updateWorkspaceField = async function(userId, userType, userName, section, field, value, agrees = false) {
  if (this.workspace.isLocked) {
    throw new Error('Workspace is locked. Cannot make changes.');
  }
  
  const fieldKey = `${section}.${field}`;
  const isInitiator = this.initiator.user.toString() === userId.toString();
  
  // Get or create field agreement
  let fieldAgreement = this.workspace.fieldAgreements.get(fieldKey) || {
    initiatorValue: null,
    recipientValue: null,
    initiatorAgrees: false,
    recipientAgrees: false,
    status: 'pending'
  };
  
  // Store previous value for history
  const previousValue = isInitiator ? fieldAgreement.initiatorValue : fieldAgreement.recipientValue;
  
  // Update value
  if (isInitiator) {
    fieldAgreement.initiatorValue = value;
    fieldAgreement.initiatorAgrees = agrees;
  } else {
    fieldAgreement.recipientValue = value;
    fieldAgreement.recipientAgrees = agrees;
  }
  
  // Update status
  if (fieldAgreement.initiatorAgrees && fieldAgreement.recipientAgrees && 
      JSON.stringify(fieldAgreement.initiatorValue) === JSON.stringify(fieldAgreement.recipientValue)) {
    fieldAgreement.status = 'agreed';
  } else if (fieldAgreement.initiatorValue && fieldAgreement.recipientValue && 
             JSON.stringify(fieldAgreement.initiatorValue) !== JSON.stringify(fieldAgreement.recipientValue)) {
    fieldAgreement.status = 'disputed';
  } else {
    fieldAgreement.status = 'pending';
  }
  
  fieldAgreement.lastModifiedBy = {
    user: userId,
    userType,
    at: new Date()
  };
  
  this.workspace.fieldAgreements.set(fieldKey, fieldAgreement);
  
  // Add to history
  let history = this.workspace.fieldHistory.get(fieldKey) || [];
  history.push({
    changedBy: { user: userId, userType, name: userName },
    previousValue,
    newValue: value,
    action: previousValue === null ? 'proposed' : 'updated',
    timestamp: new Date()
  });
  this.workspace.fieldHistory.set(fieldKey, history);
  
  this.workspace.lastActivityAt = new Date();
  this.markModified('workspace.fieldAgreements');
  this.markModified('workspace.fieldHistory');
  
  await this.save();
  return this;
};

/**
 * Toggle agreement status for a field
 */
collaborationSchema.methods.toggleFieldAgreement = async function(userId, section, field, agrees) {
  if (this.workspace.isLocked) {
    throw new Error('Workspace is locked. Cannot make changes.');
  }
  
  const fieldKey = `${section}.${field}`;
  const isInitiator = this.initiator.user.toString() === userId.toString();
  
  let fieldAgreement = this.workspace.fieldAgreements.get(fieldKey);
  if (!fieldAgreement) {
    throw new Error('Field not found in workspace');
  }
  
  // Update agreement
  if (isInitiator) {
    fieldAgreement.initiatorAgrees = agrees;
  } else {
    fieldAgreement.recipientAgrees = agrees;
  }
  
  // Update status
  if (fieldAgreement.initiatorAgrees && fieldAgreement.recipientAgrees && 
      JSON.stringify(fieldAgreement.initiatorValue) === JSON.stringify(fieldAgreement.recipientValue)) {
    fieldAgreement.status = 'agreed';
  } else {
    fieldAgreement.status = 'pending';
  }
  
  this.workspace.fieldAgreements.set(fieldKey, fieldAgreement);
  this.workspace.lastActivityAt = new Date();
  this.markModified('workspace.fieldAgreements');
  
  await this.save();
  return this;
};

/**
 * Add a note/comment to a specific field
 */
collaborationSchema.methods.addFieldNote = async function(userId, userType, userName, profileImage, section, field, message) {
  if (this.workspace.isLocked) {
    throw new Error('Workspace is locked. Cannot add notes.');
  }
  
  const fieldKey = `${section}.${field}`;
  let notes = this.workspace.fieldNotes.get(fieldKey) || [];
  
  notes.push({
    author: {
      user: userId,
      userType,
      name: userName,
      profileImage: profileImage || ''
    },
    message,
    createdAt: new Date(),
    isSystemMessage: false
  });
  
  this.workspace.fieldNotes.set(fieldKey, notes);
  this.workspace.lastActivityAt = new Date();
  this.markModified('workspace.fieldNotes');
  
  await this.save();
  return this;
};

/**
 * Add message to master forum
 */
collaborationSchema.methods.addForumMessage = async function(userId, userType, userName, profileImage, message) {
  if (this.workspace.isLocked) {
    throw new Error('Workspace is locked. Cannot send messages.');
  }
  
  this.workspace.forumMessages.push({
    author: {
      user: userId,
      userType,
      name: userName,
      profileImage: profileImage || ''
    },
    message,
    messageType: 'user_message',
    createdAt: new Date()
  });
  
  this.workspace.lastActivityAt = new Date();
  await this.save();
  return this;
};

/**
 * Add system notification to forum
 */
collaborationSchema.methods.addSystemNotification = async function(message) {
  this.workspace.forumMessages.push({
    author: {
      user: null,
      userType: 'system',
      name: 'System'
    },
    message,
    messageType: 'system_notification',
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

/**
 * Calculate section status based on field statuses
 */
collaborationSchema.methods.updateSectionStatus = function(section) {
  const sectionFields = [];
  
  // Get all fields for this section
  for (const [key, value] of this.workspace.fieldAgreements.entries()) {
    if (key.startsWith(section + '.')) {
      sectionFields.push(value);
    }
  }
  
  if (sectionFields.length === 0) {
    this.workspace.sectionStatus.set(section, 'pending');
    return;
  }
  
  const allAgreed = sectionFields.every(f => f.status === 'agreed');
  const anyDisputed = sectionFields.some(f => f.status === 'disputed');
  
  if (allAgreed) {
    this.workspace.sectionStatus.set(section, 'agreed');
  } else if (anyDisputed) {
    this.workspace.sectionStatus.set(section, 'partial');
  } else {
    this.workspace.sectionStatus.set(section, 'pending');
  }
};

/**
 * Confirm collaboration by one party
 */
collaborationSchema.methods.confirmCollaboration = async function(userId, userType) {
  if (this.workspace.isLocked) {
    throw new Error('Collaboration already confirmed and locked');
  }
  
  // Check if all sections are agreed
  const allSectionsAgreed = Array.from(this.workspace.sectionStatus.values()).every(
    status => status === 'agreed'
  );
  
  if (!allSectionsAgreed) {
    throw new Error('All sections must be agreed before confirming collaboration');
  }
  
  // Check if user already confirmed
  const alreadyConfirmed = this.workspace.confirmedBy.some(
    c => c.user.toString() === userId.toString()
  );
  
  if (alreadyConfirmed) {
    throw new Error('You have already confirmed this collaboration');
  }
  
  // Add confirmation
  this.workspace.confirmedBy.push({
    user: userId,
    userType,
    confirmedAt: new Date()
  });
  
  // If both parties confirmed, lock workspace and complete collaboration
  if (this.workspace.confirmedBy.length === 2) {
    this.workspace.isLocked = true;
    this.status = 'completed';
    
    await this.addSystemNotification('Collaboration confirmed by both parties. Workspace is now locked.');
  }
  
  this.workspace.lastActivityAt = new Date();
  await this.save();
  return this;
};

/**
 * Check if user can access workspace
 */
collaborationSchema.methods.canAccessWorkspace = function(userId) {
  return (
    this.workspace.isActive &&
    (this.initiator.user.toString() === userId.toString() ||
     this.recipient.user.toString() === userId.toString())
  );
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
