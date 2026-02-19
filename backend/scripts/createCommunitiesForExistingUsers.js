/**
 * Migration Script: Create Community documents for existing community_organizer users
 * 
 * This script:
 * 1. Finds all users with role='host_partner' and hostPartnerType='community_organizer'
 * 2. Checks if they already have a Community document
 * 3. Creates a Community document for those who don't have one
 * 
 * Usage: node scripts/createCommunitiesForExistingUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');

async function createCommunitiesForExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all community_organizer users
    const communityOrganizers = await User.find({
      role: 'host_partner',
      hostPartnerType: 'community_organizer'
    });

    console.log(`📊 Found ${communityOrganizers.length} community organizer users`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of communityOrganizers) {
      try {
        // Check if community already exists for this user
        const existingCommunity = await Community.findOne({ host: user._id });
        
        if (existingCommunity) {
          console.log(`⏭️  Skipping ${user.email} - Community already exists: ${existingCommunity.name}`);
          skipped++;
          continue;
        }

        // Extract community info from user profile
        const communityName = user.communityProfile?.communityName || `${user.name}'s Community`;
        const category = user.communityProfile?.category?.[0] || 'Social Mixers';
        const city = user.communityProfile?.city || 'Not specified';
        const instagram = user.communityProfile?.instagram || '';
        const photos = user.communityProfile?.pastEventPhotos || [];

        // Create Community document
        const communityData = {
          name: communityName,
          description: `Welcome to ${communityName}! Join us for exciting events and connect with like-minded people.`,
          shortDescription: `Join ${communityName} community`,
          category: category,
          host: user._id,
          location: {
            city: city,
            state: '',
            country: 'India'
          },
          images: photos,
          coverImage: photos.length > 0 ? photos[0] : null,
          isPrivate: false,
          memberLimit: 1000,
          socialMedia: {
            instagram: instagram
          }
        };

        const community = new Community(communityData);
        await community.save();
        
        console.log(`✅ Created community: ${communityName} for ${user.email}`);
        created++;

      } catch (error) {
        console.error(`❌ Error creating community for ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Created: ${created} communities`);
    console.log(`   ⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total processed: ${communityOrganizers.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the migration
createCommunitiesForExistingUsers();
