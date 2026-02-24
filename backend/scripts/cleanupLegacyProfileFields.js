const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Migration Script: Clean up legacy/unused profile fields
 * 
 * This script removes old/unused fields from user profiles that are no longer
 * part of the current profile structure. Users will need to update their profiles
 * with the new hosting preferences fields.
 * 
 * Fields to remove:
 * - Brand: pastActivations, budget (replaced by collaboration-specific details)
 * - Venue: eventSuitabilityTags, venueScales, oldImages (if any)
 * - Community: old category structures
 * 
 * Run with: node scripts/cleanupLegacyProfileFields.js
 */

const LEGACY_FIELDS_TO_REMOVE = {
  brandProfile: [
    'pastActivations',
    'budget',
    'images',
    'activationScale',
    'budgetRange',
    'brandCategory',
    'targetCity',
    'sponsorshipType',
    'collaborationIntent'
  ],
  venueProfile: [
    'eventSuitabilityTags',
    'venueScales',
    'images',
    'oldAvailability',
    'description' // Using venueDescription instead
  ],
  communityProfile: [
    'images',
    'oldCategories',
    'communitySize',
    'city',
    'category',
    'primaryCategory',
    'communityType',
    'pastEventExperience',
    'memberCount'
  ]
};

async function cleanupLegacyFields() {
  try {
    // Check if MONGODB_URI is present
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      console.log('\n📝 Troubleshooting steps:');
      console.log('1. Make sure you have a .env file in the backend directory');
      console.log('2. Add MONGODB_URI with your database name:');
      console.log('   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DATABASE_NAME');
      console.log('3. Check if your IP is whitelisted in MongoDB Atlas');
      process.exit(1);
    }

    // Log masked URI for debugging
    const maskedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`🔗 Connecting to: ${maskedUri}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    // ========== BRANDS CLEANUP ==========
    console.log('\n🏢 Checking Brand Profiles...');
    const brands = await User.find({ hostPartnerType: 'brand_sponsor' });
    console.log(`Found ${brands.length} brand profiles`);

    let brandsUpdated = 0;
    let brandsSkipped = 0;
    
    for (const brand of brands) {
      const updates = {};
      let hasLegacyFields = false;

      LEGACY_FIELDS_TO_REMOVE.brandProfile.forEach(field => {
        if (brand.brandProfile && brand.brandProfile[field] !== undefined) {
          updates[`brandProfile.${field}`] = 1;
          hasLegacyFields = true;
          console.log(`  📦 Brand "${brand.brandProfile.brandName}" has legacy field: ${field}`);
        }
      });

      if (hasLegacyFields) {
        await User.updateOne(
          { _id: brand._id },
          { $unset: updates }
        );
        brandsUpdated++;
        console.log(`  ✅ Cleaned up ${Object.keys(updates).length} legacy fields from "${brand.brandProfile.brandName}"`);
      } else {
        brandsSkipped++;
      }
    }

    console.log(`\n📊 Brand Summary: ${brandsUpdated} updated, ${brandsSkipped} skipped`);

    // ========== VENUES CLEANUP ==========
    console.log('\n🏛️ Checking Venue Profiles...');
    const venues = await User.find({ hostPartnerType: 'venue' });
    console.log(`Found ${venues.length} venue profiles`);

    let venuesUpdated = 0;
    let venuesSkipped = 0;
    
    for (const venue of venues) {
      const updates = {};
      let hasLegacyFields = false;

      LEGACY_FIELDS_TO_REMOVE.venueProfile.forEach(field => {
        if (venue.venueProfile && venue.venueProfile[field] !== undefined) {
          updates[`venueProfile.${field}`] = 1;
          hasLegacyFields = true;
          console.log(`  📦 Venue "${venue.venueProfile.venueName}" has legacy field: ${field}`);
        }
      });

      if (hasLegacyFields) {
        await User.updateOne(
          { _id: venue._id },
          { $unset: updates }
        );
        venuesUpdated++;
        console.log(`  ✅ Cleaned up ${Object.keys(updates).length} legacy fields from "${venue.venueProfile.venueName}"`);
      } else {
        venuesSkipped++;
      }
    }

    console.log(`\n📊 Venue Summary: ${venuesUpdated} updated, ${venuesSkipped} skipped`);

    // ========== COMMUNITIES CLEANUP ==========
    console.log('\n👥 Checking Community Profiles...');
    const communities = await User.find({ hostPartnerType: 'community_organizer' });
    console.log(`Found ${communities.length} community profiles`);

    let communitiesUpdated = 0;
    let communitiesSkipped = 0;
    
    for (const community of communities) {
      const updates = {};
      let hasLegacyFields = false;

      LEGACY_FIELDS_TO_REMOVE.communityProfile.forEach(field => {
        if (community.communityProfile && community.communityProfile[field] !== undefined) {
          updates[`communityProfile.${field}`] = 1;
          hasLegacyFields = true;
          console.log(`  📦 Community "${community.communityProfile.communityName}" has legacy field: ${field}`);
        }
      });

      if (hasLegacyFields) {
        await User.updateOne(
          { _id: community._id },
          { $unset: updates }
        );
        communitiesUpdated++;
        console.log(`  ✅ Cleaned up ${Object.keys(updates).length} legacy fields from "${community.communityProfile.communityName}"`);
      } else {
        communitiesSkipped++;
      }
    }

    console.log(`\n📊 Community Summary: ${communitiesUpdated} updated, ${communitiesSkipped} skipped`);

    // ========== FINAL SUMMARY ==========
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ LEGACY FIELD CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`🏢 Brands:      ${brandsUpdated} updated, ${brandsSkipped} already clean`);
    console.log(`🏛️ Venues:      ${venuesUpdated} updated, ${venuesSkipped} already clean`);
    console.log(`👥 Communities: ${communitiesUpdated} updated, ${communitiesSkipped} already clean`);
    console.log(`📊 Total:       ${brandsUpdated + venuesUpdated + communitiesUpdated} profiles cleaned`);
    console.log('='.repeat(60));

    if (brandsUpdated + venuesUpdated + communitiesUpdated > 0) {
      console.log('\n💡 Note: Users should update their profiles with new hosting preferences');
      console.log('   from the profile page. Browse pages will show updated data only.');
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n📝 Troubleshooting steps:');
      console.log('1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.log('2. Verify your MONGODB_URI is correct and includes the database name');
      console.log('3. Make sure your internet connection is stable');
      console.log('4. Try adding your IP to MongoDB Atlas Network Access');
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
cleanupLegacyFields();
