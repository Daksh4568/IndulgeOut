/**
 * Migration Script: Convert Event Times from 24-hour to 12-hour AM/PM Format
 * 
 * This script converts all event startTime and endTime fields from 24-hour format (HH:mm)
 * to 12-hour format with AM/PM (hh:mm AM/PM).
 * 
 * Usage: node scripts/migrateEventTimeTo12Hour.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Event = require('../models/Event');

/**
 * Convert 24-hour format to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns {string} Time in 12-hour format (e.g., "02:30 PM", "09:00 AM")
 */
function convert24To12Hour(time24) {
  if (!time24) return '';
  
  // Already in 12-hour format
  if (time24.includes('AM') || time24.includes('PM')) {
    console.log(`   ⏭️  Already in 12-hour format: ${time24}`);
    return time24;
  }
  
  const [hours24Str, minutesStr] = time24.split(':');
  const hours24 = parseInt(hours24Str, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (isNaN(hours24) || isNaN(minutes)) {
    console.log(`   ⚠️  Invalid time format: ${time24}`);
    return time24;
  }
  
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

async function migrateEventTimes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all events with startTime and endTime
    console.log('🔍 Finding events with times to migrate...');
    const events = await Event.find({
      $or: [
        { startTime: { $exists: true, $ne: '' } },
        { endTime: { $exists: true, $ne: '' } }
      ]
    });

    console.log(`📊 Found ${events.length} events to check\n`);

    let migrated = 0;
    let alreadyMigrated = 0;
    let errors = 0;

    for (const event of events) {
      console.log(`📅 Event: "${event.title}" (ID: ${event._id})`);
      console.log(`   Current startTime: ${event.startTime}`);
      console.log(`   Current endTime: ${event.endTime}`);

      let needsUpdate = false;
      const updates = {};

      // Check and convert startTime
      if (event.startTime && !event.startTime.includes('AM') && !event.startTime.includes('PM')) {
        const newStartTime = convert24To12Hour(event.startTime);
        if (newStartTime !== event.startTime) {
          updates.startTime = newStartTime;
          needsUpdate = true;
          console.log(`   ✅ Converting startTime: ${event.startTime} → ${newStartTime}`);
        }
      } else if (event.startTime) {
        console.log(`   ⏭️  startTime already in 12-hour format`);
        alreadyMigrated++;
      }

      // Check and convert endTime
      if (event.endTime && !event.endTime.includes('AM') && !event.endTime.includes('PM')) {
        const newEndTime = convert24To12Hour(event.endTime);
        if (newEndTime !== event.endTime) {
          updates.endTime = newEndTime;
          needsUpdate = true;
          console.log(`   ✅ Converting endTime: ${event.endTime} → ${newEndTime}`);
        }
      } else if (event.endTime) {
        console.log(`   ⏭️  endTime already in 12-hour format`);
      }

      // Update the event if needed
      if (needsUpdate) {
        try {
          await Event.findByIdAndUpdate(event._id, updates);
          console.log(`   💾 Event updated successfully`);
          migrated++;
        } catch (updateError) {
          console.error(`   ❌ Error updating event:`, updateError.message);
          errors++;
        }
      } else {
        console.log(`   ⏭️  No update needed`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migrated} events`);
    console.log(`   ⏭️  Already in 12-hour format: ${alreadyMigrated} events`);
    console.log(`   ❌ Errors: ${errors} events`);
    console.log(`   📄 Total processed: ${events.length} events`);

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the migration
console.log('🚀 Starting Event Time Migration (24h → 12h AM/PM)...\n');
migrateEventTimes();
