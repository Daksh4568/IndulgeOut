/**
 * Hardcoded Event Categories for IndulgeOut
 * These 6 categories are the foundation of event organization
 */

export const CATEGORIES = [
  {
    id: 'social-mixers',
    name: 'Social Mixers',
    slug: 'social-mixers',
    description: 'Networking, Socializing, Ice-Breaker Events',
    color: '#7878E9', // Purple
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-indigo-600',
    image: '/images/categories/social-mixers.jpg',
    icon: '🎭',
    tags: ['networking', 'socializing', 'ice-breaker', 'meet-new-people']
  },
  {
    id: 'wellness-fitness-sports',
    name: 'Wellness, Fitness & Sports',
    slug: 'wellness-fitness-sports',
    description: 'Pillar, Energy, Adventurous, Internal Peace Sessions',
    color: '#FF6B35', // Orange
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-red-500',
    image: '/images/categories/wellness-fitness.jpg',
    icon: '💪',
    tags: ['wellness', 'fitness', 'sports', 'yoga', 'meditation', 'adventure']
  },
  {
    id: 'art-music-dance',
    name: 'Art, Music & Dance',
    slug: 'art-music-dance',
    description: 'Pop-Ups, Workshops, Jams',
    color: '#EC4899', // Pink
    gradientFrom: 'from-pink-400',
    gradientTo: 'to-purple-500',
    image: '/images/categories/art-music.jpg',
    icon: '🎨',
    tags: ['art', 'music', 'dance', 'workshops', 'creative', 'pop-ups']
  },
  {
    id: 'immersive',
    name: 'Immersive',
    slug: 'immersive',
    description: 'Festivals, Carnivals, Screenings & Expansive Experiential Events',
    color: '#8B5CF6', // Violet
    gradientFrom: 'from-violet-400',
    gradientTo: 'to-purple-600',
    image: '/images/categories/immersive.jpg',
    icon: '🎪',
    tags: ['festival', 'carnival', 'screening', 'experiential', 'immersive']
  },
  {
    id: 'food-beverage',
    name: 'Food & Beverage',
    slug: 'food-beverage',
    description: 'Cook Outs, Workshops, Food Tastings, Culinary Pop-Ups',
    color: '#10B981', // Green
    gradientFrom: 'from-green-400',
    gradientTo: 'to-emerald-600',
    image: '/images/categories/food-beverage.jpg',
    icon: '🍽️',
    tags: ['food', 'beverage', 'cooking', 'tasting', 'culinary', 'workshops']
  },
  {
    id: 'games',
    name: 'Games',
    slug: 'games',
    description: 'Board Games, Trivia, Quiz, Murder Mysteries, E-Sports, Indoor Sports',
    color: '#F59E0B', // Amber
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-600',
    image: '/images/categories/games.jpg',
    icon: '🎮',
    tags: ['games', 'trivia', 'quiz', 'board-games', 'e-sports', 'indoor']
  }
];

// OLD STRUCTURE - Kept for backward compatibility if needed
export const CATEGORY_CLUSTERS_OLD = [
  {
    id: 'social-fun',
    name: 'Social & Fun',
    color: 'from-pink-500 to-orange-500',
    categories: [
      {
        id: 'make-create',
        slug: 'make-create',
        name: 'Make & Create',
        emoji: '🎨',
        descriptor: 'Craft. Design. Build.',
        subtext: 'DIY workshops, art classes & maker spaces',
        color: 'from-indigo-500 to-purple-500'
      },
      {
        id: 'open-mics-jams',
        slug: 'open-mics-jams',
        name: 'Open Mics & Jams',
        emoji: '🎤',
        descriptor: 'Play. Listen. Belong.',
        subtext: 'Indie musicians, listeners & jam lovers',
        color: 'from-violet-500 to-fuchsia-500'
      },
      {
        id: 'culture-heritage',
        slug: 'culture-heritage',
        name: 'Culture & Heritage',
        emoji: '🏛️',
        descriptor: 'Roots. Stories. Traditions.',
        subtext: 'Cultural events, festivals & heritage walks',
        color: 'from-amber-500 to-orange-500'
      },
      {
        id: 'underground-street',
        slug: 'underground-street',
        name: 'Underground & Street',
        emoji: '🎭',
        descriptor: 'Raw. Real. Unfiltered.',
        subtext: 'Street art, underground music & counterculture',
        color: 'from-gray-700 to-gray-900'
      }
    ]
  },
  {
    id: 'active-outdoor',
    name: 'Active & Outdoor',
    color: 'from-green-500 to-teal-500',
    categories: [
      {
        id: 'sweat-play',
        slug: 'sweat-play',
        name: 'Sweat & Play',
        emoji: '⚽',
        descriptor: 'Move. Compete. Thrive.',
        subtext: 'Sports leagues, pickup games & fitness',
        color: 'from-green-500 to-emerald-500'
      },
      {
        id: 'adventure-outdoors',
        slug: 'adventure-outdoors',
        name: 'Adventure & Outdoors',
        emoji: '🏔️',
        descriptor: 'Explore. Discover. Wander.',
        subtext: 'Hiking, camping, treks & outdoor adventures',
        color: 'from-teal-500 to-cyan-500'
      },
      {
        id: 'mind-body-recharge',
        slug: 'mind-body-recharge',
        name: 'Mind & Body Recharge',
        emoji: '🧘',
        descriptor: 'Breathe. Heal. Restore.',
        subtext: 'Yoga, meditation, wellness & mindfulness',
        color: 'from-blue-400 to-indigo-400'
      }
    ]
  },
  {
    id: 'learn-build',
    name: 'Learn & Build',
    color: 'from-blue-500 to-indigo-500',
    categories: [
      {
        id: 'learn-network',
        slug: 'learn-network',
        name: 'Learn & Network',
        emoji: '📚',
        descriptor: 'Grow. Connect. Elevate.',
        subtext: 'Workshops, seminars & professional networking',
        color: 'from-blue-500 to-cyan-500'
      },
      {
        id: 'startup-connect',
        slug: 'startup-connect',
        name: 'Startup Connect',
        emoji: '🚀',
        descriptor: 'Build. Pitch. Scale.',
        subtext: 'Founders, investors & entrepreneurship',
        color: 'from-indigo-500 to-blue-500'
      },
      {
        id: 'tech-unplugged',
        slug: 'tech-unplugged',
        name: 'Tech Unplugged',
        emoji: '💻',
        descriptor: 'Code. Ship. Innovate.',
        subtext: 'Hackathons, tech meetups & developer community',
        color: 'from-cyan-500 to-teal-500'
      }
    ]
  },
  {
    id: 'purpose-experiences',
    name: 'Purpose & Experiences',
    color: 'from-yellow-500 to-orange-500',
    categories: [
      {
        id: 'make-difference',
        slug: 'make-difference',
        name: 'Make a Difference',
        emoji: '❤️',
        descriptor: 'Care. Serve. Impact.',
        subtext: 'Volunteering, social causes & community service',
        color: 'from-red-400 to-pink-400'
      },
      {
        id: 'immersive-experiential',
        slug: 'immersive-experiential',
        name: 'Immersive & Experiential',
        emoji: '✨',
        descriptor: 'Live. Feel. Experience.',
        subtext: 'Pop-ups, immersive theater & unique experiences',
        color: 'from-purple-400 to-pink-400'
      },
      {
        id: 'indie-bazaar',
        slug: 'indie-bazaar',
        name: 'Indie Bazaar',
        emoji: '🛍️',
        descriptor: 'Shop. Discover. Support Local.',
        subtext: 'Local markets, artisan fairs & indie vendors',
        color: 'from-yellow-500 to-orange-500'
      }
    ]
  },
  {
    id: 'legacy-categories',
    name: 'More Categories',
    color: 'from-gray-500 to-slate-500',
    categories: [
      {
        id: 'sip-savor',
        slug: 'sip-savor',
        name: 'Sip & Savor',
        emoji: '🍷',
        descriptor: 'Taste. Enjoy. Indulge.',
        subtext: 'Wine tastings, food tours & culinary experiences',
        color: 'from-red-500 to-rose-500'
      },
      {
        id: 'art-diy',
        slug: 'art-diy',
        name: 'Art & DIY',
        emoji: '🎨',
        descriptor: 'Create. Paint. Express.',
        subtext: 'Art workshops, DIY projects & creative sessions',
        color: 'from-blue-500 to-purple-500'
      },
      {
        id: 'social-mixers',
        slug: 'social-mixers',
        name: 'Social Mixers',
        emoji: '🎊',
        descriptor: 'Mix. Mingle. Connect.',
        subtext: 'Networking events, social gatherings & meetups',
        color: 'from-pink-500 to-orange-500'
      },
      {
        id: 'music-performance',
        slug: 'music-performance',
        name: 'Music & Performance',
        emoji: '🎸',
        descriptor: 'Play. Perform. Enjoy.',
        subtext: 'Live music, concerts & performance arts',
        color: 'from-purple-500 to-indigo-500'
      }
    ]
  }
];

/**
 * Helper Functions for Category Management
 */

/**
 * Get category by slug
 * @param {string} slug - Category slug (e.g., 'social-mixers')
 * @returns {Object|null} Category object or null if not found
 */
export const getCategoryBySlug = (slug) => {
  return CATEGORIES.find(cat => cat.slug === slug) || null;
};

/**
 * Get category by name
 * @param {string} name - Category name (e.g., 'Social Mixers')
 * @returns {Object|null} Category object or null if not found
 */
export const getCategoryByName = (name) => {
  return CATEGORIES.find(cat => cat.name === name) || null;
};

/**
 * Get all category names (for dropdowns, validation)
 * @returns {string[]} Array of category names
 */
export const getCategoryNames = () => {
  return CATEGORIES.map(cat => cat.name);
};

/**
 * Get category color by name
 * @param {string} name - Category name
 * @returns {string} Hex color code
 */
export const getCategoryColor = (name) => {
  const category = getCategoryByName(name);
  return category ? category.color : '#7878E9'; // Default purple
};

/**
 * Get category icon by name
 * @param {string} name - Category name
 * @returns {string} Emoji icon
 */
export const getCategoryIcon = (name) => {
  const category = getCategoryByName(name);
  return category ? category.icon : '🎉'; // Default party icon
};

/**
 * Get category gradient classes
 * @param {string} name - Category name
 * @returns {Object} Object with from and to gradient classes
 */
export const getCategoryGradient = (name) => {
  const category = getCategoryByName(name);
  return category 
    ? { from: category.gradientFrom, to: category.gradientTo }
    : { from: 'from-purple-400', to: 'to-indigo-600' };
};

// OLD STRUCTURE - Kept for backward compatibility
// Flatten all categories for easy lookup
export const ALL_CATEGORIES = CATEGORY_CLUSTERS_OLD?.flatMap(cluster => cluster.categories) || [];

// Get cluster for a category
export const getClusterForCategory = (categorySlug) => {
  return CATEGORY_CLUSTERS_OLD?.find(cluster => 
    cluster.categories.some(cat => cat.slug === categorySlug)
  );
};
