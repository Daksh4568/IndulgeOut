/**
 * Script to delete event "Whitefield lo Telugu jamming" 
 * hosted by nakkasrikrishnachaitanya@gmail.com
 * 
 * Usage: node scripts/deleteEvent.js
 * Add --confirm flag to actually delete: node scripts/deleteEvent.js --confirm
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

const ORGANIZER_EMAIL = 'nakkasrikrishnachaitanya@gmail.com';
const EVENT_SLUG = 'whitefield-lo-telugu-jamming';

async function run() {
  const dryRun = !process.argv.includes('--confirm');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Find the organizer
  const organizer = await User.findOne({ email: ORGANIZER_EMAIL }).select('_id name email');
  if (!organizer) {
    console.log(`Organizer not found: ${ORGANIZER_EMAIL}`);
    process.exit(1);
  }
  console.log(`Organizer: ${organizer.name} (${organizer.email}) — ${organizer._id}`);

  // Find the event
  const event = await Event.findOne({ slug: EVENT_SLUG, organizer: organizer._id });
  if (!event) {
    console.log(`Event not found with slug "${EVENT_SLUG}" for this organizer`);
    process.exit(1);
  }

  console.log(`\nEvent found:`);
  console.log(`  Title: ${event.title}`);
  console.log(`  Slug: ${event.slug}`);
  console.log(`  Date: ${event.date}`);
  console.log(`  ID: ${event._id}`);
  console.log(`  Participants: ${event.currentParticipants || 0} / ${event.maxParticipants}`);

  // Check for tickets
  const tickets = await Ticket.find({ event: event._id });
  console.log(`  Tickets: ${tickets.length}`);

  if (tickets.length > 0) {
    console.log('\n⚠️  WARNING: This event has tickets. Deleting will also remove these tickets.');
    tickets.forEach(t => {
      console.log(`    - Ticket ${t._id} | User: ${t.user} | Status: ${t.status}`);
    });
  }

  if (dryRun) {
    console.log('\n--- DRY RUN — no changes made ---');
    console.log('Run with --confirm to actually delete:');
    console.log('  node scripts/deleteEvent.js --confirm');
  } else {
    // Delete tickets first
    if (tickets.length > 0) {
      const ticketResult = await Ticket.deleteMany({ event: event._id });
      console.log(`\nDeleted ${ticketResult.deletedCount} ticket(s)`);
    }

    // Delete the event
    await Event.findByIdAndDelete(event._id);
    console.log(`Deleted event: "${event.title}" (${event._id})`);
    console.log('\n✅ Done');
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
