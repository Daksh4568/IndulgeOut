/**
 * Check tickets without orderId
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

async function checkTicketsWithoutOrderId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find tickets without orderId
    const tickets = await Ticket.find({
      $or: [
        { 'metadata.orderId': { $exists: false } },
        { 'metadata.orderId': null },
        { 'metadata.orderId': '' }
      ]
    });
    
    console.log(`Found ${tickets.length} tickets without orderId:\n`);
    console.log('─────────────────────────────────────────────────────');
    
    // Group by event
    const byEvent = {};
    tickets.forEach(t => {
      const eventId = t.event?.toString() || 'unknown';
      
      if (!byEvent[eventId]) {
        byEvent[eventId] = {
          eventId: eventId,
          tickets: []
        };
      }
      
      byEvent[eventId].tickets.push({
        ticketNumber: t.ticketNumber,
        purchaseDate: t.purchaseDate,
        amount: t.metadata?.totalPaid || 0,
        status: t.status
      });
    });
    
    // Display results
    for (const eventId in byEvent) {
      const event = byEvent[eventId];
      console.log(`\n📅 Event ID: ${eventId}`);
      console.log(`   Tickets missing orderId: ${event.tickets.length}`);
      console.log('');
      
      event.tickets.forEach(t => {
        console.log(`   • ${t.ticketNumber}`);
        console.log(`     Date: ${t.purchaseDate?.toLocaleString() || 'Unknown'}`);
        console.log(`     Amount: ₹${t.amount}`);
        console.log(`     Status: ${t.status}`);
        console.log('');
      });
    }
    
    console.log('─────────────────────────────────────────────────────');
    console.log(`\nTotal: ${tickets.length} tickets across ${Object.keys(byEvent).length} events`);
    
    // Check payment metadata
    console.log('\n\n📊 Checking payment metadata structure...\n');
    for (let i = 0; i < Math.min(3, tickets.length); i++) {
      const t = tickets[i];
      console.log(`Ticket: ${t.ticketNumber}`);
      console.log(`Metadata:`, JSON.stringify(t.metadata, null, 2));
      console.log('');
    }
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTicketsWithoutOrderId();
