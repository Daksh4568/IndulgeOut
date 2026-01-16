// Host & Partner page content data

export const ROLE_CARDS = [
  {
    id: 'communities',
    title: 'Communities & Organizers',
    emoji: '👥',
    gradient: 'from-purple-500 to-pink-500',
    forWho: [
      'Communities',
      'Creators',
      'Curators', 
      'Event organizers'
    ],
    benefits: [
      'Host curated experiences that matter',
      'Reach the right audience, not mass crowds',
      'Collaborate with venues & brands',
      'Build engaged, loyal communities'
    ],
    metrics: [
      { value: '1,200+', label: 'Active Communities' },
      { value: '85%', label: 'Repeat Attendance' },
      { value: '4.8/5', label: 'Average Rating' }
    ],
    cta: {
      label: 'Host an Experience',
      link: '/register?role=host',
      secondary: 'Learn More'
    }
  },
  {
    id: 'venues',
    title: 'Venues',
    emoji: '🏢',
    gradient: 'from-blue-500 to-cyan-500',
    forWho: [
      'Cafés & Coffee Shops',
      'Bars & Restaurants',
      'Studios & Workshops',
      'Event spaces & Co-working'
    ],
    benefits: [
      'Get curated, high-quality footfall',
      'Monetize idle time slots',
      'Partner with engaged communities',
      'Fill your space with purpose-driven events'
    ],
    metrics: [
      { value: '150+', label: 'Partner Venues' },
      { value: '70%', label: 'Capacity Utilization' },
      { value: '₹25K', label: 'Avg. Monthly Revenue' }
    ],
    cta: {
      label: 'List Your Space',
      link: '/register?role=venue',
      secondary: 'See Examples'
    }
  },
  {
    id: 'brands',
    title: 'Brands & Sponsors',
    emoji: '🎯',
    gradient: 'from-orange-500 to-red-500',
    forWho: [
      'Lifestyle & Fashion brands',
      'Beverage & Food brands',
      'Tech & Innovation brands',
      'Local businesses'
    ],
    benefits: [
      'Engage niche audiences offline',
      'Sponsor meaningful experiences',
      'Activate in authentic contexts',
      'Build brand loyalty through experiences'
    ],
    metrics: [
      { value: '80+', label: 'Brand Partners' },
      { value: '3.5X', label: 'Higher Engagement' },
      { value: '92%', label: 'Partner Satisfaction' }
    ],
    cta: {
      label: 'Partner with IndulgeOut',
      link: '/register?role=partner',
      secondary: 'View Case Studies'
    }
  }
];

export const HOW_IT_WORKS = {
  communities: [
    {
      number: 1,
      title: 'Create Your Profile',
      description: 'Tell us about your community, interests, and the experiences you want to host',
      icon: '📝'
    },
    {
      number: 2,
      title: 'List Your Experience',
      description: 'Create events that resonate with your audience and set the right vibe',
      icon: '✨'
    },
    {
      number: 3,
      title: 'Reach the Right People',
      description: 'Get discovered by engaged audiences who truly care about your topic',
      icon: '🎯'
    },
    {
      number: 4,
      title: 'Host & Collaborate',
      description: 'Partner with venues and brands to create unforgettable experiences',
      icon: '🤝'
    }
  ],
  venues: [
    {
      number: 1,
      title: 'List Your Space',
      description: 'Add photos, amenities, capacity, and what makes your space unique',
      icon: '🏠'
    },
    {
      number: 2,
      title: 'Set Availability & Pricing',
      description: 'Control your calendar, set competitive rates, and manage bookings easily',
      icon: '📅'
    },
    {
      number: 3,
      title: 'Get Discovered',
      description: 'Connect with communities and organizers looking for the perfect venue',
      icon: '🔍'
    },
    {
      number: 4,
      title: 'Host Curated Events',
      description: 'Fill your space with engaged audiences and quality experiences',
      icon: '🎉'
    }
  ],
  brands: [
    {
      number: 1,
      title: 'Define Your Audience',
      description: 'Tell us about your target demographics and brand values',
      icon: '🎯'
    },
    {
      number: 2,
      title: 'Browse Experiences',
      description: 'Find events and communities that align with your brand identity',
      icon: '🔎'
    },
    {
      number: 3,
      title: 'Sponsor or Co-Create',
      description: 'Partner with communities and venues for authentic brand activations',
      icon: '🤝'
    },
    {
      number: 4,
      title: 'Activate Meaningfully',
      description: 'Engage audiences in contexts where your brand adds real value',
      icon: '✨'
    }
  ]
};

export const DIFFERENTIATORS = [
  {
    icon: '🎯',
    title: 'Interest-First Discovery',
    subtitle: 'Not random listings',
    description: 'Events and spaces get discovered by people who genuinely care about that interest, ensuring quality engagement.'
  },
  {
    icon: '👥',
    title: 'Curated Audiences',
    subtitle: 'Not mass reach',
    description: 'Reach engaged, niche communities instead of broad, disengaged crowds. Quality over quantity, always.'
  },
  {
    icon: '🤝',
    title: 'Offline-First',
    subtitle: 'Not content noise',
    description: 'We prioritize real-world connections and experiences over endless digital content and algorithms.'
  },
  {
    icon: '🌱',
    title: 'Community-Led',
    subtitle: 'Not brand-led',
    description: 'Communities drive the experiences, brands and venues support them authentically without being intrusive.'
  }
];

export const FAQS = [
  {
    id: 1,
    question: 'Who can host on IndulgeOut?',
    answer: 'Anyone with a meaningful experience idea — communities, creators, curators, event organizers. We welcome diverse hosts as long as the experience is authentic and interest-based. Whether you\'re hosting your first event or your hundredth, IndulgeOut provides the tools to succeed.'
  },
  {
    id: 2,
    question: 'Do I need a large following?',
    answer: 'No! We value quality over quantity. Small, focused communities often create the most memorable experiences. What matters is the depth of connection and authenticity, not follower count. Even micro-communities (20-50 people) thrive on IndulgeOut.'
  },
  {
    id: 3,
    question: 'How do venues get paid?',
    answer: 'Venues set their own rates and get paid directly for space bookings through our secure payment system. We handle processing, dispute resolution, and ensure timely payouts (typically within 3-5 business days after event completion).'
  },
  {
    id: 4,
    question: 'How do brand partnerships work?',
    answer: 'Brands can sponsor events, co-create experiences, or partner with communities that match their audience. We facilitate authentic partnerships where brands add value without disrupting the experience. Sponsorship packages are flexible and custom-tailored.'
  },
  {
    id: 5,
    question: 'What are the fees?',
    answer: 'For communities: Free to list events, we take a small percentage on paid tickets. For venues: Free listing, we charge a booking fee. For brands: Custom partnership packages based on scope. No hidden charges — pricing is transparent upfront.'
  },
  {
    id: 6,
    question: 'Is this platform curated?',
    answer: 'We\'re selectively curated to maintain quality, but open to diverse communities and experiences. Our review process ensures every experience meets our standards for authenticity, safety, and value. Most applications are approved within 24-48 hours.'
  }
];

export const SOCIAL_PROOF = {
  stats: [
    { value: '5,000+', label: 'Active Members' },
    { value: '500+', label: 'Monthly Events' },
    { value: '150+', label: 'Partner Venues' },
    { value: '80+', label: 'Brand Partners' }
  ],
  testimonials: [
    {
      quote: 'IndulgeOut helped us grow from 20 to 200 members in just 3 months. The platform makes it so easy to reach people who genuinely care.',
      author: 'Priya Sharma',
      role: 'Founder, Tech Coffee Mumbai',
      avatar: '👩‍💼'
    },
    {
      quote: 'We filled our empty afternoon slots with quality events. Our revenue increased by 40% and we built amazing community partnerships.',
      author: 'Rahul Mehta',
      role: 'Owner, The Loft Café',
      avatar: '👨‍💼'
    },
    {
      quote: 'Traditional advertising felt forced. Sponsoring IndulgeOut events lets us connect with our audience authentically.',
      author: 'Sarah Chen',
      role: 'Marketing Director, Urban Brew Co.',
      avatar: '👩'
    }
  ]
};
