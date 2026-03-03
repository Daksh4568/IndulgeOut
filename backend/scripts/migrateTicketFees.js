require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

/**
 * Migration Script: Fix Old Tickets with Missing Fee Data
 * 
 * This script:
 * 1. Finds tickets with missing gstAndOtherCharges and platformFees
 * 2. Calculates fees from price.amount and basePrice
 * 3. Updates ticket metadata with correct values
 * 4. Handles backward compatibility (price as number vs object)
 */

async function migrateTicketFees() {
  try {
    console.log('🚀 Starting ticket fee migration...\n');
    
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
    }).lean();

    console.log(`📊 Found ${tickets.length} tickets needing migration\n`);

    if (tickets.length === 0) {
      console.log('✅ No tickets need migration. All tickets have fee data!');
      process.exit(0);
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    console.log('Processing tickets...\n');

    for (const ticketData of tickets) {
      try {
        // Get the ticket document for updating
        const ticket = await Ticket.findById(ticketData._id);
        
        if (!ticket) {
          console.log(`⚠️  Ticket ${ticketData.ticketNumber} not found, skipping`);
          skipped++;
          continue;
        }

        // Get current price (handle both number and object formats)
        const priceAmount = typeof ticket.price === 'number' 
          ? ticket.price 
          : (ticket.price?.amount || 0);

        // Get basePrice from metadata
        const basePrice = ticket.metadata?.basePrice || 0;

        // Skip if both price and basePrice are 0 (free tickets)
        if (priceAmount === 0 && basePrice === 0) {
          console.log(`⏭️  ${ticket.ticketNumber}: Free ticket, skipping`);
          skipped++;
          continue;
        }

        // Calculate fees based on available data
        let gstAndOtherCharges = 0;
        let platformFees = 0;
        let calculationMethod = '';

        if (basePrice > 0 && priceAmount > basePrice) {
          // Method 1: Calculate from price difference
          const totalFees = priceAmount - basePrice;
          
          // Only calculate if difference is meaningful (> 1% of base)
          if (totalFees > basePrice * 0.01) {
            // Split fees: 46% GST, 54% platform (based on 2.6% GST + 3% platform = 5.6% total)
            gstAndOtherCharges = parseFloat((totalFees * 0.46).toFixed(2));
            platformFees = parseFloat((totalFees * 0.54).toFixed(2));
            calculationMethod = 'price_difference';
          }
        } else if (basePrice > 0) {
          // Method 2: Calculate standard fees from basePrice
          gstAndOtherCharges = parseFloat((basePrice * 0.026).toFixed(2)); // 2.6%
          platformFees = parseFloat((basePrice * 0.03).toFixed(2));        // 3.0%
          calculationMethod = 'standard_calculation';
        } else if (priceAmount > 0) {
          // Method 3: Reverse calculate basePrice and fees
          // total = base * 1.056, so base = total / 1.056
          const calculatedBase = priceAmount / 1.056;
          const totalFees = priceAmount - calculatedBase;
          
          gstAndOtherCharges = parseFloat((totalFees * 0.46).toFixed(2));
          platformFees = parseFloat((totalFees * 0.54).toFixed(2));
          
          // Also update basePrice if it was 0
          if (ticket.metadata?.basePrice === 0 || !ticket.metadata?.basePrice) {
            ticket.metadata.basePrice = parseFloat(calculatedBase.toFixed(2));
          }
          calculationMethod = 'reverse_calculation';
        }

        // Skip if calculated fees are still 0
        if (gstAndOtherCharges === 0 && platformFees === 0) {
          console.log(`⏭️  ${ticket.ticketNumber}: Unable to calculate fees, skipping`);
          skipped++;
          continue;
        }

        // Update metadata
        if (!ticket.metadata) {
          ticket.metadata = {};
        }
        
        ticket.metadata.gstAndOtherCharges = gstAndOtherCharges;
        ticket.metadata.platformFees = platformFees;
        
        // Calculate and store totalPaid if missing
        const totalPaid = (ticket.metadata.basePrice || 0) + gstAndOtherCharges + platformFees;
        if (!ticket.metadata.totalPaid || ticket.metadata.totalPaid === 0) {
          ticket.metadata.totalPaid = parseFloat(totalPaid.toFixed(2));
        }

        // Save with validation disabled (like reconciliation script)
        await ticket.save({ validateBeforeSave: false });

        console.log(`✅ ${ticket.ticketNumber}: Updated (${calculationMethod})`);
        console.log(`   Base: ₹${ticket.metadata.basePrice}, GST: ₹${gstAndOtherCharges}, Platform: ₹${platformFees}, Total: ₹${totalPaid}`);
        
        updated++;

      } catch (error) {
        console.error(`❌ ${ticketData.ticketNumber}: Error - ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total Tickets Processed: ${tickets.length}`);
    console.log(`✅ Successfully Updated:  ${updated}`);
    console.log(`⏭️  Skipped (Free/Invalid): ${skipped}`);
    console.log(`❌ Errors:                ${errors}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\nVerification:');
      console.log('Run this command to check updated tickets:');
      console.log('node scripts/inspectTickets.js');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateTicketFees();
