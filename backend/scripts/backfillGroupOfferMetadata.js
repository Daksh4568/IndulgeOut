/**
 * Backfill missing groupingOffer metadata on tickets.
 * Finds tickets with ticketType='group' but null tierPeople,
 * matches them to event groupingOffers tiers by quantity + basePrice.
 *
 * Usage: node scripts/backfillGroupOfferMetadata.js
 * Add --confirm to actually update: node scripts/backfillGroupOfferMetadata.js --confirm
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

async function run() {
  const dryRun = !process.argv.includes('--confirm');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Find tickets with group type but missing tierPeople
  const tickets = await Ticket.find({
    'metadata.ticketType': 'group',
    $or: [
      { 'metadata.tierPeople': null },
      { 'metadata.tierPeople': { $exists: false } }
    ]
  }).populate('event', 'title groupingOffers');

  console.log(`Found ${tickets.length} group tickets with missing tierPeople\n`);

  let updated = 0;
  for (const ticket of tickets) {
    const event = ticket.event;
    if (!event?.groupingOffers?.enabled || !event.groupingOffers.tiers?.length) {
      console.log(`  Ticket ${ticket._id} — event has no grouping offers, skipping`);
      continue;
    }

    // Match by quantity + basePrice
    const matchingTier = event.groupingOffers.tiers.find(
      t => t.people === ticket.quantity && t.price === ticket.metadata?.basePrice
    );

    if (!matchingTier) {
      console.log(`  Ticket ${ticket._id} — no matching tier for qty=${ticket.quantity}, price=${ticket.metadata?.basePrice}`);
      continue;
    }

    const label = matchingTier.label || `${matchingTier.people} ${matchingTier.people === 1 ? 'Person' : 'People'}`;
    console.log(`  Ticket ${ticket._id} → tierPeople=${matchingTier.people}, groupingOffer="${label}" (event: ${event.title})`);

    if (!dryRun) {
      await Ticket.updateOne(
        { _id: ticket._id },
        {
          $set: {
            'metadata.tierPeople': matchingTier.people,
            'metadata.groupingOffer': label
          }
        }
      );
      updated++;
    }
  }

  if (dryRun) {
    console.log('\n--- DRY RUN — no changes made ---');
    console.log('Run with --confirm to update tickets');
  } else {
    console.log(`\n✅ Updated ${updated} tickets`);
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
