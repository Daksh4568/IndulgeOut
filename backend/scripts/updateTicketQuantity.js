/**
 * Quick Fix: Update ticket quantity and amount
 * 
 * USE CASE: When ticket was created with wrong quantity/amount
 * 
 * HOW TO USE:
 * node scripts/updateTicketQuantity.js <USER_ID> <EVENT_ID> <QUANTITY> <AMOUNT>
 * 
 * EXAMPLE:
 * node scripts/updateTicketQuantity.js 699ef465b797513dcdf7071a 699dfc3656a3e534bd0ff78f 3 630.43
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

async function updateTicketQuantity() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
      console.log('❌ Usage: node scripts/updateTicketQuantity.js <USER_ID> <EVENT_ID> <QUANTITY> <AMOUNT>');
      console.log('Example: node scripts/updateTicketQuantity.js 699ef465b797513dcdf7071a 699dfc3656a3e534bd0ff78f 3 630.43');
      process.exit(1);
    }

    const [userId, eventId, quantity, amount] = args;
    const quantityNum = parseInt(quantity);
    const amountNum = parseFloat(amount);

    console.log('🔧 Updating ticket details...');
    console.log('👤 User ID:', userId);
    console.log('🎉 Event ID:', eventId);
    console.log('🎫 New Quantity:', quantityNum);
    console.log('💰 New Amount:', amountNum);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // 1. Update participant record in Event
    const eventUpdate = await Event.findOneAndUpdate(
      { 
        _id: eventId,
        'participants.user': userId 
      },
      { 
        $set: {
          'participants.$.quantity': quantityNum,
          'participants.$.amountPaid': amountNum
        }
      },
      { new: true }
    );

    if (!eventUpdate) {
      throw new Error('Failed to update event participant record');
    }

    console.log('✅ Updated participant record in event');

    // 2. Update ticket
    const ticketUpdate = await Ticket.findOneAndUpdate(
      {
        user: userId,
        event: eventId
      },
      {
        $set: {
          quantity: quantityNum,
          price: amountNum,
          'metadata.basePrice': amountNum, // For revenue calculation
          'metadata.actualAmountPaid': amountNum,
          'metadata.actualQuantity': quantityNum,
          'metadata.correctedAt': new Date()
        }
      },
      { new: true }
    );

    if (!ticketUpdate) {
      throw new Error('Failed to update ticket');
    }

    console.log('✅ Updated ticket:', ticketUpdate.ticketNumber);
    console.log('🎫 New quantity:', ticketUpdate.quantity);
    console.log('💰 New price:', ticketUpdate.price);

    // 3. Update event participant count (adjust by difference)
    const quantityDiff = quantityNum - 1; // Current is 1, so add the difference
    if (quantityDiff !== 0) {
      await Event.findByIdAndUpdate(
        eventId,
        { $inc: { currentParticipants: quantityDiff } }
      );
      console.log(`✅ Adjusted event participant count by ${quantityDiff}`);
    }

    console.log('');
    console.log('✅ ALL UPDATES COMPLETED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log(`   - Ticket Number: ${ticketUpdate.ticketNumber}`);
    console.log(`   - Quantity: ${ticketUpdate.quantity} spots`);
    console.log(`   - Amount Paid: ₹${ticketUpdate.price}`);
    console.log(`   - User: ${userId}`);
    console.log(`   - Event: ${eventId}`);
    
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during update:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
updateTicketQuantity();
