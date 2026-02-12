require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Updated category data with only 6 categories
const SIMPLIFIED_CATEGORIES = [
    {
        id: 'social-mixers',
        slug: 'social-mixers',
        name: 'Social Mixers',
        emoji: '🎉',
        descriptor: 'Connect. Chat. Belong.',
        subtext: 'Speed friending, mixers & social hangouts',
        color: 'from-pink-500 to-rose-500',
        order: 1,
        cluster: {
            id: 'social',
            name: 'Social Events',
            color: 'from-pink-500 to-orange-500'
        }
    },
    {
        id: 'wellness-fitness-sports',
        slug: 'wellness-fitness-sports',
        name: 'Wellness, Fitness & Sports',
        emoji: '⚽',
        descriptor: 'Move. Compete. Thrive.',
        subtext: 'Yoga, sports leagues, fitness & wellness',
        color: 'from-green-500 to-emerald-500',
        order: 2,
        cluster: {
            id: 'active',
            name: 'Active & Wellness',
            color: 'from-green-500 to-teal-500'
        }
    },
    {
        id: 'art-music-dance',
        slug: 'art-music-dance',
        name: 'Art, Music & Dance',
        emoji: '🎨',
        descriptor: 'Create. Perform. Express.',
        subtext: 'Art workshops, live music, dance & creative events',
        color: 'from-purple-500 to-pink-500',
        order: 3,
        cluster: {
            id: 'creative',
            name: 'Creative & Culture',
            color: 'from-purple-500 to-blue-500'
        }
    },
    {
        id: 'immersive',
        slug: 'immersive',
        name: 'Immersive',
        emoji: '🎭',
        descriptor: 'Experience. Immerse. Transform.',
        subtext: 'Interactive experiences, escape rooms & immersive theater',
        color: 'from-indigo-500 to-purple-500',
        order: 4,
        cluster: {
            id: 'experience',
            name: 'Unique Experiences',
            color: 'from-indigo-500 to-violet-500'
        }
    },
    {
        id: 'food-beverage',
        slug: 'food-beverage',
        name: 'Food & Beverage',
        emoji: '🍷',
        descriptor: 'Taste. Sip. Savor.',
        subtext: 'Wine tastings, food tours & culinary experiences',
        color: 'from-orange-500 to-amber-500',
        order: 5,
        cluster: {
            id: 'culinary',
            name: 'Food & Drink',
            color: 'from-orange-500 to-red-500'
        }
    },
    {
        id: 'games',
        slug: 'games',
        name: 'Games',
        emoji: '🎲',
        descriptor: 'Play. Compete. Win.',
        subtext: 'Board games, card nights, video games & game cafés',
        color: 'from-blue-500 to-cyan-500',
        order: 6,
        cluster: {
            id: 'gaming',
            name: 'Gaming & Entertainment',
            color: 'from-blue-500 to-indigo-500'
        }
    }
];

async function migrateCategories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout');
        console.log('✅ Connected to MongoDB');

        // Delete all existing categories
        const deleteResult = await Category.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} old categories`);

        // Insert new simplified categories
        const categoriesToInsert = SIMPLIFIED_CATEGORIES.map(cat => ({
            ...cat,
            isActive: true,
            analytics: {
                views: 0,
                clicks: 0,
                eventCount: 0,
                communityCount: 0,
                popularityScore: 0
            },
            details: {
                whoIsThisFor: '',
                whatYouWillFind: '',
                popularTags: []
            },
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const result = await Category.insertMany(categoriesToInsert);
        console.log(`✅ Inserted ${result.length} new categories`);

        console.log('\n📋 Categories created:');
        result.forEach(cat => {
            console.log(`   ${cat.emoji} ${cat.name}`);
        });

        console.log('\n✅ Migration completed successfully!');
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error during migration:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}

migrateCategories();
