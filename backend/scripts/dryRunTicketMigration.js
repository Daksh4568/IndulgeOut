require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

/**
 * Dry Run: Preview Ticket Fee Migration
 * 
 * Shows what would be changed without actually updating the database
 */

async function dryRunMigration() {
  try {
    console.log('🔍 Running dry-run migration preview...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all tickets with missing or zero fee data
    const tickets = await Ticket.find({
      $or: [
        { 'metadata.gstAndOtherCharges': { $exists: false } },
        { 'metadata.gstAndOtherCharges': 0 },
        { 'metadata.platformFees': { $exists: false } },
        { 'metadata.platformFees': 0 }
      ]
    }).select('ticketNumber price metadata purchaseDate').lean();

    console.log(`📊 Found ${tickets.length} tickets that would be updated\n`);

    if (tickets.length === 0) {
      console.log('✅ No tickets need migration!');
      process.exit(0);
    }

    console.log('Preview of changes:\n');
    console.log('='.repeat(80));

    let wouldUpdate = 0;
    let wouldSkip = 0;

    for (const ticket of tickets.slice(0, 20)) { // Show first 20
      const priceAmount = typeof ticket.price === 'number' 
        ? ticket.price 
        : (ticket.price?.amount || 0);

      const basePrice = ticket.metadata?.basePrice || 0;

      // Skip free tickets
      if (priceAmount === 0 && basePrice === 0) {
        console.log(`⏭️  ${ticket.ticketNumber}: Free ticket (would skip)`);
        wouldSkip++;
        continue;
      }

      let gstAndOtherCharges = 0;
      let platformFees = 0;
      let method = '';

      if (basePrice > 0 && priceAmount > basePrice) {
        const totalFees = priceAmount - basePrice;
        if (totalFees > basePrice * 0.01) {
          gstAndOtherCharges = parseFloat((totalFees * 0.46).toFixed(2));
          platformFees = parseFloat((totalFees * 0.54).toFixed(2));
          method = 'price_difference';
        }
      } else if (basePrice > 0) {
        gstAndOtherCharges = parseFloat((basePrice * 0.026).toFixed(2));
        platformFees = parseFloat((basePrice * 0.03).toFixed(2));
        method = 'standard_calculation';
      } else if (priceAmount > 0) {
        const calculatedBase = priceAmount / 1.056;
        const totalFees = priceAmount - calculatedBase;
        gstAndOtherCharges = parseFloat((totalFees * 0.46).toFixed(2));
        platformFees = parseFloat((totalFees * 0.54).toFixed(2));
        method = 'reverse_calculation';
      }

      if (gstAndOtherCharges === 0 && platformFees === 0) {
        console.log(`⏭️  ${ticket.ticketNumber}: Unable to calculate (would skip)`);
        wouldSkip++;
        continue;
      }

      console.log(`\n📝 ${ticket.ticketNumber} (${method}):`);
      console.log(`   Current: base=₹${basePrice}, gst=₹${ticket.metadata?.gstAndOtherCharges || 0}, platform=₹${ticket.metadata?.platformFees || 0}`);
      console.log(`   Would become: base=₹${basePrice}, gst=₹${gstAndOtherCharges}, platform=₹${platformFees}`);
      console.log(`   Total: ₹${(basePrice + gstAndOtherCharges + platformFees).toFixed(2)}`);
      
      wouldUpdate++;
    }

    if (tickets.length > 20) {
      console.log(`\n... and ${tickets.length - 20} more tickets`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 Dry Run Summary:');
    console.log('='.repeat(80));
    console.log(`Total Tickets Found:      ${tickets.length}`);
    console.log(`Would Update:             ${wouldUpdate + (tickets.length - Math.min(tickets.length, 20))}`);
    console.log(`Would Skip (Free/Invalid): ${wouldSkip}`);
    console.log('='.repeat(80));

    console.log('\n💡 To apply these changes, run:');
    console.log('   node scripts/migrateTicketFees.js\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Dry run failed:', error);
    process.exit(1);
  }
}

dryRunMigration();
