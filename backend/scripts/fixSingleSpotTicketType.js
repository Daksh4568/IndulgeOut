/**
 * Fix tickets that have ticketType='group' but only 1 spot (quantity=1).
 * These should be ticketType='general' since they represent single-spot bookings.
 * Usage: node scripts/fixSingleSpotTicketType.js
 * Add --confirm to actually update: node scripts/fixSingleSpotTicketType.js --confirm
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

async function run() {
  const dryRun = !process.argv.includes('--confirm');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Find tickets with ticketType='group' and quantity=1
  const tickets = await Ticket.find({
    'metadata.ticketType': 'group',
    $or: [
      { quantity: 1 },
      { quantity: { $exists: false } }
    ]
  }).populate('event', 'title');

  console.log(`Found ${tickets.length} tickets with ticketType='group' and quantity=1\n`);

  if (tickets.length === 0) {
    console.log('Nothing to fix.');
    await mongoose.disconnect();
    return;
  }

  // Group by event for display
  const byEvent = {};
  for (const t of tickets) {
    const eventTitle = t.event?.title || 'Unknown Event';
    if (!byEvent[eventTitle]) byEvent[eventTitle] = [];
    byEvent[eventTitle].push(t);
  }

  for (const [eventTitle, eventTickets] of Object.entries(byEvent)) {
    console.log(`Event: ${eventTitle}`);
    for (const t of eventTickets) {
      console.log(`  Ticket ${t.ticketNumber || t._id} — qty=${t.quantity || 1}, type=group → general`);
    }
    console.log();
  }

  if (dryRun) {
    console.log('--- DRY RUN — no changes made ---');
    console.log('Run with --confirm to update tickets');
  } else {
    const result = await Ticket.updateMany(
      {
        'metadata.ticketType': 'group',
        $or: [
          { quantity: 1 },
          { quantity: { $exists: false } }
        ]
      },
      { $set: { 'metadata.ticketType': 'general' } }
    );
    console.log(`✅ Updated ${result.modifiedCount} tickets from 'group' to 'general'`);
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
