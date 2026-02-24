const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Event = require('../models/Event.js');

/**
 * Migration Script: Remove 'social' mood from events
 * 
 * This script removes or resets the 'mood' field from events to prevent
 * the confusing 'social' tag from appearing alongside actual category tags.
 * 
 * The mood field had a default value of 'social' which was being displayed
 * as a badge on event cards, causing confusion with the "Social Mixers" category.
 * 
 * Run with: node scripts/removeSocialMood.js
 */

async function removeSocialMood() {
  try {
    console.log('🔄 Starting removal of social mood from events...');
    console.log('ℹ️  This will unset the mood field from all events.\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all events
    const events = await Event.find({});
    console.log(`📊 Found ${events.length} events to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const event of events) {
      try {
        let needsUpdate = false;

        // Remove mood field if it exists
        if (event.mood) {
          console.log(`ℹ️  Event "${event.title}" has mood: ${event.mood}`);
          event.mood = undefined;
          needsUpdate = true;
        }

        // Save if changes were made (skip validation for old events)
        if (needsUpdate) {
          await event.save({ validateBeforeSave: false });
          updated++;
          console.log(`✅ Removed mood from: ${event.title}`);
        } else {
          skipped++;
        }

      } catch (err) {
        errors++;
        console.error(`❌ Error processing event "${event.title}":`, err.message);
        // Continue with next event
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} events`);
    console.log(`⏭️  Skipped (no mood): ${skipped} events`);
    console.log(`❌ Errors: ${errors} events`);
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('ℹ️  Note: The mood field has been removed from all events.');
    console.log('ℹ️  Event cards will now only show the actual category tags.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
removeSocialMood();
