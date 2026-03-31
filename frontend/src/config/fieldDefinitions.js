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
      'Social Mixers',
      'Wellness, Fitness & Sports',
      'Art, Music & Dance',
      'Immersive',
      'Food & Beverage',
      'Games'
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
    options: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Kolkata', 'Any City', 'Others']
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
    description: 'Physical branding at the event',
    subOptions: [
      { id: 'stage_backdrop', label: 'Stage Backdrop' },
      { id: 'standees', label: 'Standees' },
      { id: 'booth', label: 'Entrance/Exit' }
    ]
  },

  sampling: {
    type: 'selectable-card',
    label: 'Product Sampling / Trials',
    description: 'Distribute products or samples to attendees',
    subOptions: []
  },

  sponsoredSegments: {
    type: 'selectable-card',
    label: 'Sponsored Segment / Exclusive Naming Rights',
    description: 'Title sponsor, session sponsor, or naming rights',
    subOptions: []
  },

  digitalShoutouts: {
    type: 'selectable-card',
    label: 'Digital Shoutouts',
    description: 'Online promotion and mentions',
    subOptions: [
      { id: 'instagram_posts', label: 'Instagram Posts' },
      { id: 'stories', label: 'Stories' },
      { id: 'reels', label: 'Reels' },
      { id: 'email_mention', label: 'WhatsApp/Email Mention' }
    ]
  },

  leadCapture: {
    type: 'selectable-card',
    label: 'Lead Capture / Registration Data',
    description: 'Collect attendee information for the brand',
    subOptions: []
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
    options: ['10%', '20%', '30%', '40%', '50%', 'Open to discussion']
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
    label: 'Cash Sponsorship',
    description: 'Direct monetary support',
    subOptions: [
      { id: 'fixed_amount', label: 'Fixed Amount' },
      { id: 'revenue_share', label: 'Revenue Share' }
    ]
  },

  coMarketing: {
    type: 'selectable-card',
    label: 'Co-Marketing',
    description: 'Joint promotional activities',
    subOptions: [
      { id: 'social_promotion', label: 'Social Media Promotion' },
      { id: 'email_blast', label: 'Email Blast' },
      { id: 'cross_promotion', label: 'Cross Promotion' }
    ]
  },

  content: {
    type: 'selectable-card',
    label: 'Content Support',
    description: 'Content creation and distribution',
    subOptions: [
      { id: 'photography', label: 'Photography' },
      { id: 'videography', label: 'Videography' },
      { id: 'social_content', label: 'Social Content' }
    ]
  },

  branding: {
    type: 'selectable-card',
    label: 'Branding',
    description: 'Brand visibility at event',
    subOptions: [
      { id: 'logo_posters', label: 'Logo on Posters' },
      { id: 'logo_digital', label: 'Logo on Digital' },
      { id: 'stage_branding', label: 'Stage Branding' }
    ]
  },

  sponsoredSegment: {
    type: 'selectable-card',
    label: 'Sponsored Segment / Exclusive Naming Rights',
    description: 'Title sponsor, session sponsor, or naming rights',
    subOptions: []
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
      { id: 'photos', label: 'Photos' },
      { id: 'videos', label: 'Videos' },
      { id: 'testimonials', label: 'Testimonials' }
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
      { id: 'brand_awareness', label: 'Brand Awareness' },
      { id: 'product_trials', label: 'Product Trials' },
      { id: 'lead_generation', label: 'Lead Generation' },
      { id: 'sales', label: 'Direct Sales' },
      { id: 'engagement', label: 'Community Engagement' }
    ]
  },

  preferredFormats: {
    type: 'multi-select',
    label: 'Preferred Formats',
    options: ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games']
  },

  timeline: {
    type: 'daterange',
    label: 'Timeline'
  },

  backupTimeline: {
    type: 'daterange',
    label: 'Backup Timeline'
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
    const formatDatePart = (d) => {
      if (typeof d === 'object' && d !== null) {
        const parts = [d.date || ''];
        if (d.startTime) parts.push(d.startTime);
        if (d.endTime) parts.push(`- ${d.endTime}`);
        return parts.join(' ');
      }
      return d || '';
    };
    const parts = [];
    if (value.date) parts.push(value.date);
    if (value.startDate) parts.push(`From: ${formatDatePart(value.startDate)}`);
    if (value.endDate) parts.push(`To: ${formatDatePart(value.endDate)}`);
    if (value.startTime && !value.startDate) parts.push(value.startTime);
    if (value.endTime && !value.startDate) parts.push(`- ${value.endTime}`);
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
