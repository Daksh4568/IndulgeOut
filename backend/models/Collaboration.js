const mongoose = require('mongoose');
const { valuesDeepEqual } = require('../utils/workspaceUtils');

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
  
  // ===== STRUCTURED PROPOSAL DATA =====
  // Community → Brand Proposal
  communityToBrand: {
    // Section 1: Event Snapshot
    eventCategory: String,
    expectedAttendees: String,  // Range: '20-40', '40-80', '80-150', '150+'
    eventFormat: [String],  // Array: Workshop, Mixer/Social, Tournament, etc.
    targetAudience: [String],  // Array: Students, Young professionals, etc.
    nicheAudienceDetails: String,  // If 'Niche community' selected
    eventDate: mongoose.Schema.Types.Mixed,  // { date: Date, startTime: String, endTime: String } or Date
    backupDate: mongoose.Schema.Types.Mixed,  // { date: Date, startTime: String, endTime: String } (optional)
    showBackupDate: Boolean,
    city: String,
    
    // Section 2: Brand Deliverables
    brandDeliverables: {
      logoPlacement: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      onGroundBranding: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      sampling: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      sponsoredSegments: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      speaking: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      digitalShoutouts: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      leadCapture: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      }
    },
    
    // Section 3: Pricing/Commercials
    pricing: {
      cashSponsorship: {
        selected: Boolean,
        value: mongoose.Schema.Types.Mixed,
        comment: String
      },
      barter: {
        selected: Boolean,
        value: String,
        comment: String
      },
      stallCost: {
        selected: Boolean,
        value: Number,
        comment: String
      },
      revenueShare: {
        selected: Boolean,
        value: String,
        comment: String
      },
      additionalNotes: String
    },
    
    // Section 4: Audience Proof
    audienceProof: {
      pastSponsorBrands: {
        selected: Boolean,
        value: String
      },
      averageAttendance: {
        selected: Boolean,
        value: String
      },
      communitySize: {
        selected: Boolean,
        value: String
      },
      repeatEventRate: {
        selected: Boolean,
        value: String
      }
    },
    
    // Supporting Info
    supportingInfo: {
      images: [String],  // Array of image URLs
      note: String
    }
  },
  
  // Brand → Community Proposal
  brandToCommunity: {
    // Section 1: Campaign Snapshot
    campaignObjectives: mongoose.Schema.Types.Mixed,  // Object with objective_id: true
    targetAudience: String,
    preferredFormats: [String],
    city: String,
    timeline: mongoose.Schema.Types.Mixed,
    backupTimeline: mongoose.Schema.Types.Mixed,
    showBackupTimeline: Boolean,
    
    // Section 2: Brand Offers
    brandOffers: {
      cash: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      barter: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      coMarketing: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      content: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      speaking: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      }
    },
    
    // Section 3: Brand Expectations
    brandExpectations: {
      branding: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      speaking: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      sponsoredSegment: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      leadCapture: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      digitalShoutouts: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      exclusivity: {
        selected: Boolean,
        comment: String
      },
      contentRights: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      },
      salesBooth: {
        selected: Boolean,
        subOptions: mongoose.Schema.Types.Mixed,
        comment: String
      }
    }
  },
  
//   1. Stakeholder submits proposal → status: submitted
//  2. Admin reviews & approves → status: admin_approved
//  3. Recipient submits counter → status: vendor_accepted
//  4. Admin reviews & approves counter → status: counter_delivered ⭐
//     └─ "Open Workspace" button becomes ACTIVE on dashboards
//  5. Both parties negotiate in workspace (field-by-field)
//  6. Both parties click "Confirm Collaboration" → status: completed
//     └─ Workspace locks (read-only)
  // Status Workflow
  status: {
    type: String,
    enum: [
      'draft',              // Saved as draft (not submitted yet)
      'submitted',          // Stakeholder submits proposal → status: submitted
      'admin_approved',     //  Admin reviews & approves → status: admin_approved
      'admin_rejected',     // Rejected by admin
      'vendor_accepted',    // Vendor accepted/submitted counter , Recipient submits counter → status: vendor_accepted
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
      required: function() {
        // Only required if status is not 'draft'
        return this.status !== 'draft';
      },
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
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Structure of each field:
      // {
      //   "section.field": {
      //     initiatorValue: Mixed,        // Current value from initiator
      //     recipientValue: Mixed,        // Current value from recipient
      //     initiatorAgrees: Boolean,     // Does initiator agree?
      //     recipientAgrees: Boolean,     // Does recipient agree?
      //     status: 'agreed|pending|disputed',
      //     lastModifiedBy: {
      //       user: ObjectId,
      //       userType: String,
      //       at: Date
      //     }
      //   }
      // }
    },
    
    // Field-specific comments/notes
    // Key format: "sectionKey.fieldKey"
    fieldNotes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Structure of each note:
      // {
      //   "section.field": [{
      //     author: {
      //       user: ObjectId,
      //       userType: String,
      //       name: String,
      //       profileImage: String
      //     },
      //     message: String,
      //     createdAt: Date,
      //     isSystemMessage: Boolean
      //   }]
      // }
    },
    
    // Field change history
    // Key format: "sectionKey.fieldKey"
    fieldHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Structure of each history entry:
      // {
      //   "section.field": [{
      //     changedBy: {
      //       user: ObjectId,
      //       userType: String,
      //       name: String
      //     },
      //     previousValue: Mixed,
      //     newValue: Mixed,
      //     action: 'proposed|accepted|modified|declined|agreed|updated',
      //     timestamp: Date
      //   }]
      // }
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
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Structure: { "sectionKey": "agreed|pending|partial" }
    },
    
    // Last activity timestamp
    lastActivityAt: Date,
    
    // Pending changes (not yet saved)
    pendingChanges: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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
  let fieldAgreement = this.workspace.fieldAgreements?.[fieldKey] || {
    initiatorValue: null,
    recipientValue: null,
    initiatorAgrees: false,
    recipientAgrees: false,
    status: 'disputed'
  };
  
  // Store previous value for history
  const previousValue = isInitiator ? fieldAgreement.initiatorValue : fieldAgreement.recipientValue;
  
  // Update value
  if (isInitiator) {
    fieldAgreement.initiatorValue = value;
  } else {
    fieldAgreement.recipientValue = value;
  }
  
  // Agreement is purely driven by value matching
  const valuesMatch = valuesDeepEqual(fieldAgreement.initiatorValue, fieldAgreement.recipientValue);
  fieldAgreement.initiatorAgrees = valuesMatch;
  fieldAgreement.recipientAgrees = valuesMatch;
  
  // Status: agreed if values match, disputed if they don't
  fieldAgreement.status = valuesMatch ? 'agreed' : 'disputed';
  
  fieldAgreement.lastModifiedBy = {
    user: userId,
    userType,
    at: new Date()
  };
  
  if (!this.workspace.fieldAgreements) this.workspace.fieldAgreements = {};
  this.workspace.fieldAgreements[fieldKey] = fieldAgreement;
  
  // Add to history
  if (!this.workspace.fieldHistory) this.workspace.fieldHistory = {};
  let history = this.workspace.fieldHistory[fieldKey] || [];
  history.push({
    changedBy: { user: userId, userType, name: userName },
    previousValue,
    newValue: value,
    action: previousValue === null ? 'proposed' : 'updated',
    timestamp: new Date()
  });
  this.workspace.fieldHistory[fieldKey] = history;
  
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
  
  if (!this.workspace.fieldAgreements) this.workspace.fieldAgreements = {};
  let fieldAgreement = this.workspace.fieldAgreements[fieldKey];
  if (!fieldAgreement) {
    throw new Error('Field not found in workspace');
  }
  
  // Update agreement
  if (isInitiator) {
    fieldAgreement.initiatorAgrees = agrees;
  } else {
    fieldAgreement.recipientAgrees = agrees;
  }
  
  // Update status: only 'agreed' or 'disputed'
  if (fieldAgreement.initiatorAgrees && fieldAgreement.recipientAgrees && 
      valuesDeepEqual(fieldAgreement.initiatorValue, fieldAgreement.recipientValue)) {
    fieldAgreement.status = 'agreed';
  } else {
    fieldAgreement.status = 'disputed';
  }
  
  this.workspace.fieldAgreements[fieldKey] = fieldAgreement;
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
  if (!this.workspace.fieldNotes) this.workspace.fieldNotes = {};
  let notes = this.workspace.fieldNotes[fieldKey] || [];
  
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
  
  this.workspace.fieldNotes[fieldKey] = notes;
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
  
  if (!this.workspace.fieldAgreements) this.workspace.fieldAgreements = {};
  if (!this.workspace.sectionStatus) this.workspace.sectionStatus = {};
  
  // Get all fields for this section
  for (const [key, value] of Object.entries(this.workspace.fieldAgreements)) {
    if (key.startsWith(section + '.')) {
      // Agreement is purely driven by value matching
      const valuesMatch = valuesDeepEqual(value.initiatorValue, value.recipientValue);
      value.initiatorAgrees = valuesMatch;
      value.recipientAgrees = valuesMatch;
      value.status = valuesMatch ? 'agreed' : 'disputed';
      sectionFields.push(value);
    }
  }
  
  if (sectionFields.length === 0) {
    this.workspace.sectionStatus[section] = 'partial';
    return;
  }
  
  const allAgreed = sectionFields.every(f => f.status === 'agreed');
  
  if (allAgreed) {
    this.workspace.sectionStatus[section] = 'agreed';
  } else {
    this.workspace.sectionStatus[section] = 'partial';
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
  if (!this.workspace.sectionStatus) this.workspace.sectionStatus = {};
  const allSectionsAgreed = Object.values(this.workspace.sectionStatus).every(
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
  if (!this.workspace.isActive) return false;
  if (!this.initiator?.user || !this.recipient?.user) return false;
  
  return (
    this.initiator.user.toString() === userId.toString() ||
    this.recipient.user.toString() === userId.toString()
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
