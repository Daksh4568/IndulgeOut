const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User.js');

/**
 * Migration Script: Remove preferredCollaborationTypes from ALL stakeholders
 * 
 * This script removes the preferredCollaborationTypes field from:
 * - Community Organizer profiles (communityProfile)
 * - Venue Partner profiles (venueProfile)
 * - Brand Sponsor profiles (brandProfile) - removes old selections so they can re-select
 * 
 * The field should ONLY exist for Brand Sponsors with the new values:
 * - Sponsorship
 * - Sampling
 * - Pop-ups
 * - Co-hosted events
 * 
 * Brands will need to re-select their collaboration types with the new options.
 * 
 * Run with: node scripts/cleanupCollaborationTypes.js
 */

async function cleanupCollaborationTypes() {
  try {
    console.log('🔄 Starting cleanup of preferredCollaborationTypes field...');
    console.log('ℹ️  Removing from ALL stakeholders (Community, Venue, Brand).');
    console.log('ℹ️  Brands will need to re-select collaboration types with new options.\n');
    
    // Check if MongoDB URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Masked password
    
    // Connect to MongoDB with timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log('✅ Connected to MongoDB');

    // Get all host partners
    const users = await User.find({ role: 'host_partner' });
    console.log(`📊 Found ${users.length} host partners to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        let needsUpdate = false;
        const changes = [];

        // ========== COMMUNITY ORGANIZER CLEANUP ==========
        if (user.hostPartnerType === 'community_organizer' && user.communityProfile) {
          if (user.communityProfile.preferredCollaborationTypes) {
            user.communityProfile.preferredCollaborationTypes = undefined;
            needsUpdate = true;
            changes.push('Removed preferredCollaborationTypes from communityProfile');
          }
        }

        // ========== VENUE PARTNER CLEANUP ==========
        if (user.hostPartnerType === 'venue' && user.venueProfile) {
          if (user.venueProfile.preferredCollaborationTypes) {
            user.venueProfile.preferredCollaborationTypes = undefined;
            needsUpdate = true;
            changes.push('Removed preferredCollaborationTypes from venueProfile');
          }
        }

        // ========== BRAND SPONSOR - REMOVE OLD SELECTIONS ==========
        if (user.hostPartnerType === 'brand' && user.brandProfile) {
          if (user.brandProfile.preferredCollaborationTypes && user.brandProfile.preferredCollaborationTypes.length > 0) {
            console.log(`ℹ️  Brand ${user.brandProfile.brandName || user.name}: Removing old collaboration types:`, user.brandProfile.preferredCollaborationTypes);
            user.brandProfile.preferredCollaborationTypes = [];
            needsUpdate = true;
            changes.push('Cleared old preferredCollaborationTypes from brandProfile (needs re-selection)');
          }
        }

        // Save if changes were made
        if (needsUpdate) {
          await user.save();
          updated++;
          console.log(`✅ Updated ${user.name} (${user.hostPartnerType}):`);
          changes.forEach(change => console.log(`   - ${change}`));
        } else {
          skipped++;
        }

      } catch (err) {
        errors++;
        console.error(`❌ Error processing user ${user.name}:`, err.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} users`);
    console.log(`⏭️  Skipped (no changes): ${skipped} users`);
    console.log(`❌ Errors: ${errors} users`);
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('ℹ️  Note: Brands need to update their collaboration types from profile page with new options:');
    console.log('   - Sponsorship');
    console.log('   - Sampling');
    console.log('   - Pop-ups');
    console.log('   - Co-hosted events');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('MongoDB Atlas') || error.message.includes('IP')) {
      console.error('\n🔧 TROUBLESHOOTING STEPS:');
      console.error('1. Check your IP is whitelisted in MongoDB Atlas:');
      console.error('   → Go to MongoDB Atlas → Network Access');
      console.error('   → Add your current IP or use 0.0.0.0/0 (allow all) for development');
      console.error('\n2. Ensure your MONGODB_URI includes the database name:');
      console.error('   → Format: mongodb+srv://user:pass@cluster.mongodb.net/DATABASE_NAME');
      console.error('   → Current URI format seems incomplete (missing /DATABASE_NAME)');
      console.error('\n3. Or skip this script - the schema changes are already applied!');
      console.error('   → Old collaboration types will be ignored by the frontend');
      console.error('   → Brands can select new types from profile page');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the migration
cleanupCollaborationTypes();
