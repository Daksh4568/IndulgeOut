/**
 * Workspace Utilities
 * Helper functions for initializing and managing collaboration workspaces
 */

/**
 * Field configuration by collaboration type
 * Maps proposal form sections and fields
 */
const WORKSPACE_FIELD_CONFIGS = {
  communityToVenue: {
    eventDetails: {
      title: 'Event Details',
      fields: ['eventType', 'expectedAttendees', 'seatingCapacity', 'eventDate', 'backupDate']
    },
    venueRequirements: {
      title: 'What Do You Need?',
      fields: ['spaceOnly', 'seating', 'barFood', 'audioVisual', 'production']
    },
    pricing: {
      title: 'Pricing & Payment',
      fields: ['revenueShare', 'flatRental', 'coverCharge']
    }
  },
  
  communityToBrand: {
    eventSnapshot: {
      title: 'Event Details',
      fields: ['eventCategory', 'expectedAttendees', 'targetAudience', 'city']
    },
    brandDeliverables: {
      title: 'What Do You Need?',
      fields: ['logoPlacement', 'onGroundBranding', 'sampling', 'sponsoredSegments', 'digitalShoutouts', 'leadCapture']
    },
    pricing: {
      title: 'Pricing & Payment',
      fields: ['cashSponsorship', 'barter', 'stallCost', 'revenueShare']
    }
  },
  
  venueToCommunity: {
    eventDetails: {
      title: 'Event Details',
      fields: ['eventType', 'expectedAttendees', 'proposedDate', 'alternativeDates']
    },
    venueOffering: {
      title: 'Venue Offering',
      fields: ['spaceIncluded', 'seatingProvided', 'foodBeverage', 'technicalSupport']
    },
    commercialTerms: {
      title: 'Commercial Terms',
      fields: ['revenueShare', 'fixedRental', 'minimumGuarantee']
    }
  },
  
  brandToCommunity: {
    collaborationDetails: {
      title: 'Collaboration Details',
      fields: ['collaborationType', 'expectedReach', 'targetDemographic', 'timeline']
    },
    brandExpectations: {
      title: 'Brand Expectations',
      fields: ['brandingOpportunities', 'contentDeliverables', 'exclusivity', 'reportingRequirements']
    },
    compensation: {
      title: 'Compensation',
      fields: ['cashSponsorship', 'productSupport', 'marketingSupport', 'revenueShare']
    }
  }
};

/**
 * Initialize workspace with counter data
 * Parses proposal and counter offer to set up field agreements
 */
async function initializeWorkspaceWithCounterData(collaboration) {
  if (!collaboration.formData || !collaboration.response?.counterOffer) {
    throw new Error('Cannot initialize workspace: Missing proposal or counter data');
  }
  
  const { formData, response, type, initiator, recipient } = collaboration;
  const counterOffer = response.counterOffer;
  const fieldResponses = counterOffer.fieldResponses || {};
  
  // Get field configuration for this collaboration type
  const fieldConfig = WORKSPACE_FIELD_CONFIGS[type];
  if (!fieldConfig) {
    throw new Error(`Unknown collaboration type: ${type}`);
  }
  
  // Initialize field agreements
  const fieldAgreements = new Map();
  const fieldHistory = new Map();
  const sectionStatus = new Map();
  
  // Process each section
  for (const [sectionKey, sectionConfig] of Object.entries(fieldConfig)) {
    const sectionFields = sectionConfig.fields;
    let agreedFieldsCount = 0;
    
    // Process each field in the section
    for (const fieldKey of sectionFields) {
      const fullFieldKey = `${sectionKey}.${fieldKey}`;
      
      // Get values from proposal and counter
      const initiatorValue = getNestedValue(formData, fieldKey);
      const fieldResponse = fieldResponses[fieldKey] || {};
      
      let recipientValue = initiatorValue;
      let recipientAgrees = false;
      
      // Determine recipient's response
      if (fieldResponse.action === 'accept') {
        recipientValue = initiatorValue;
        recipientAgrees = true;
        agreedFieldsCount++;
      } else if (fieldResponse.action === 'modify') {
        recipientValue = fieldResponse.modifiedValue || initiatorValue;
        recipientAgrees = false;
      } else if (fieldResponse.action === 'decline') {
        recipientValue = null;
        recipientAgrees = false;
      }
      
      // Set field agreement
      fieldAgreements.set(fullFieldKey, {
        initiatorValue,
        recipientValue,
        initiatorAgrees: false,  // Initiator hasn't reviewed counter yet
        recipientAgrees,
        status: (recipientAgrees && initiatorValue === recipientValue) ? 'agreed' : 'pending',
        lastModifiedBy: {
          user: recipient.user,
          userType: recipient.userType,
          at: response.respondedAt || new Date()
        }
      });
      
      // Initialize field history
      const history = [
        {
          changedBy: {
            user: initiator.user,
            userType: initiator.userType,
            name: initiator.name
          },
          previousValue: null,
          newValue: initiatorValue,
          action: 'proposed',
          timestamp: collaboration.createdAt
        }
      ];
      
      // Add counter action to history
      if (fieldResponse.action) {
        history.push({
          changedBy: {
            user: recipient.user,
            userType: recipient.userType,
            name: recipient.name
          },
          previousValue: initiatorValue,
          newValue: recipientValue,
          action: fieldResponse.action,
          timestamp: response.respondedAt || new Date()
        });
      }
      
      fieldHistory.set(fullFieldKey, history);
    }
    
    // Set section status
    if (agreedFieldsCount === sectionFields.length) {
      sectionStatus.set(sectionKey, 'agreed');
    } else if (agreedFieldsCount > 0) {
      sectionStatus.set(sectionKey, 'partial');
    } else {
      sectionStatus.set(sectionKey, 'pending');
    }
  }
  
  // Update collaboration workspace
  collaboration.workspace.fieldAgreements = fieldAgreements;
  collaboration.workspace.fieldHistory = fieldHistory;
  collaboration.workspace.sectionStatus = sectionStatus;
  collaboration.workspace.fieldNotes = new Map();  // Empty notes
  
  // Mark as modified for Mongoose
  collaboration.markModified('workspace.fieldAgreements');
  collaboration.markModified('workspace.fieldHistory');
  collaboration.markModified('workspace.sectionStatus');
  
  return collaboration;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  if (!obj) return null;
  
  // Try direct access first
  if (obj[path] !== undefined) {
    return obj[path];
  }
  
  // Try nested access
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  
  return value;
}

/**
 * Get section configuration for collaboration type
 */
function getSectionConfig(collaborationType) {
  return WORKSPACE_FIELD_CONFIGS[collaborationType] || null;
}

/**
 * Format workspace data for API response
 */
function formatWorkspaceForResponse(collaboration) {
  const { workspace, type, initiator, recipient } = collaboration;
  const fieldConfig = WORKSPACE_FIELD_CONFIGS[type];
  
  if (!fieldConfig) {
    return null;
  }
  
  // Build sections array
  const sections = [];
  
  for (const [sectionKey, sectionConfig] of Object.entries(fieldConfig)) {
    const sectionData = {
      key: sectionKey,
      title: sectionConfig.title,
      status: workspace.sectionStatus.get(sectionKey) || 'pending',
      fields: []
    };
    
    // Add fields
    for (const fieldKey of sectionConfig.fields) {
      const fullFieldKey = `${sectionKey}.${fieldKey}`;
      const fieldAgreement = workspace.fieldAgreements.get(fullFieldKey);
      const fieldNotes = workspace.fieldNotes.get(fullFieldKey) || [];
      
      if (fieldAgreement) {
        sectionData.fields.push({
          key: fieldKey,
          label: formatFieldLabel(fieldKey),
          initiatorValue: fieldAgreement.initiatorValue,
          recipientValue: fieldAgreement.recipientValue,
          initiatorAgrees: fieldAgreement.initiatorAgrees,
          recipientAgrees: fieldAgreement.recipientAgrees,
          status: fieldAgreement.status,
          hasNotes: fieldNotes.length > 0,
          notesCount: fieldNotes.length,
          lastModified: fieldAgreement.lastModifiedBy
        });
      }
    }
    
    sections.push(sectionData);
  }
  
  return {
    isActive: workspace.isActive,
    isLocked: workspace.isLocked,
    confirmedBy: workspace.confirmedBy,
    sections,
    forumMessages: workspace.forumMessages,
    lastActivityAt: workspace.lastActivityAt
  };
}

/**
 * Format field key to readable label
 */
function formatFieldLabel(fieldKey) {
  return fieldKey
    .replace(/([A-Z])/g, ' $1')  // Add space before capital letters
    .replace(/^./, str => str.toUpperCase())  // Capitalize first letter
    .trim();
}

/**
 * Check if all sections are agreed
 */
function areAllSectionsAgreed(workspace) {
  const statuses = Array.from(workspace.sectionStatus.values());
  return statuses.length > 0 && statuses.every(status => status === 'agreed');
}

module.exports = {
  WORKSPACE_FIELD_CONFIGS,
  initializeWorkspaceWithCounterData,
  getSectionConfig,
  formatWorkspaceForResponse,
  formatFieldLabel,
  areAllSectionsAgreed,
  getNestedValue
};
