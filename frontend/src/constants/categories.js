// Category data organized into 5 clusters
export const CATEGORY_CLUSTERS = [
  {
    id: 'social-fun',
    name: 'Social & Fun',
    color: 'from-pink-500 to-orange-500',
    categories: [
      {
        id: 'meet-mingle',
        slug: 'meet-mingle',
        name: 'Meet & Mingle',
        emoji: '🎉',
        descriptor: 'Chat. Laugh. Connect.',
        subtext: 'Social mixers, speed friending & hangouts',
        color: 'from-pink-500 to-rose-500'
      },
      {
        id: 'epic-screenings',
        slug: 'epic-screenings',
        name: 'Epic Screenings',
        emoji: '🎬',
        descriptor: 'Movies. Together. Unforgettable.',
        subtext: 'Film screenings, watch parties & cinephiles',
        color: 'from-purple-500 to-pink-500'
      },
      {
        id: 'indoor-board-games',
        slug: 'indoor-board-games',
        name: 'Indoor & Board Games',
        emoji: '🎲',
        descriptor: 'Roll. Play. Win.',
        subtext: 'Board games, card nights & game cafés',
        color: 'from-orange-500 to-amber-500'
      },
      {
        id: 'battle-beats',
        slug: 'battle-beats',
        name: 'Battle of the Beats',
        emoji: '🎵',
        descriptor: 'DJ battles, music contests & showdowns',
        subtext: 'Music battles, rap cyphers & DJ clashes',
        color: 'from-red-500 to-pink-500'
      }
    ]
  },
  {
    id: 'creative-culture',
    name: 'Creative & Culture',
    color: 'from-purple-500 to-blue-500',
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

// Flatten all categories for easy lookup
export const ALL_CATEGORIES = CATEGORY_CLUSTERS.flatMap(cluster => cluster.categories);

// Get category by slug
export const getCategoryBySlug = (slug) => {
  return ALL_CATEGORIES.find(cat => cat.slug === slug);
};

// Get cluster for a category
export const getClusterForCategory = (categorySlug) => {
  return CATEGORY_CLUSTERS.find(cluster => 
    cluster.categories.some(cat => cat.slug === categorySlug)
  );
};
