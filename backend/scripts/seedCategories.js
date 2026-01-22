require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Category data from frontend constants
const CATEGORY_CLUSTERS = [
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
        color: 'from-pink-500 to-rose-500',
        order: 1
      },
      {
        id: 'epic-screenings',
        slug: 'epic-screenings',
        name: 'Epic Screenings',
        emoji: '🎬',
        descriptor: 'Movies. Together. Unforgettable.',
        subtext: 'Film screenings, watch parties & cinephiles',
        color: 'from-purple-500 to-pink-500',
        order: 2
      },
      {
        id: 'indoor-board-games',
        slug: 'indoor-board-games',
        name: 'Indoor & Board Games',
        emoji: '🎲',
        descriptor: 'Roll. Play. Win.',
        subtext: 'Board games, card nights & game cafés',
        color: 'from-orange-500 to-amber-500',
        order: 3
      },
      {
        id: 'battle-beats',
        slug: 'battle-beats',
        name: 'Battle of the Beats',
        emoji: '🎵',
        descriptor: 'DJ battles, music contests & showdowns',
        subtext: 'Music battles, rap cyphers & DJ clashes',
        color: 'from-red-500 to-pink-500',
        order: 4
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
        color: 'from-indigo-500 to-purple-500',
        order: 5
      },
      {
        id: 'open-mics-jams',
        slug: 'open-mics-jams',
        name: 'Open Mics & Jams',
        emoji: '🎤',
        descriptor: 'Play. Listen. Belong.',
        subtext: 'Indie musicians, listeners & jam lovers',
        color: 'from-violet-500 to-fuchsia-500',
        order: 6
      },
      {
        id: 'culture-heritage',
        slug: 'culture-heritage',
        name: 'Culture & Heritage',
        emoji: '🏛️',
        descriptor: 'Roots. Stories. Traditions.',
        subtext: 'Cultural events, festivals & heritage walks',
        color: 'from-amber-500 to-orange-500',
        order: 7
      },
      {
        id: 'underground-street',
        slug: 'underground-street',
        name: 'Underground & Street',
        emoji: '🎭',
        descriptor: 'Raw. Real. Unfiltered.',
        subtext: 'Street art, underground music & counterculture',
        color: 'from-gray-700 to-gray-900',
        order: 8
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
        color: 'from-green-500 to-emerald-500',
        order: 9
      },
      {
        id: 'adventure-outdoors',
        slug: 'adventure-outdoors',
        name: 'Adventure & Outdoors',
        emoji: '🏔️',
        descriptor: 'Explore. Discover. Wander.',
        subtext: 'Hiking, camping, treks & outdoor adventures',
        color: 'from-teal-500 to-cyan-500',
        order: 10
      },
      {
        id: 'mind-body-recharge',
        slug: 'mind-body-recharge',
        name: 'Mind & Body Recharge',
        emoji: '🧘',
        descriptor: 'Breathe. Heal. Restore.',
        subtext: 'Yoga, meditation, wellness & mindfulness',
        color: 'from-blue-400 to-indigo-400',
        order: 11
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
        color: 'from-blue-500 to-cyan-500',
        order: 12
      },
      {
        id: 'startup-connect',
        slug: 'startup-connect',
        name: 'Startup Connect',
        emoji: '🚀',
        descriptor: 'Build. Pitch. Scale.',
        subtext: 'Founders, investors & entrepreneurship',
        color: 'from-indigo-500 to-blue-500',
        order: 13
      },
      {
        id: 'tech-unplugged',
        slug: 'tech-unplugged',
        name: 'Tech Unplugged',
        emoji: '💻',
        descriptor: 'Code. Ship. Innovate.',
        subtext: 'Hackathons, tech meetups & developer community',
        color: 'from-cyan-500 to-teal-500',
        order: 14
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
        color: 'from-red-400 to-pink-400',
        order: 15
      },
      {
        id: 'immersive-experiential',
        slug: 'immersive-experiential',
        name: 'Immersive & Experiential',
        emoji: '✨',
        descriptor: 'Live. Feel. Experience.',
        subtext: 'Pop-ups, immersive theater & unique experiences',
        color: 'from-purple-400 to-pink-400',
        order: 16
      },
      {
        id: 'indie-bazaar',
        slug: 'indie-bazaar',
        name: 'Indie Bazaar',
        emoji: '🛍️',
        descriptor: 'Shop. Discover. Support Local.',
        subtext: 'Local markets, artisan fairs & indie vendors',
        color: 'from-yellow-500 to-orange-500',
        order: 17
      }
    ]
  },
  {
    id: 'legacy',
    name: 'Legacy Categories',
    color: 'from-gray-500 to-slate-500',
    categories: [
      {
        id: 'sip-savor',
        slug: 'sip-savor',
        name: 'Sip & Savor',
        emoji: '🍷',
        descriptor: 'Taste. Sip. Enjoy.',
        subtext: 'Food tastings, wine events & culinary experiences',
        color: 'from-red-500 to-orange-500',
        order: 18
      },
      {
        id: 'art-diy',
        slug: 'art-diy',
        name: 'Art & DIY',
        emoji: '🖌️',
        descriptor: 'Create. Craft. Express.',
        subtext: 'Art workshops, DIY projects & creative sessions',
        color: 'from-purple-500 to-pink-500',
        order: 19
      },
      {
        id: 'social-mixers',
        slug: 'social-mixers',
        name: 'Social Mixers',
        emoji: '🥂',
        descriptor: 'Mix. Meet. Celebrate.',
        subtext: 'Networking events, social gatherings & parties',
        color: 'from-pink-500 to-rose-500',
        order: 20
      },
      {
        id: 'music-performance',
        slug: 'music-performance',
        name: 'Music & Performance',
        emoji: '🎸',
        descriptor: 'Listen. Perform. Enjoy.',
        subtext: 'Live music, concerts & performances',
        color: 'from-indigo-500 to-purple-500',
        order: 21
      }
    ]
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Starting category seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing categories (optional - comment out if you want to keep existing data)
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Prepare categories for insertion
    const categoriesToInsert = [];
    
    CATEGORY_CLUSTERS.forEach(cluster => {
      cluster.categories.forEach(category => {
        categoriesToInsert.push({
          id: category.id,
          slug: category.slug,
          name: category.name,
          emoji: category.emoji,
          descriptor: category.descriptor,
          subtext: category.subtext,
          color: category.color,
          cluster: {
            id: cluster.id,
            name: cluster.name,
            color: cluster.color
          },
          order: category.order,
          isActive: true,
          analytics: {
            views: 0,
            clicks: 0,
            eventCount: 0,
            communityCount: 0,
            popularityScore: 0
          },
          seo: {
            title: `${category.name} - Discover ${category.subtext} | IndulgeOut`,
            description: `${category.descriptor} Join ${category.name} events and communities. ${category.subtext}`,
            keywords: [category.name, ...category.subtext.split(',').map(s => s.trim())]
          }
        });
      });
    });

    // Insert all categories
    const insertedCategories = await Category.insertMany(categoriesToInsert);
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Display summary
    console.log('\n📊 Category Summary:');
    const clusters = await Category.aggregate([
      {
        $group: {
          _id: '$cluster.name',
          count: { $sum: 1 },
          categories: { $push: '$name' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    clusters.forEach(cluster => {
      console.log(`\n${cluster._id} (${cluster.count} categories):`);
      cluster.categories.forEach(cat => console.log(`  - ${cat}`));
    });

    console.log('\n✨ Seeding completed successfully!');
    console.log('💡 You can now fetch categories from /api/categories');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedCategories();
