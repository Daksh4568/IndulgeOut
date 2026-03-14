// Field Definitions for Collaboration Workspace Frontend
// Defines field types, options, and rendering logic
// Must match proposal form sections exactly for consistency

export const FIELD_DEFINITIONS = {
  // ═══════════════════════════════════════
  // EVENT DETAILS (communityToVenue)
  // ═══════════════════════════════════════
  eventType: {
    type: 'select',
    label: 'Event Type',
    options: [
      'Music & Concerts',
      'Comedy & Standup',
      'Art & Exhibitions',
      'Food & Culinary',
      'Workshops',
      'Networking'
    ]
  },

  expectedAttendees: {
    type: 'select',
    label: 'Expected Attendees',
    options: ['10-20', '20-40', '40-80', '80+']
  },

  seatingCapacity: {
    type: 'select',
    label: 'Seating Capacity',
    options: ['10-20', '20-40', '40-80', '80+']
  },

  eventDate: {
    type: 'event-datetime',
    label: 'Date & Time'
  },

  backupDate: {
    type: 'event-datetime',
    label: 'Backup Date & Time'
  },

  // ═══════════════════════════════════════
  // EVENT SNAPSHOT (communityToBrand)
  // ═══════════════════════════════════════
  eventCategory: {
    type: 'select',
    label: 'Event Category',
    options: [
      'Music & Concerts',
      'Comedy & Standup',
      'Art & Exhibitions',
      'Food & Culinary',
      'Workshops',
      'Networking'
    ]
  },

  eventFormat: {
    type: 'multi-select',
    label: 'Event Format',
    options: ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation']
  },

  targetAudience: {
    type: 'multi-select',
    label: 'Target Audience',
    options: ['Students', 'Young professionals', 'Founders / Creators', 'Families', 'Niche community'],
    allowCustom: true
  },

  city: {
    type: 'select',
    label: 'City',
    options: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Any City']
  },

  // ═══════════════════════════════════════
  // VENUE REQUIREMENTS (communityToVenue)
  // Matches RequirementsSection.jsx exactly
  // ═══════════════════════════════════════
  spaceOnly: {
    type: 'selectable-card',
    label: 'Space Only',
    description: 'Just the venue space, nothing else',
    subOptions: [
      { id: 'venue_space', label: 'Venue Space' }
    ]
  },

  seating: {
    type: 'selectable-card',
    label: 'Seating / Layout Support',
    description: 'Tables, chairs, and arrangement help',
    subOptions: [
      { id: 'tables', label: 'Tables' },
      { id: 'chairs', label: 'Chairs' },
      { id: 'arrangement', label: 'Arrangement Help' }
    ]
  },

  barFood: {
    type: 'selectable-card',
    label: 'Bar / Food Service',
    description: 'Food and beverages for attendees',
    subOptions: [
      { id: 'food', label: 'Food' },
      { id: 'beverages', label: 'Beverages' }
    ]
  },

  av: {
    type: 'selectable-card',
    label: 'Audio / Visual Equipment',
    description: 'Mics, speakers, projectors, lighting',
    subOptions: [
      { id: 'mic', label: 'Mic' },
      { id: 'speakers', label: 'Speakers' },
      { id: 'projector', label: 'Projector / Screen' },
      { id: 'lighting', label: 'Lighting' }
    ]
  },

  production: {
    type: 'selectable-card',
    label: 'Production & Event Setup',
    description: 'Stage, decor, staff, entry desk',
    subOptions: [
      { id: 'stage', label: 'Stage' },
      { id: 'decor', label: 'Decor' },
      { id: 'staff', label: 'Staff' },
      { id: 'entry_desk', label: 'Entry Desk' }
    ]
  },

  // Also map audioVisual to av for backward compat
  audioVisual: {
    type: 'selectable-card',
    label: 'Audio / Visual Equipment',
    description: 'Mics, speakers, projectors, lighting',
    subOptions: [
      { id: 'mic', label: 'Mic' },
      { id: 'speakers', label: 'Speakers' },
      { id: 'projector', label: 'Projector / Screen' },
      { id: 'lighting', label: 'Lighting' }
    ]
  },

  // ═══════════════════════════════════════
  // BRAND DELIVERABLES (communityToBrand)
  // Matches BrandDeliverablesSection.jsx
  // ═══════════════════════════════════════
  logoPlacement: {
    type: 'selectable-card',
    label: 'Logo Placement',
    description: 'Brand logo on event materials',
    subOptions: [
      { id: 'posters', label: 'Posters' },
      { id: 'banners', label: 'Banners' },
      { id: 'tickets', label: 'Tickets' },
      { id: 'social_media', label: 'Social Media' }
    ]
  },

  onGroundBranding: {
    type: 'selectable-card',
    label: 'On-ground Branding',
    description: 'Physical branding at the event venue',
    subOptions: [
      { id: 'stage_backdrop', label: 'Stage Backdrop' },
      { id: 'standees', label: 'Standees' },
      { id: 'booth', label: 'Booth Space' }
    ]
  },

  sampling: {
    type: 'selectable-card',
    label: 'Sampling / Product Demo',
    description: 'Distribute products or samples to attendees',
    subOptions: [
      { id: 'product_samples', label: 'Product Samples' },
      { id: 'demo_booth', label: 'Demo Booth' }
    ]
  },

  sponsoredSegments: {
    type: 'selectable-card',
    label: 'Sponsored Segments',
    description: 'Dedicated time slots for brand activities',
    subOptions: [
      { id: 'speaking_slot', label: 'Speaking Slot' },
      { id: 'game_activity', label: 'Game/Activity' },
      { id: 'performance', label: 'Performance' }
    ]
  },

  speaking: {
    type: 'selectable-card',
    label: 'Speaking / Stage Integration',
    description: 'Brand representative speaking opportunity',
    subOptions: [
      { id: 'welcome_address', label: 'Welcome Address' },
      { id: 'panel_discussion', label: 'Panel Discussion' },
      { id: 'workshop_hosting', label: 'Workshop Hosting' }
    ]
  },

  digitalShoutouts: {
    type: 'selectable-card',
    label: 'Digital Shoutouts',
    description: 'Online promotion and mentions',
    subOptions: [
      { id: 'instagram_posts', label: 'Instagram Posts' },
      { id: 'stories', label: 'Stories' },
      { id: 'reels', label: 'Reels' },
      { id: 'email_mention', label: 'Email Mention' }
    ]
  },

  leadCapture: {
    type: 'selectable-card',
    label: 'Lead Capture',
    description: 'Collect attendee information',
    subOptions: [
      { id: 'registration_data', label: 'Registration Data' },
      { id: 'booth_signup', label: 'Booth Signup' },
      { id: 'survey', label: 'Survey' }
    ]
  },

  // ═══════════════════════════════════════
  // PRICING & PAYMENT
  // Matches PricingSection.jsx exactly
  // ═══════════════════════════════════════

  // Venue pricing (communityToVenue)
  revenueShare: {
    type: 'pricing-model',
    label: 'Revenue Share',
    description: 'Share a percentage of ticket sales',
    inputType: 'percentage',
    options: ['20%', '30%', '40%', 'Open to discussion']
  },

  flatRental: {
    type: 'pricing-model',
    label: 'Flat Rental Fee',
    description: 'Pay a fixed amount to rent the space',
    inputType: 'amount',
    placeholder: 'Enter amount'
  },

  coverCharge: {
    type: 'pricing-model',
    label: 'Cover Charge per Person',
    description: 'Pay the venue a fixed amount per attendee',
    inputType: 'amount',
    placeholder: 'Enter amount per person'
  },

  // Brand pricing (communityToBrand)
  cashSponsorship: {
    type: 'pricing-model',
    label: 'Cash Sponsorship',
    description: 'Fixed monetary sponsorship amount',
    inputType: 'amount',
    placeholder: 'Enter sponsorship amount'
  },

  barter: {
    type: 'pricing-model',
    label: 'Barter / In-Kind',
    description: 'Products, prizes, vouchers, or services',
    inputType: 'text',
    placeholder: 'Describe the barter (e.g., "50 product samples + 10 vouchers")'
  },

  stallCost: {
    type: 'pricing-model',
    label: 'Stall/Booth Fee',
    description: 'Booth or sales space rental at the event',
    inputType: 'amount',
    placeholder: 'Enter stall cost'
  },

  // ═══════════════════════════════════════
  // BRAND OFFERS/EXPECTATIONS (brandToCommunity)
  // ═══════════════════════════════════════
  cash: {
    type: 'selectable-card',
    label: 'Cash Offer',
    description: 'Monetary sponsorship',
    subOptions: [
      { id: 'upfront_payment', label: 'Upfront Payment' },
      { id: 'milestone_based', label: 'Milestone Based' },
      { id: 'post_event_payment', label: 'Post Event Payment' }
    ]
  },

  coMarketing: {
    type: 'selectable-card',
    label: 'Co-Marketing',
    description: 'Joint marketing efforts',
    subOptions: [
      { id: 'social_media_promotion', label: 'Social Media Promotion' },
      { id: 'email_blast', label: 'Email Blast' },
      { id: 'blog_feature', label: 'Blog Feature' },
      { id: 'press_release', label: 'Press Release' }
    ]
  },

  content: {
    type: 'selectable-card',
    label: 'Content Support',
    description: 'Content creation and assets',
    subOptions: [
      { id: 'photography', label: 'Photography' },
      { id: 'videography', label: 'Videography' },
      { id: 'graphic_design', label: 'Graphic Design' },
      { id: 'social_media_content', label: 'Social Media Content' }
    ]
  },

  branding: {
    type: 'selectable-card',
    label: 'Branding',
    description: 'Brand visibility at event',
    subOptions: [
      { id: 'logo_placement', label: 'Logo Placement' },
      { id: 'banner_display', label: 'Banner Display' },
      { id: 'stage_branding', label: 'Stage Branding' },
      { id: 'merchandise', label: 'Merchandise' }
    ]
  },

  sponsoredSegment: {
    type: 'selectable-card',
    label: 'Sponsored Segment / Naming Rights',
    description: 'Title sponsor, session sponsor',
    subOptions: [
      { id: 'title_sponsor', label: 'Title Sponsor' },
      { id: 'session_sponsor', label: 'Session Sponsor' },
      { id: 'activity_sponsor', label: 'Activity Sponsor' }
    ]
  },

  exclusivity: {
    type: 'selectable-card',
    label: 'Exclusivity',
    description: 'Category exclusivity at the event',
    subOptions: []
  },

  contentRights: {
    type: 'selectable-card',
    label: 'Content Rights',
    description: 'Rights to event content',
    subOptions: [
      { id: 'photo_rights', label: 'Photo Rights' },
      { id: 'video_rights', label: 'Video Rights' },
      { id: 'testimonial_rights', label: 'Testimonial Rights' },
      { id: 'brand_story_rights', label: 'Brand Story Rights' }
    ]
  },

  salesBooth: {
    type: 'selectable-card',
    label: 'Sales Booth / Sampling Rights',
    description: 'Space for sales or product sampling',
    subOptions: [
      { id: 'sales_booth', label: 'Sales Booth' },
      { id: 'sampling_space', label: 'Sampling Space' },
      { id: 'demo_area', label: 'Demo Area' }
    ]
  },

  // ═══════════════════════════════════════
  // CAMPAIGN SNAPSHOT (brandToCommunity)
  // ═══════════════════════════════════════
  campaignObjectives: {
    type: 'selectable-card',
    label: 'Campaign Objectives',
    subOptions: [
      { id: 'awareness', label: 'Brand Awareness' },
      { id: 'trials', label: 'Product Trials' },
      { id: 'leads', label: 'Lead Generation' },
      { id: 'sales', label: 'Direct Sales' },
      { id: 'engagement', label: 'Community Engagement' }
    ]
  },

  preferredFormats: {
    type: 'multi-select',
    label: 'Preferred Formats',
    options: ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation']
  },

  timeline: {
    type: 'daterange',
    label: 'Timeline'
  },

  // ═══════════════════════════════════════
  // AUDIENCE PROOF - Read Only
  // ═══════════════════════════════════════
  pastSponsorBrands: {
    type: 'readonly',
    label: 'Past Sponsor Brands'
  },

  averageAttendance: {
    type: 'readonly',
    label: 'Average Attendance'
  },

  communitySize: {
    type: 'readonly',
    label: 'Community Size'
  },

  repeatEventRate: {
    type: 'readonly',
    label: 'Repeat Event Rate'
  }
};

export function getFieldDefinition(fieldName) {
  return FIELD_DEFINITIONS[fieldName] || {
    type: 'text',
    label: fieldName.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())
  };
}

/**
 * Get the selected sub-option labels from a sub-options object
 * Handles {key: {selected: true}} and {key: true} formats
 */
export function getSelectedSubOptionLabels(fieldName, value) {
  const def = getFieldDefinition(fieldName);
  if (!def.subOptions || !value || typeof value !== 'object') return [];

  return Object.entries(value)
    .filter(([k, v]) => {
      if (typeof v === 'object' && v !== null) return v.selected === true;
      return v === true;
    })
    .map(([k]) => {
      // Try to find a label from the field definition's subOptions
      const subOpt = def.subOptions?.find(s => s.id === k);
      if (subOpt) return subOpt.label;
      // Fallback: format the key
      return k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    });
}

export function formatFieldValue(fieldName, value) {
  if (value === null || value === undefined) return 'Not set';
  
  const definition = getFieldDefinition(fieldName);
  
  if (definition.type === 'readonly') {
    return String(value);
  }
  
  if (definition.type === 'selectable-card' || definition.type === 'checkbox-group') {
    if (typeof value === 'object' && !Array.isArray(value)) {
      const labels = getSelectedSubOptionLabels(fieldName, value);
      return labels.length > 0 ? labels.join(', ') : 'Not set';
    }
    if (value === true) return 'Selected';
    return String(value);
  }

  if (definition.type === 'pricing-model') {
    if (typeof value === 'object' && value !== null) {
      if (value.selected) return value.value || 'Selected';
      return 'Not set';
    }
    if (value === true) return 'Selected';
    return String(value);
  }
  
  if (definition.type === 'multi-select' && Array.isArray(value)) {
    return value.join(', ');
  }
  
  if ((definition.type === 'daterange' || definition.type === 'event-datetime') && typeof value === 'object') {
    const parts = [];
    if (value.date) parts.push(value.date);
    if (value.startDate) parts.push(`From: ${value.startDate}`);
    if (value.endDate) parts.push(`To: ${value.endDate}`);
    if (value.startTime) parts.push(value.startTime);
    if (value.endTime) parts.push(`- ${value.endTime}`);
    if (value.flexible) parts.push('(Flexible)');
    return parts.length > 0 ? parts.join(' ') : 'Not set';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

export function formatOptionLabel(option) {
  if (!option) return '';
  return option.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
