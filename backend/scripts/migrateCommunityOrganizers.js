const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
require('dotenv').config();

/**
 * Migration Script: Community Organizer Setup
 * 
 * This script will:
 * 1. Delete all existing communities
 * 2. Find all community organizer accounts
 * 3. Create a community for each organizer with dummy data
 * 4. Populate communityProfile if missing
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const migrateCommunityOrganizers = async () => {
  try {
    console.log('\n🚀 Starting Community Organizer Migration...\n');

    // Step 1: Delete all existing communities
    console.log('📌 Step 1: Deleting all existing communities...');
    const deleteResult = await Community.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing communities\n`);

    // Step 2: Find all community organizer accounts
    console.log('📌 Step 2: Finding all community organizer accounts...');
    const organizers = await User.find({
      role: 'host_partner',
      hostPartnerType: 'community_organizer'
    });
    console.log(`✅ Found ${organizers.length} community organizer accounts\n`);

    if (organizers.length === 0) {
      console.log('⚠️  No community organizers found. Migration complete.');
      return;
    }

    // Step 3: Create communities for each organizer
    console.log('📌 Step 3: Creating communities for each organizer...\n');
    
    const categories = [
      'Music & Performance',
      'Art & DIY',
      'Social Mixers',
      'Sweat & Play',
      'Sip & Savor',
      'Adventure & Outdoors',
      'Epic Screenings',
      'Indoor & Board Games'
    ];

    const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

    let createdCount = 0;
    let updatedCount = 0;

    for (const organizer of organizers) {
      try {
        // Check if community already exists
        const existingCommunity = await Community.findOne({ host: organizer._id });
        if (existingCommunity) {
          console.log(`⏭️  Skipping ${organizer.name} - Community already exists`);
          continue;
        }

        // Get or create community profile data
        let communityName = organizer.communityProfile?.communityName || `${organizer.name}'s Community`;
        let communityDescription = organizer.communityProfile?.communityDescription || 
          `Welcome to ${communityName}! Join us for exciting events and experiences.`;
        let primaryCategory = organizer.communityProfile?.primaryCategory || 
          categories[Math.floor(Math.random() * categories.length)];
        let city = organizer.communityProfile?.city || organizer.location?.city || 
          cities[Math.floor(Math.random() * cities.length)];

        // Update user's communityProfile if it's missing or incomplete
        if (!organizer.communityProfile || !organizer.communityProfile.communityName) {
          organizer.communityProfile = {
            communityName: communityName,
            primaryCategory: primaryCategory,
            communityType: 'open',
            contactPerson: {
              name: organizer.name,
              email: organizer.email,
              phone: organizer.phoneNumber || ''
            },
            communityDescription: communityDescription,
            instagram: '',
            facebook: '',
            website: '',
            pastEventPhotos: [],
            pastEventExperience: '0-5',
            typicalAudienceSize: '20-50',
            established: new Date(),
            memberCount: 1
          };
          
          organizer.onboardingCompleted = true;
          await organizer.save();
          updatedCount++;
        }

        // Create the community
        const newCommunity = new Community({
          name: communityName,
          description: communityDescription,
          shortDescription: communityDescription.substring(0, 200),
          category: primaryCategory,
          host: organizer._id,
          isPrivate: organizer.communityProfile?.communityType === 'curated' ? true : false,
          location: {
            city: city,
            state: organizer.location?.state || 'Maharashtra',
            country: organizer.location?.country || 'India'
          },
          socialLinks: {
            instagram: organizer.communityProfile?.instagram || '',
            facebook: organizer.communityProfile?.facebook || '',
            website: organizer.communityProfile?.website || ''
          },
          images: organizer.communityProfile?.pastEventPhotos || [],
          coverImage: organizer.communityProfile?.pastEventPhotos?.[0] || null,
          members: [{
            user: organizer._id,
            joinedAt: new Date(),
            role: 'admin'
          }],
          tags: [primaryCategory.toLowerCase(), 'community', 'events', city.toLowerCase()],
          stats: {
            totalEvents: 0,
            totalMembers: 1,
            averageRating: 0
          },
          isActive: true,
          forum: [],
          testimonials: [],
          guidelines: `Welcome to ${communityName}!\n\n` +
            `1. Be respectful and kind to all members\n` +
            `2. Stay on topic and keep discussions relevant\n` +
            `3. No spam or self-promotion without permission\n` +
            `4. Have fun and make new connections!`
        });

        await newCommunity.save();
        createdCount++;

        console.log(`✅ Created community for ${organizer.name} (${organizer.email})`);
        console.log(`   - Community Name: ${communityName}`);
        console.log(`   - Category: ${primaryCategory}`);
        console.log(`   - Location: ${city}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Error creating community for ${organizer.name}:`, error.message);
      }
    }

    console.log('\n🎉 Migration Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Communities created: ${createdCount}`);
    console.log(`   - User profiles updated: ${updatedCount}`);
    console.log(`   - Total organizers: ${organizers.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const run = async () => {
  try {
    await connectDB();
    await migrateCommunityOrganizers();
    console.log('✅ Migration script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }
};

run();
