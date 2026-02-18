/**
 * Migration Script: Add basePrice to existing tickets
 * 
 * This script updates old tickets that don't have basePrice in metadata
 * by calculating it from the total amount (price.amount)
 * 
 * Formula:
 * - Total Amount = basePrice + (basePrice * 0.026) + (basePrice * 0.03)
 * - Total Amount = basePrice * 1.056
 * - basePrice = Total Amount / 1.056
 * 
 * Run: node backend/scripts/migrateTicketRevenue.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout';

async function migrateTicketRevenue() {
  try {
    console.log('🔄 Starting ticket revenue migration...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all tickets without basePrice in metadata
    const ticketsWithoutBasePrice = await Ticket.find({
      'metadata.basePrice': { $exists: false }
    });

    console.log(`📊 Found ${ticketsWithoutBasePrice.length} tickets to migrate\n`);

    if (ticketsWithoutBasePrice.length === 0) {
      console.log('✅ No tickets need migration. All done!');
      await mongoose.connection.close();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each ticket
    for (const ticket of ticketsWithoutBasePrice) {
      try {
        const totalAmount = ticket.price?.amount || 0;
        
        // Calculate basePrice (order amount before fees)
        // Total = basePrice * 1.056 (includes 2.6% GST + 3% platform fees)
        const basePrice = totalAmount / 1.056;
        const gstAndOtherCharges = basePrice * 0.026;
        const platformFees = basePrice * 0.03;

        // Update ticket metadata
        ticket.metadata = {
          ...ticket.metadata,
          basePrice: parseFloat(basePrice.toFixed(2)),
          gstAndOtherCharges: parseFloat(gstAndOtherCharges.toFixed(2)),
          platformFees: parseFloat(platformFees.toFixed(2))
        };

        await ticket.save();
        
        successCount++;
        console.log(`✅ [${successCount}/${ticketsWithoutBasePrice.length}] Updated ticket: ${ticket.ticketNumber}`);
        console.log(`   Total: ₹${totalAmount.toFixed(2)} → Base: ₹${basePrice.toFixed(2)}, GST: ₹${gstAndOtherCharges.toFixed(2)}, Fees: ₹${platformFees.toFixed(2)}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating ticket ${ticket.ticketNumber}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📦 Total processed: ${ticketsWithoutBasePrice.length}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('💡 Revenue calculations will now be accurate for all tickets.');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateTicketRevenue();
