/**
 * Fix Event currentParticipants field
 * 
 * USE CASE: Recalculate currentParticipants from actual tickets (excluding cancelled)
 * This ensures the database matches the actual bookings
 * 
 * HOW TO USE:
 * node scripts/fixCurrentParticipants.js
 * 
 * OR to fix a specific event:
 * node scripts/fixCurrentParticipants.js <EVENT_ID>
 * 
 * EXAMPLE:
 * node scripts/fixCurrentParticipants.js 699dfc3656a3e534bd0ff78f
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

async function fixCurrentParticipants() {
  try {
    const args = process.argv.slice(2);
    const specificEventId = args[0];

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    let events;
    if (specificEventId) {
      console.log(`🔧 Fixing currentParticipants for event: ${specificEventId}\n`);
      events = await Event.find({ _id: specificEventId });
      if (events.length === 0) {
        console.log('❌ Event not found');
        process.exit(1);
      }
    } else {
      console.log('🔧 Fixing currentParticipants for ALL events...\n');
      events = await Event.find({});
    }

    let fixedCount = 0;
    let noChangeCount = 0;

    for (const event of events) {
      // Get all tickets for this event (excluding cancelled)
      const tickets = await Ticket.find({ 
        event: event._id, 
        status: { $ne: 'cancelled' } 
      });

      // Calculate correct currentParticipants (sum of all ticket quantities)
      const correctParticipants = tickets.reduce((sum, ticket) => {
        return sum + (ticket.quantity || 1);
      }, 0);

      const oldValue = event.currentParticipants || 0;

      if (oldValue !== correctParticipants) {
        // Update the event
        await Event.findByIdAndUpdate(event._id, {
          $set: { currentParticipants: correctParticipants }
        });

        console.log(`📊 ${event.title}`);
        console.log(`   Event ID: ${event._id}`);
        console.log(`   Old value: ${oldValue}`);
        console.log(`   New value: ${correctParticipants}`);
        console.log(`   Tickets: ${tickets.length} (${correctParticipants} total spots)`);
        console.log('   ✅ Fixed\n');
        
        fixedCount++;
      } else {
        console.log(`✓ ${event.title} - Already correct (${correctParticipants} participants)`);
        noChangeCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Summary:');
    console.log(`   Total events checked: ${events.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   No change needed: ${noChangeCount}`);
    console.log('='.repeat(50));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCurrentParticipants();
