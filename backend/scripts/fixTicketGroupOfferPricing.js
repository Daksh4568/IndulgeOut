/**
 * Fix Script: Correct ticket pricing data for group offer purchases
 * 
 * PROBLEM: Tickets created via webhook when global.pendingPaymentFees was lost
 * stored basePrice as getCurrentPrice() * quantity instead of the actual group offer price.
 * 
 * This script recalculates basePrice and priceAtPurchase from the actual payment amount
 * and the event's group offer tiers.
 * 
 * HOW TO USE:
 *   node scripts/fixTicketGroupOfferPricing.js <TICKET_NUMBER> [--dry-run]
 * 
 * EXAMPLES:
 *   node scripts/fixTicketGroupOfferPricing.js IND-MNPPBACZ-C3SC --dry-run
 *   node scripts/fixTicketGroupOfferPricing.js IND-MNPPBACZ-C3SC
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixTicketPricing(ticketNumber, dryRun = false) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Fix Group Offer Ticket Pricing`);
    console.log(`Ticket: ${ticketNumber}`);
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update DB)'}`);
    console.log(`${'='.repeat(60)}\n`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    // Register all models before any populate calls
    require('../models/User');
    const Ticket = require('../models/Ticket');
    const Event = require('../models/Event');

    // Find the ticket
    const ticket = await Ticket.findOne({ ticketNumber }).populate('user', 'name email').populate('event');
    if (!ticket) {
      console.error(`Ticket ${ticketNumber} not found`);
      process.exit(1);
    }

    const event = ticket.event;
    if (!event) {
      console.error('Event not found for this ticket');
      process.exit(1);
    }

    console.log('--- Current Ticket Data ---');
    console.log(`  User: ${ticket.user?.name} (${ticket.user?.email})`);
    console.log(`  Event: ${event.title}`);
    console.log(`  Quantity: ${ticket.quantity}`);
    console.log(`  ticket.price.amount: ${ticket.price?.amount}`);
    console.log(`  metadata.basePrice: ${ticket.metadata?.basePrice}`);
    console.log(`  metadata.priceAtPurchase: ${ticket.metadata?.priceAtPurchase}`);
    console.log(`  metadata.totalPaid: ${ticket.metadata?.totalPaid}`);
    console.log(`  metadata.groupingOffer: ${ticket.metadata?.groupingOffer}`);
    console.log(`  metadata.tierPeople: ${ticket.metadata?.tierPeople}`);
    console.log(`  metadata.ticketType: ${ticket.metadata?.ticketType}`);
    console.log(`  metadata.gstAndOtherCharges: ${ticket.metadata?.gstAndOtherCharges}`);
    console.log(`  metadata.platformFees: ${ticket.metadata?.platformFees}`);
    console.log(`  metadata.orderId: ${ticket.metadata?.orderId}`);
    console.log('');

    // Determine the correct basePrice
    const totalPaid = ticket.metadata?.totalPaid || ticket.price?.amount || 0;
    const quantity = ticket.quantity || 1;
    let correctBasePrice = null;
    let correctPerTicketPrice = null;
    let groupOfferLabel = ticket.metadata?.groupingOffer || null;
    let tierPeople = ticket.metadata?.tierPeople || null;

    // Try to find matching group offer tier from the event
    if (event.groupingOffers?.enabled && event.groupingOffers.tiers?.length > 0) {
      const matchingTier = event.groupingOffers.tiers.find(t => t.people === quantity);
      if (matchingTier) {
        correctBasePrice = matchingTier.price;
        correctPerTicketPrice = Math.round(matchingTier.price / quantity);
        groupOfferLabel = groupOfferLabel || `${matchingTier.people} ${matchingTier.people === 1 ? 'Person' : 'People'}`;
        tierPeople = tierPeople || matchingTier.people;
        console.log(`Found matching group offer tier: ${matchingTier.people} people @ ₹${matchingTier.price}`);
      }
    }

    // Fallback: reverse-engineer from totalPaid if no tier match
    if (!correctBasePrice && totalPaid > 0) {
      correctBasePrice = parseFloat((totalPaid / 1.056).toFixed(2));
      correctPerTicketPrice = Math.round(correctBasePrice / quantity);
      console.log(`No matching tier found. Reverse-engineered from totalPaid: ₹${totalPaid} / 1.056 = ₹${correctBasePrice}`);
    }

    if (!correctBasePrice) {
      console.log('Cannot determine correct basePrice. No changes needed or possible.');
      process.exit(0);
    }

    // Check if fix is needed
    const currentBasePrice = ticket.metadata?.basePrice || ticket.price?.amount || 0;
    if (Math.abs(currentBasePrice - correctBasePrice) < 1) {
      console.log(`\nbasePrice is already correct (₹${currentBasePrice}). No fix needed.`);
      process.exit(0);
    }

    // Recalculate fees
    const correctGST = parseFloat((correctBasePrice * 0.026).toFixed(2));
    const correctPlatformFee = parseFloat((correctBasePrice * 0.03).toFixed(2));
    const correctTotalPaid = parseFloat((correctBasePrice + correctGST + correctPlatformFee).toFixed(2));

    console.log('\n--- Corrections ---');
    console.log(`  basePrice: ₹${currentBasePrice} -> ₹${correctBasePrice}`);
    console.log(`  priceAtPurchase: ₹${ticket.metadata?.priceAtPurchase || 'N/A'} -> ₹${correctPerTicketPrice}`);
    console.log(`  price.amount: ₹${ticket.price?.amount} -> ₹${correctBasePrice}`);
    console.log(`  gstAndOtherCharges: ₹${ticket.metadata?.gstAndOtherCharges} -> ₹${correctGST}`);
    console.log(`  platformFees: ₹${ticket.metadata?.platformFees} -> ₹${correctPlatformFee}`);
    console.log(`  groupingOffer: ${ticket.metadata?.groupingOffer || 'N/A'} -> ${groupOfferLabel}`);
    console.log(`  tierPeople: ${ticket.metadata?.tierPeople || 'N/A'} -> ${tierPeople}`);
    console.log(`  ticketType: ${ticket.metadata?.ticketType || 'N/A'} -> group`);
    console.log(`  totalPaid (actual): ₹${totalPaid} (expected: ₹${correctTotalPaid})`);

    if (dryRun) {
      console.log('\n--- DRY RUN: No changes made ---');
      console.log('Run without --dry-run to apply fixes.');
    } else {
      // Apply the fix
      await Ticket.findByIdAndUpdate(ticket._id, {
        $set: {
          'price.amount': correctBasePrice,
          'metadata.basePrice': correctBasePrice,
          'metadata.priceAtPurchase': correctPerTicketPrice,
          'metadata.gstAndOtherCharges': correctGST,
          'metadata.platformFees': correctPlatformFee,
          'metadata.groupingOffer': groupOfferLabel,
          'metadata.tierPeople': tierPeople,
          'metadata.ticketType': 'group',
        }
      });
      console.log('\nTicket updated successfully!');

      // Also fix the participant's amountPaid in the event
      const participantUpdate = await Event.findOneAndUpdate(
        { _id: event._id, 'participants.user': ticket.user._id },
        { $set: { 'participants.$.amountPaid': correctBasePrice } },
        { new: true }
      );
      if (participantUpdate) {
        console.log('Event participant amountPaid updated.');
      }

      // Verify
      const updated = await Ticket.findById(ticket._id);
      console.log('\n--- Verified Updated Data ---');
      console.log(`  price.amount: ₹${updated.price?.amount}`);
      console.log(`  metadata.basePrice: ₹${updated.metadata?.basePrice}`);
      console.log(`  metadata.priceAtPurchase: ₹${updated.metadata?.priceAtPurchase}`);
      console.log(`  metadata.groupingOffer: ${updated.metadata?.groupingOffer}`);
      console.log(`  metadata.tierPeople: ${updated.metadata?.tierPeople}`);
      console.log(`  metadata.ticketType: ${updated.metadata?.ticketType}`);
    }

    await mongoose.disconnect();
    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/fixTicketGroupOfferPricing.js <TICKET_NUMBER> [--dry-run]');
  console.log('Example: node scripts/fixTicketGroupOfferPricing.js IND-MNPPBACZ-C3SC --dry-run');
  process.exit(1);
}

const ticketNumber = args[0];
const dryRun = args.includes('--dry-run');

fixTicketPricing(ticketNumber, dryRun);
