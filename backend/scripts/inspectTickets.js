require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

async function inspectTickets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');
    
    // Get a sample of tickets with different characteristics
    console.log('=== Sample Tickets Data ===\n');
    
    const tickets = await Ticket.find({})
      .limit(10)
      .select('ticketNumber metadata price purchaseDate')
      .lean();
    
    console.log(`Found ${tickets.length} tickets\n`);
    
    tickets.forEach((ticket, index) => {
      console.log(`--- Ticket ${index + 1}: ${ticket.ticketNumber} ---`);
      console.log('Price:', JSON.stringify(ticket.price, null, 2));
      console.log('Metadata:', JSON.stringify(ticket.metadata, null, 2));
      console.log('Purchase Date:', ticket.purchaseDate);
      console.log('');
    });
    
    // Check how many tickets have each field
    const totalTickets = await Ticket.countDocuments({});
    const withTotalPaid = await Ticket.countDocuments({ 'metadata.totalPaid': { $exists: true, $ne: 0 } });
    const withGst = await Ticket.countDocuments({ 'metadata.gstAndOtherCharges': { $exists: true, $ne: 0 } });
    const withPlatformFees = await Ticket.countDocuments({ 'metadata.platformFees': { $exists: true, $ne: 0 } });
    const withBasePrice = await Ticket.countDocuments({ 'metadata.basePrice': { $exists: true, $ne: 0 } });
    const withOrderId = await Ticket.countDocuments({ 'metadata.orderId': { $exists: true } });
    
    console.log('=== Field Statistics ===');
    console.log(`Total Tickets: ${totalTickets}`);
    console.log(`With metadata.totalPaid (non-zero): ${withTotalPaid} (${(withTotalPaid/totalTickets*100).toFixed(1)}%)`);
    console.log(`With metadata.gstAndOtherCharges (non-zero): ${withGst} (${(withGst/totalTickets*100).toFixed(1)}%)`);
    console.log(`With metadata.platformFees (non-zero): ${withPlatformFees} (${(withPlatformFees/totalTickets*100).toFixed(1)}%)`);
    console.log(`With metadata.basePrice (non-zero): ${withBasePrice} (${(withBasePrice/totalTickets*100).toFixed(1)}%)`);
    console.log(`With metadata.orderId: ${withOrderId} (${(withOrderId/totalTickets*100).toFixed(1)}%)`);
    
    // Sample tickets with price as number (legacy format)
    const legacyTickets = await Ticket.find({})
      .limit(5)
      .select('ticketNumber price metadata.basePrice metadata.totalPaid')
      .lean();
    
    console.log('\n=== Checking Price Field Type ===');
    legacyTickets.forEach(ticket => {
      console.log(`${ticket.ticketNumber}: price type = ${typeof ticket.price}, value = ${JSON.stringify(ticket.price)}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

inspectTickets();
