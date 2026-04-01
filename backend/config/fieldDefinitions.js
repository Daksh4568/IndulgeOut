/**
 * Field Definitions for Collaboration Workspace
 * Defines field types, options, validation, and rendering metadata
 */

const FIELD_DEFINITIONS = {
  // Event Details Fields
  eventCategory: {
    type: 'select',
    label: 'Event Category',
    options: [
      'Social Mixers',
      'Wellness, Fitness & Sports',
      'Art, Music & Dance',
      'Immersive',
      'Food & Beverage',
      'Games'
    ]
  },
  
  eventType: {
    type: 'select',
    label: 'Event Type',
    options: [
      'Social Mixers',
      'Wellness, Fitness & Sports',
      'Art, Music & Dance',
      'Immersive',
      'Food & Beverage',
      'Games'
    ]
  },
  
  eventFormat: {
    type: 'multi-select',
    label: 'Event Format',
    options: [
      'Workshop',
      'Mixer / Social',
      'Tournament',
      'Performance / Show',
      'Panel / Talk',
      'Experiential / Activation'
    ]
  },
  
  expectedAttendees: {
    type: 'number',
    label: 'Expected Attendees',
    min: 1
  },
  
  seatingCapacity: {
    type: 'number',
    label: 'Seating Capacity',
    min: 0
  },
  
  targetAudience: {
    type: 'multi-select',
    label: 'Target Audience',
    options: [
      'Students',
      'Young professionals',
      'Founders / Creators',
      'Families',
      'Niche community'
    ],
    allowCustom: true
  },
  
  eventDate: {
    type: 'event-datetime',
    label: 'Date & Time'
  },
  
  backupDate: {
    type: 'event-datetime',
    label: 'Backup Date & Time'
  },
  
  proposedDate: {
    type: 'date',
    label: 'Proposed Date'
  },
  
  alternativeDates: {
    type: 'text',
    label: 'Alternative Dates',
    multiline: true
  },
  
  city: {
    type: 'text',
    label: 'City'
  },
  
  // Venue Requirements
  spaceOnly: {
    type: 'boolean-with-details',
    label: 'Space Only',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'indoor_space',
        'outdoor_space',
        'parking'
      ]
    }
  },
  
  seating: {
    type: 'boolean-with-details',
    label: 'Seating',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'theater_style',
        'classroom_style',
        'banquet_rounds'
      ]
    }
  },
  
  barFood: {
    type: 'boolean-with-details',
    label: 'Bar & Food',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'full_bar',
        'beer_wine_only',
        'catering',
        'snacks_only'
      ]
    }
  },
  
  audioVisual: {
    type: 'boolean-with-details',
    label: 'Audio Visual',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'sound_system',
        'microphones',
        'projector_screen',
        'lighting'
      ]
    }
  },
  
  production: {
    type: 'boolean-with-details',
    label: 'Production Support',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'sound_engineer',
        'lighting_tech',
        'stage_manager',
        'av_tech'
      ]
    }
  },
  
  // Brand Deliverables
  logoPlacement: {
    type: 'boolean-with-details',
    label: 'Logo Placement',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'posters',
        'banners',
        'tickets',
        'social_media'
      ]
    }
  },
  
  onGroundBranding: {
    type: 'boolean-with-details',
    label: 'On-Ground Branding',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'stage_backdrop',
        'standees',
        'entrance_exit'
      ]
    }
  },
  
  sampling: {
    type: 'boolean-with-details',
    label: 'Product Sampling / Trials',
    hasSubOptions: false
  },
  
  sponsoredSegments: {
    type: 'boolean-with-details',
    label: 'Sponsored Segment / Exclusive Naming Rights',
    hasSubOptions: false
  },
  
  digitalShoutouts: {
    type: 'boolean-with-details',
    label: 'Digital Shoutouts',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'instagram_posts',
        'stories',
        'reels',
        'email_mention'
      ]
    }
  },
  
  leadCapture: {
    type: 'boolean-with-details',
    label: 'Lead Capture / Registration Data',
    hasSubOptions: false
  },
  
  // Pricing & Payment
  cashSponsorship: {
    type: 'object',
    label: 'Cash Sponsorship',
    fields: {
      amount: { type: 'number', label: 'Amount ($)', min: 0 }
    }
  },
  
  barter: {
    type: 'object',
    label: 'Barter',
    fields: {
      description: { type: 'text', label: 'Description', multiline: true }
    }
  },
  
  stallCost: {
    type: 'object',
    label: 'Stall Cost',
    fields: {
      amount: { type: 'number', label: 'Amount ($)', min: 0 }
    }
  },
  
  revenueShare: {
    type: 'object',
    label: 'Revenue Share',
    fields: {
      percentage: { type: 'number', label: 'Percentage (%)', min: 0, max: 100 }
    }
  },
  
  flatRental: {
    type: 'object',
    label: 'Flat Rental',
    fields: {
      amount: { type: 'number', label: 'Amount ($)', min: 0 }
    }
  },
  
  coverCharge: {
    type: 'object',
    label: 'Cover Charge',
    fields: {
      amount: { type: 'number', label: 'Amount ($)', min: 0 },
      keepPercentage: { type: 'number', label: 'Keep Percentage (%)', min: 0, max: 100 }
    }
  },
  
  fixedRental: {
    type: 'object',
    label: 'Fixed Rental',
    fields: {
      amount: { type: 'number', label: 'Amount ($)', min: 0 }
    }
  },
  
  minimumGuarantee: {
    type: 'object',
    label: 'Minimum Guarantee',
    fields: {
      amount: { type: 'number', label: 'Amount ($)', min: 0 }
    }
  },
  
  // Brand Offers (Brand → Community)
  cash: {
    type: 'boolean-with-details',
    label: 'Cash Offer',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'upfront_payment',
        'milestone_based',
        'post_event_payment'
      ]
    }
  },
  
  coMarketing: {
    type: 'boolean-with-details',
    label: 'Co-Marketing',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'social_media_promotion',
        'email_blast',
        'blog_feature',
        'press_release'
      ]
    }
  },
  
  content: {
    type: 'boolean-with-details',
    label: 'Content Support',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'photography',
        'videography',
        'graphic_design',
        'social_media_content'
      ]
    }
  },
  
  // Brand Expectations (Brand → Community)
  branding: {
    type: 'boolean-with-details',
    label: 'Branding',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'logo_placement',
        'banner_display',
        'stage_branding',
        'merchandise'
      ]
    }
  },
  
  sponsoredSegment: {
    type: 'boolean-with-details',
    label: 'Sponsored Segment',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'title_sponsor',
        'presenting_sponsor',
        'segment_sponsor'
      ]
    }
  },
  
  exclusivity: {
    type: 'boolean-with-details',
    label: 'Exclusivity',
    hasSubOptions: true
  },
  
  contentRights: {
    type: 'boolean-with-details',
    label: 'Content Rights',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'photo_rights',
        'video_rights',
        'testimonial_rights',
        'brand_story_rights'
      ]
    }
  },
  
  salesBooth: {
    type: 'boolean-with-details',
    label: 'Sales Booth',
    hasSubOptions: true,
    subOptions: {
      type: 'checkbox',
      options: [
        'standard_booth',
        'premium_booth',
        'corner_booth',
        'demo_area'
      ]
    }
  },
  
  // Venue Offering
  spaceIncluded: {
    type: 'text',
    label: 'Space Included',
    multiline: true
  },
  
  seatingProvided: {
    type: 'text',
    label: 'Seating Provided',
    multiline: true
  },
  
  foodBeverage: {
    type: 'text',
    label: 'Food & Beverage',
    multiline: true
  },
  
  technicalSupport: {
    type: 'text',
    label: 'Technical Support',
    multiline: true
  },
  
  // Audience Proof (Read-only display)
  pastSponsorBrands: {
    type: 'text',
    label: 'Past Sponsor Brands',
    multiline: true,
    readOnly: true
  },
  
  averageAttendance: {
    type: 'number',
    label: 'Average Attendance',
    readOnly: true
  },
  
  communitySize: {
    type: 'number',
    label: 'Community Size',
    readOnly: true
  },
  
  repeatEventRate: {
    type: 'text',
    label: 'Repeat Event Rate',
    readOnly: true
  },
  
  // Campaign Details
  collaborationType: {
    type: 'select',
    label: 'Collaboration Type',
    options: [
      'Event Sponsorship',
      'Content Partnership',
      'Product Launch',
      'Brand Activation'
    ]
  },
  
  expectedReach: {
    type: 'number',
    label: 'Expected Reach',
    min: 0
  },
  
  targetDemographic: {
    type: 'text',
    label: 'Target Demographic',
    multiline: true
  },
  
  timeline: {
    type: 'daterange',
    label: 'Timeline',
    hasFlexible: true
  },
  
  campaignObjectives: {
    type: 'selectable-card',
    label: 'Campaign Objectives',
    subOptions: [
      { id: 'brand_awareness', label: 'Brand Awareness' },
      { id: 'product_trials', label: 'Product Trial / Sampling' },
      { id: 'lead_generation', label: 'Lead Generation' },
      { id: 'sales', label: 'Sales Conversion' },
      { id: 'engagement', label: 'Community Engagement' },
      { id: 'market_testing', label: 'Market Testing' },
      { id: 'content_creation', label: 'Content Creation' }
    ]
  },
  
  preferredFormats: {
    type: 'multi-select',
    label: 'Preferred Formats',
    options: [
      'Workshop',
      'Mixer / Social',
      'Tournament',
      'Performance / Show',
      'Panel / Talk',
      'Experiential / Activation',
      'Open to suggestions'
    ]
  },
  
  // Additional fields
  sponsorshipType: {
    type: 'multi-select',
    label: 'Sponsorship Type',
    options: [
      'Barter',
      'Paid Monetary',
      'Product Sampling',
      'Co-Marketing'
    ]
  },
  
  sponsoredSegmentExpectation: {
    type: 'text',
    label: 'Sponsored Segment Expectation',
    multiline: true
  },
  
  productSupport: {
    type: 'text',
    label: 'Product Support',
    multiline: true
  },
  
  marketingSupport: {
    type: 'text',
    label: 'Marketing Support',
    multiline: true
  }
};

/**
 * Helper to get field definition
 */
function getFieldDefinition(fieldName) {
  return FIELD_DEFINITIONS[fieldName] || {
    type: 'text',
    label: fieldName.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())
  };
}

/**
 * Helper to format field value for display
 */
function formatFieldValue(fieldName, value) {
  if (value === null || value === undefined) return 'Not set';
  
  const definition = getFieldDefinition(fieldName);
  
  switch (definition.type) {
    case 'boolean-with-details':
      if (typeof value === 'object' && value.selected) {
        return 'Yes';
      }
      return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 'Not set';
      
    case 'multi-select':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
      
    case 'object':
      if (typeof value === 'object') {
        return Object.entries(value)
          .filter(([k, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      }
      return String(value);
      
    case 'event-datetime':
      if (typeof value === 'object') {
        const parts = [];
        if (value.date) parts.push(value.date);
        if (value.startTime) parts.push(`${value.startTime}`);
        if (value.endTime) parts.push(`- ${value.endTime}`);
        return parts.join(' ') || 'Not set';
      }
      return String(value);

    case 'selectable-card':
      if (Array.isArray(value)) {
        return value.map(v => {
          const opt = definition.subOptions?.find(o => o.id === v);
          return opt ? opt.label : v;
        }).join(', ');
      }
      if (typeof value === 'object' && value.selected) {
        return 'Yes';
      }
      return String(value);

    case 'daterange':
      if (typeof value === 'object') {
        const parts = [];
        if (value.startDate) parts.push(`From: ${value.startDate}`);
        if (value.endDate) parts.push(`To: ${value.endDate}`);
        if (value.flexible) parts.push('(Flexible)');
        return parts.join(' ');
      }
      return String(value);
      
    default:
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
  }
}

module.exports = {
  FIELD_DEFINITIONS,
  getFieldDefinition,
  formatFieldValue
};
