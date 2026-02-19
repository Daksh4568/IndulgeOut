const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User.js');

/**
 * Migration Script: Clean up ALL invalid/legacy data from user profiles
 * 
 * This script ONLY cleans invalid data - it does NOT populate new fields.
 * Users should fill in new fields through their profile page.
 * 
 * What this script cleans:
 * 1. preferredAudienceTypes - Removes old category values (keeps only: Students, Young Professionals, Founders/Creators, Families, Niche Community)
 * 2. preferredCategories - Clears array (users re-select from updated dropdown)
 * 3. preferredEventFormats - Clears array (users re-select from updated dropdown)
 * 4. category (Community) - Clears array (users re-select)
 * 5. primaryCategory (Community) - Clears string (users re-select)
 * 6. brandAssets → productPhotos - Migrates existing brand photos
 * 
 * Run with: node scripts/migrateUserProfiles.js
 */

async function migrateUserProfiles() {
  try {
    console.log('🔄 Starting complete profile data cleanup...');
    console.log('ℹ️  Removing ALL legacy category/format values. Users will re-select from updated dropdowns.\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const validAudienceTypes = ['Students', 'Young Professionals', 'Founders / Creators', 'Families', 'Niche Community'];

    for (const user of users) {
      try {
        let needsUpdate = false;
        const changes = [];

        // ========== COMMUNITY ORGANIZER CLEANUP ==========
        if (user.role === 'host_partner' && user.hostPartnerType === 'community_organizer' && user.communityProfile) {
          // Clean preferredAudienceTypes
          if (user.communityProfile.preferredAudienceTypes && user.communityProfile.preferredAudienceTypes.length > 0) {
            const oldValues = user.communityProfile.preferredAudienceTypes.filter(
              type => !validAudienceTypes.includes(type)
            );
            
            if (oldValues.length > 0) {
              user.communityProfile.preferredAudienceTypes = user.communityProfile.preferredAudienceTypes.filter(
                type => validAudienceTypes.includes(type)
              );
              needsUpdate = true;
              changes.push(`preferredAudienceTypes: removed ${oldValues.length} invalid values`);
            }
          }

          // Clear preferredCategories (has old category values)
          if (user.communityProfile.preferredCategories && user.communityProfile.preferredCategories.length > 0) {
            user.communityProfile.preferredCategories = [];
            needsUpdate = true;
            changes.push('preferredCategories: cleared for re-selection');
          }

          // Clear preferredEventFormats (has old category values)
          if (user.communityProfile.preferredEventFormats && user.communityProfile.preferredEventFormats.length > 0) {
            user.communityProfile.preferredEventFormats = [];
            needsUpdate = true;
            changes.push('preferredEventFormats: cleared for re-selection');
          }

          // Clear category array (has old category values)
          if (user.communityProfile.category && user.communityProfile.category.length > 0) {
            user.communityProfile.category = [];
            needsUpdate = true;
            changes.push('category: cleared for re-selection');
          }

          // Clear primaryCategory (has old category value)
          if (user.communityProfile.primaryCategory) {
            user.communityProfile.primaryCategory = undefined;
            needsUpdate = true;
            changes.push('primaryCategory: cleared for re-selection');
          }

          if (changes.length > 0) {
            console.log(`  🏘️  Community: ${user.name}`);
            changes.forEach(change => console.log(`     - ${change}`));
          }
        }

        // ========== VENUE CLEANUP ==========
        if (user.role === 'host_partner' && user.hostPartnerType === 'venue' && user.venueProfile) {
          // Clean preferredAudienceTypes
          if (user.venueProfile.preferredAudienceTypes && user.venueProfile.preferredAudienceTypes.length > 0) {
            const oldValues = user.venueProfile.preferredAudienceTypes.filter(
              type => !validAudienceTypes.includes(type)
            );
            
            if (oldValues.length > 0) {
              user.venueProfile.preferredAudienceTypes = user.venueProfile.preferredAudienceTypes.filter(
                type => validAudienceTypes.includes(type)
              );
              needsUpdate = true;
              changes.push(`preferredAudienceTypes: removed ${oldValues.length} invalid values`);
            }
          }

          // Clear preferredCategories
          if (user.venueProfile.preferredCategories && user.venueProfile.preferredCategories.length > 0) {
            user.venueProfile.preferredCategories = [];
            needsUpdate = true;
            changes.push('preferredCategories: cleared for re-selection');
          }

          // Clear preferredEventFormats
          if (user.venueProfile.preferredEventFormats && user.venueProfile.preferredEventFormats.length > 0) {
            user.venueProfile.preferredEventFormats = [];
            needsUpdate = true;
            changes.push('preferredEventFormats: cleared for re-selection');
          }

          if (changes.length > 0) {
            console.log(`  🏢 Venue: ${user.name}`);
            changes.forEach(change => console.log(`     - ${change}`));
          }
        }

        // ========== BRAND CLEANUP ==========
        if (user.role === 'host_partner' && user.hostPartnerType === 'brand_sponsor' && user.brandProfile) {
          // Migrate brandAssets to productPhotos
          if (user.brandProfile.brandAssets && user.brandProfile.brandAssets.length > 0 && (!user.brandProfile.productPhotos || user.brandProfile.productPhotos.length === 0)) {
            user.brandProfile.productPhotos = user.brandProfile.brandAssets.slice(0, 5); // Max 5
            needsUpdate = true;
            changes.push(`brandAssets → productPhotos: migrated ${user.brandProfile.brandAssets.length} photos`);
          }

          // Clean preferredAudienceTypes
          if (user.brandProfile.preferredAudienceTypes && user.brandProfile.preferredAudienceTypes.length > 0) {
            const oldValues = user.brandProfile.preferredAudienceTypes.filter(
              type => !validAudienceTypes.includes(type)
            );
            
            if (oldValues.length > 0) {
              user.brandProfile.preferredAudienceTypes = user.brandProfile.preferredAudienceTypes.filter(
                type => validAudienceTypes.includes(type)
              );
              needsUpdate = true;
              changes.push(`preferredAudienceTypes: removed ${oldValues.length} invalid values`);
            }
          }

          // Clear preferredCategories
          if (user.brandProfile.preferredCategories && user.brandProfile.preferredCategories.length > 0) {
            user.brandProfile.preferredCategories = [];
            needsUpdate = true;
            changes.push('preferredCategories: cleared for re-selection');
          }

          // Clear preferredEventFormats
          if (user.brandProfile.preferredEventFormats && user.brandProfile.preferredEventFormats.length > 0) {
            user.brandProfile.preferredEventFormats = [];
            needsUpdate = true;
            changes.push('preferredEventFormats: cleared for re-selection');
          }

          if (changes.length > 0) {
            console.log(`  🏷️  Brand: ${user.name}`);
            changes.forEach(change => console.log(`     - ${change}`));
          }
        }

        // Save if changes were made
        if (needsUpdate) {
          await user.save();
          updated++;
          console.log(`✅ Updated user: ${user.name} (${user.email})`);
        } else {
          skipped++;
        }

      } catch (error) {
        errors++;
        console.error(`❌ Error processing user ${user.email}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📦 Total: ${users.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateUserProfiles();
