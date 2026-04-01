/**
 * Workspace Utilities
 * Helper functions for initializing and managing collaboration workspaces
 */

/**
 * Order-insensitive deep equality for field values.
 * Arrays are sorted before comparison so ["A","B"] equals ["B","A"].
 * Objects with boolean values (sub-options) are compared by their true keys.
 */
function valuesDeepEqual(a, b) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;

  // Both arrays → sort copies then compare
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return JSON.stringify(sortedA) === JSON.stringify(sortedB);
  }

  // Both objects (sub-options like {brand_awareness: true}) → compare sorted keys with true values
  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keysA = Object.keys(a).filter(k => a[k]).sort();
    const keysB = Object.keys(b).filter(k => b[k]).sort();
    return JSON.stringify(keysA) === JSON.stringify(keysB);
  }

  return JSON.stringify(a) === JSON.stringify(b);
}

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
    requirements: {
      title: 'What Do You Need?',
      fields: ['spaceOnly', 'seating', 'barFood', 'av', 'production']
    },
    pricing: {
      title: 'Pricing & Payment',
      fields: ['revenueShare', 'flatRental', 'coverCharge']
    }
  },
  
  communityToBrand: {
    eventSnapshot: {
      title: 'Event Details',
      fields: ['eventCategory', 'expectedAttendees', 'eventFormat', 'targetAudience', 'eventDate', 'backupDate', 'city']
    },
    brandDeliverables: {
      title: 'Brand Deliverables',
      fields: ['logoPlacement', 'onGroundBranding', 'sampling', 'sponsoredSegments', 'digitalShoutouts', 'leadCapture']
    },
    pricing: {
      title: 'Pricing & Payment',
      fields: ['cashSponsorship', 'barter', 'stallCost', 'revenueShare']
    },
    audienceProof: {
      title: 'Audience Proof',
      fields: ['pastSponsorBrands', 'averageAttendance', 'communitySize', 'repeatEventRate']
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
    campaignSnapshot: {
      title: 'Campaign Details',
      fields: ['campaignObjectives', 'targetAudience', 'preferredFormats', 'city', 'eventDate', 'backupDate']
    },
    brandOffers: {
      title: 'Brand Offers',
      fields: ['cash', 'barter', 'coMarketing', 'content']
    },
    brandExpectations: {
      title: 'Brand Expectations',
      fields: ['branding', 'speaking', 'sponsoredSegment', 'leadCapture', 'digitalShoutouts', 'exclusivity', 'contentRights', 'salesBooth']
    }
  }
};

/**
 * Counter form field key → workspace field key mapping
 * Counter forms sometimes use different keys (e.g., cashOffer → cash)
 * Organized by section for proper disambiguation
 */
const COUNTER_FIELD_KEY_MAP = {
  brandToCommunity: {
    brandOffers: {
      cashOffer: 'cash',
      barterOffer: 'barter',
      coMarketingOffer: 'coMarketing',
      contentOffer: 'content'
    },
    brandExpectations: {
      brandingExpectation: 'branding',
      speakingExpectation: 'speaking',
      sponsoredSegmentExpectation: 'sponsoredSegment',
      leadCaptureExpectation: 'leadCapture',
      digitalShoutoutsExpectation: 'digitalShoutouts',
      exclusivityExpectation: 'exclusivity',
      contentRightsExpectation: 'contentRights',
      salesBoothExpectation: 'salesBooth'
    }
  },
  communityToBrand: {
    // Brand counter bundles pricing into commercialModel — handled separately
  }
};

/**
 * Reverse mapping: workspace field key → counter field key (section-aware)
 */
function getCounterFieldKey(collabType, sectionKey, fieldKey) {
  const typeMap = COUNTER_FIELD_KEY_MAP[collabType];
  if (!typeMap) return fieldKey;
  
  const sectionMap = typeMap[sectionKey];
  if (!sectionMap) return fieldKey;
  
  // Find the counter key that maps to this workspace field key
  for (const [counterKey, workspaceKey] of Object.entries(sectionMap)) {
    if (workspaceKey === fieldKey) {
      return counterKey;
    }
  }
  return fieldKey;
}

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
  const fieldAgreements = {};
  const fieldHistory = {};
  const sectionStatus = {};
  const fieldNotes = {};
  
  // Process each section
  for (const [sectionKey, sectionConfig] of Object.entries(fieldConfig)) {
    // Skip audienceProof section - it's reference only, not for negotiation
    if (sectionKey === 'audienceProof') {
      continue;
    }
    
    const sectionFields = sectionConfig.fields;
    let agreedFieldsCount = 0;
    let processedFieldsCount = 0;
    
    console.log(`[Workspace Init] Processing section: ${sectionKey}, fields:`, sectionFields);
    
    // Process each field in the section
    for (const fieldKey of sectionFields) {
      const fullFieldKey = `${sectionKey}.${fieldKey}`;
      
      // Get raw field data from proposal (look in nested section object)
      let initiatorFieldData;
      
      // For some sections, data is nested (e.g., formData.brandDeliverables.logoPlacement)
      // For others, it's at top level (e.g., formData.eventCategory)
      if (formData[sectionKey] && typeof formData[sectionKey] === 'object') {
        initiatorFieldData = formData[sectionKey][fieldKey];
      } else {
        initiatorFieldData = formData[fieldKey];
      }
      
      console.log(`[Workspace Init] Field ${fieldKey}:`, {
        rawData: initiatorFieldData,
        isFilled: isFieldFilledInProposal(initiatorFieldData)
      });
      
      // Skip fields that weren't filled/selected in the proposal
      if (!isFieldFilledInProposal(initiatorFieldData)) {
        console.log(`[Workspace Init] Skipping ${fieldKey} - not filled`);
        continue;
      }
      
      processedFieldsCount++;
      
      // Extract the actual value to store
      const initiatorValue = extractActualValue(initiatorFieldData);
      console.log(`[Workspace Init] Extracted value for ${fieldKey}:`, initiatorValue);
      
      // Look up counter response using the correct counter field key
      const counterFieldKey = getCounterFieldKey(type, sectionKey, fieldKey);
      const fieldResponse = fieldResponses[counterFieldKey] || fieldResponses[fieldKey] || {};
      
      console.log(`[Workspace Init] Counter lookup: workspace=${fieldKey}, counter=${counterFieldKey}, found action=${fieldResponse.action}`);
      
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
      const valuesMatch = valuesDeepEqual(initiatorValue, recipientValue);
      fieldAgreements[fullFieldKey] = {
        initiatorValue,
        recipientValue,
        initiatorAgrees: valuesMatch ? true : false,
        recipientAgrees: valuesMatch ? true : recipientAgrees,
        status: valuesMatch ? 'agreed' : determineFieldStatus(initiatorValue, recipientValue, recipientAgrees),
        lastModifiedBy: {
          user: recipient.user,
          userType: recipient.userType,
          at: response.respondedAt || new Date()
        }
      };
      
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
      
      fieldHistory[fullFieldKey] = history;
      
      // Initialize field notes from comments
      const notes = [];
      
      // Check for comment in proposal (initiator's comment)
      if (initiatorFieldData && initiatorFieldData.comment) {
        notes.push({
          author: {
            user: initiator.user,
            name: initiator.name,
            userType: initiator.userType
          },
          message: initiatorFieldData.comment,
          createdAt: collaboration.createdAt
        });
      }
      
      // Check for note/comment in counter offer (recipient's comment/note)
      if (fieldResponse.note) {
        notes.push({
          author: {
            user: recipient.user,
            name: recipient.name,
            userType: recipient.userType
          },
          message: fieldResponse.note,
          createdAt: response.respondedAt || new Date()
        });
      }
      
      // Only add to fieldNotes if there are comments
      if (notes.length > 0) {
        fieldNotes[fullFieldKey] = notes;
      }
    }
    
    // Special handling: communityToBrand pricing section
    // Counter form bundles all pricing into 'commercialModel' field response
    if (type === 'communityToBrand' && sectionKey === 'pricing' && fieldResponses.commercialModel) {
      const commercialResponse = fieldResponses.commercialModel;
      // Apply the commercial counter note to all pricing fields that exist
      for (const [key, value] of Object.entries(fieldAgreements)) {
        if (key.startsWith('pricing.')) {
          const fKey = key.split('.')[1];
          if (commercialResponse.action === 'accept') {
            value.recipientAgrees = true;
            value.status = 'agreed';
            agreedFieldsCount++;
          } else if (commercialResponse.action === 'modify') {
            value.recipientAgrees = false;
            value.status = 'disputed';
          } else if (commercialResponse.action === 'decline') {
            value.recipientAgrees = false;
            value.status = 'disputed';
          }
          
          // Add commercial counter note to pricing field notes
          if (commercialResponse.note) {
            const noteKey = `pricing.${fKey}`;
            if (!fieldNotes[noteKey]) fieldNotes[noteKey] = [];
            fieldNotes[noteKey].push({
              author: {
                user: recipient.user,
                name: recipient.name,
                userType: recipient.userType
              },
              message: commercialResponse.note,
              createdAt: response.respondedAt || new Date()
            });
          }
        }
      }
      
      // If commercial model was modified, add the counter text as a system-level note
      if (commercialResponse.action === 'modify' && commercialResponse.modifiedValue) {
        // Add to the first pricing field's history
        const firstPricingKey = Object.keys(fieldAgreements).find(k => k.startsWith('pricing.'));
        if (firstPricingKey) {
          fieldHistory[firstPricingKey] = fieldHistory[firstPricingKey] || [];
          fieldHistory[firstPricingKey].push({
            changedBy: {
              user: recipient.user,
              userType: recipient.userType,
              name: recipient.name
            },
            previousValue: null,
            newValue: commercialResponse.modifiedValue,
            action: 'counter_proposal',
            timestamp: response.respondedAt || new Date()
          });
        }
      }
    }
    
    // Only set section status if section has fields
    if (processedFieldsCount > 0) {
      if (agreedFieldsCount === processedFieldsCount) {
        sectionStatus[sectionKey] = 'agreed';
      } else {
        sectionStatus[sectionKey] = 'partial';
      }
    }
  }
  
  // Update collaboration workspace
  collaboration.workspace.fieldAgreements = fieldAgreements;
  collaboration.workspace.fieldHistory = fieldHistory;
  collaboration.workspace.sectionStatus = sectionStatus;
  collaboration.workspace.fieldNotes = fieldNotes;
  
  // Mark as modified for Mongoose
  collaboration.markModified('workspace.fieldAgreements');
  collaboration.markModified('workspace.fieldHistory');
  collaboration.markModified('workspace.sectionStatus');
  collaboration.markModified('workspace.fieldNotes');
  
  return collaboration;
}

/**
 * Check if a field was actually filled/selected in the proposal
 * Returns true if the field should be included in workspace
 */
function isFieldFilledInProposal(fieldData) {
  // Null or undefined means not filled
  if (fieldData === null || fieldData === undefined) {
    return false;
  }
  
  // For objects with 'selected' property (fields with sub-options or value)
  if (typeof fieldData === 'object' && 'selected' in fieldData) {
    if (fieldData.selected !== true) {
      return false;
    }
    
    // If has a value property, check if it's not empty
    if ('value' in fieldData) {
      const val = fieldData.value;
      if (val === null || val === undefined || val === '') {
        return false;
      }
      return true;
    }
    
    // If has subOptions, check if any are selected
    if (fieldData.subOptions && typeof fieldData.subOptions === 'object') {
      return Object.keys(fieldData.subOptions).some(key => {
        const subOpt = fieldData.subOptions[key];
        return subOpt && (subOpt.selected === true || subOpt === true);
      });
    }
    
    // If selected but no value or sub-options, consider it filled (simple checkboxes)
    return true;
  }
  
  // For boolean values - true means selected
  if (typeof fieldData === 'boolean') {
    return fieldData === true;
  }
  
  // For strings - non-empty means filled
  if (typeof fieldData === 'string') {
    return fieldData.trim().length > 0;
  }
  
  // For numbers - any number is valid
  if (typeof fieldData === 'number') {
    return true;
  }
  
  // For arrays - non-empty means filled
  if (Array.isArray(fieldData)) {
    return fieldData.length > 0;
  }
  
  // For objects (like date ranges), check if it has meaningful content
  if (typeof fieldData === 'object') {
    // Empty object
    if (Object.keys(fieldData).length === 0) {
      return false;
    }
    
    // Check if any value is not null/undefined/empty
    const hasContent = Object.values(fieldData).some(v => {
      if (v === null || v === undefined || v === '') return false;
      if (typeof v === 'object' && Object.keys(v).length === 0) return false;
      return true;
    });
    
    return hasContent;
  }
  
  return false;
}

/**
 * Extract the actual value to store from field data
 * This is what gets stored as initiatorValue/recipientValue
 */
function extractActualValue(fieldData) {
  if (fieldData === null || fieldData === undefined) {
    return null;
  }
  
  // For fields with sub-options structure: {selected: true, subOptions: {...}} or {selected: true, value: 'xxx'}
  if (typeof fieldData === 'object' && 'selected' in fieldData) {
    if (fieldData.selected === true) {
      // If has a value property, return it
      if ('value' in fieldData) {
        return fieldData.value;
      }
      // If has subOptions, return them
      if (fieldData.subOptions && Object.keys(fieldData.subOptions).length > 0) {
        return fieldData.subOptions;
      }
      // Otherwise return true (field was selected but no sub-options)
      return true;
    }
    return null;
  }
  
  // For direct values (strings, numbers, arrays)
  if (typeof fieldData !== 'object') {
    return fieldData;
  }
  
  // For objects, return as-is (date ranges, etc.)
  return fieldData;
}

/**
 * Determine field status based on values and agreements
 * Only two visual states: 'agreed' or 'disputed' (no 'pending')
 */
function determineFieldStatus(initiatorValue, recipientValue, recipientAgrees) {
  // If recipient agreed and values match → agreed
  if (recipientAgrees) {
    if (valuesDeepEqual(initiatorValue, recipientValue)) {
      return 'agreed';
    }
  }
  
  // Everything else is disputed (counter modified/declined, or didn't explicitly accept)
  return 'disputed';
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
 * Get nested field data including comment from object
 */
function getNestedFieldData(obj, path) {
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
  const { workspace, type, initiator, recipient, formData } = collaboration;
  const fieldConfig = WORKSPACE_FIELD_CONFIGS[type];
  let needsSave = false;
  
  if (!fieldConfig) {
    return null;
  }
  
  // If workspace not initialized yet, return minimal structure
  if (!workspace || !workspace.isActive) {
    return {
      isActive: false,
      isLocked: false,
      confirmedBy: [],
      sections: [],
      audienceProof: null,
      forumMessages: [],
      lastActivityAt: null
    };
  }
  
  // Build sections array (excluding audienceProof)
  const sections = [];
  
  for (const [sectionKey, sectionConfig] of Object.entries(fieldConfig)) {
    // Skip audienceProof - it's handled separately
    if (sectionKey === 'audienceProof') {
      continue;
    }
    
    // Only include section if it has fields in workspace
    const hasSectionFields = sectionConfig.fields.some(fieldKey => {
      const fullFieldKey = `${sectionKey}.${fieldKey}`;
      return workspace.fieldAgreements?.[fullFieldKey];
    });
    
    if (!hasSectionFields) {
      continue;
    }
    
    const sectionData = {
      key: sectionKey,
      title: sectionConfig.title,
      status: workspace.sectionStatus?.[sectionKey] || 'pending',
      fields: []
    };
    
    // Add only fields that exist in fieldAgreements
    for (const fieldKey of sectionConfig.fields) {
      const fullFieldKey = `${sectionKey}.${fieldKey}`;
      const fieldAgreement = workspace.fieldAgreements?.[fullFieldKey];
      const fieldNotes = workspace.fieldNotes?.[fullFieldKey] || [];
      
      if (fieldAgreement) {
        // Agreement is purely driven by value matching
        const valuesMatch = valuesDeepEqual(fieldAgreement.initiatorValue, fieldAgreement.recipientValue);
        const effectiveInitiatorAgrees = valuesMatch;
        const effectiveRecipientAgrees = valuesMatch;
        const effectiveStatus = valuesMatch ? 'agreed' : 'disputed';

        // Persist corrections to DB if they differ
        if (fieldAgreement.initiatorAgrees !== effectiveInitiatorAgrees || 
            fieldAgreement.recipientAgrees !== effectiveRecipientAgrees ||
            fieldAgreement.status !== effectiveStatus) {
          fieldAgreement.initiatorAgrees = effectiveInitiatorAgrees;
          fieldAgreement.recipientAgrees = effectiveRecipientAgrees;
          fieldAgreement.status = effectiveStatus;
          needsSave = true;
        }

        sectionData.fields.push({
          key: fieldKey,
          label: formatFieldLabel(fieldKey),
          initiatorValue: fieldAgreement.initiatorValue,
          recipientValue: fieldAgreement.recipientValue,
          initiatorAgrees: effectiveInitiatorAgrees,
          recipientAgrees: effectiveRecipientAgrees,
          status: effectiveStatus,
          hasNotes: fieldNotes.length > 0,
          notesCount: fieldNotes.length,
          lastModified: fieldAgreement.lastModifiedBy
        });
      }
    }
    
    // Only add section if it has fields
    if (sectionData.fields.length > 0) {
      // Recalculate section status based on auto-corrected fields
      const allFieldsAgreed = sectionData.fields.every(f => f.status === 'agreed');
      if (allFieldsAgreed && sectionData.fields.length > 0) {
        sectionData.status = 'agreed';
        if (workspace.sectionStatus?.[sectionKey] !== 'agreed') {
          workspace.sectionStatus[sectionKey] = 'agreed';
          needsSave = true;
        }
      }
      sections.push(sectionData);
    }
  }
  
  // Extract audience proof data if it exists (for display only)
  let audienceProof = null;
  if (fieldConfig.audienceProof && formData && formData.audienceProof) {
    console.log('[Workspace] Checking for audience proof in formData.audienceProof:', formData.audienceProof);
    
    audienceProof = {
      pastSponsorBrands: formData.audienceProof.pastSponsorBrands || null,
      averageAttendance: formData.audienceProof.averageAttendance || null,
      communitySize: formData.audienceProof.communitySize || null,
      repeatEventRate: formData.audienceProof.repeatEventRate || null
    };
    
    console.log('[Workspace] Extracted audienceProof:', audienceProof);
    
    // Only include if at least one field has data
    const hasData = Object.values(audienceProof).some(v => v !== null && v !== undefined && v !== '');
    if (!hasData) {
      console.log('[Workspace] No audience proof data found, setting to null');
      audienceProof = null;
    } else {
      console.log('[Workspace] Audience proof has data, including in response');
    }
  }
  
  // Persist any auto-corrections to the database
  if (needsSave && collaboration.markModified && collaboration.save) {
    collaboration.markModified('workspace.fieldAgreements');
    collaboration.markModified('workspace.sectionStatus');
    collaboration.save().catch(err => console.error('[Workspace] Auto-correct save error:', err));
  }

  return {
    isActive: workspace.isActive,
    isLocked: workspace.isLocked,
    confirmedBy: workspace.confirmedBy || [],
    sections,
    audienceProof,
    forumMessages: workspace.forumMessages || [],
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
  const statuses = Object.values(workspace.sectionStatus || {});
  return statuses.length > 0 && statuses.every(status => status === 'agreed');
}

module.exports = {
  WORKSPACE_FIELD_CONFIGS,
  initializeWorkspaceWithCounterData,
  getSectionConfig,
  formatWorkspaceForResponse,
  formatFieldLabel,
  areAllSectionsAgreed,
  getNestedValue,
  valuesDeepEqual
};
