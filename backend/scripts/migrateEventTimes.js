const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('../models/Event');

/**
 * Migration Script: Add startTime and endTime to events that don't have them
 * 
 * This script:
 * 1. Finds events missing startTime/endTime fields
 * 2. Sets default times or parses from legacy 'time' field
 * 3. Updates all affected events
 */

const migrateEventTimes = async () => {
  try {
    console.log('🔄 Starting event time migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find events without startTime or endTime
    const eventsToUpdate = await Event.find({
      $or: [
        { startTime: { $exists: false } },
        { endTime: { $exists: false } },
        { startTime: null },
        { endTime: null },
        { startTime: '' },
        { endTime: '' }
      ]
    });

    console.log(`📊 Found ${eventsToUpdate.length} events to migrate\n`);

    if (eventsToUpdate.length === 0) {
      console.log('✅ All events already have startTime and endTime!\n');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const event of eventsToUpdate) {
      try {
        let startTime = '6:00 PM';
        let endTime = '11:00 PM';

        // Try to parse from legacy 'time' field if it exists
        if (event.time) {
          const timeParts = event.time.split('-').map(t => t.trim());
          if (timeParts.length === 2) {
            startTime = timeParts[0];
            endTime = timeParts[1];
            console.log(`  ⏰ Parsed time from legacy field: ${event.time}`);
          } else if (timeParts.length === 1) {
            // Single time, assume it's start time
            startTime = timeParts[0];
            endTime = '11:00 PM'; // Default end time
            console.log(`  ⏰ Using single time as start: ${event.time}`);
          }
        }

        // Update the event
        event.startTime = startTime;
        event.endTime = endTime;
        await event.save();

        console.log(`✅ Updated: ${event.title}`);
        console.log(`   📅 Date: ${event.date.toDateString()}`);
        console.log(`   ⏰ Time: ${startTime} - ${endTime}\n`);
        
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to update ${event.title}:`, err.message, '\n');
        failCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📋 Total processed: ${eventsToUpdate.length}\n`);

    console.log('✅ Migration completed!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
migrateEventTimes();
