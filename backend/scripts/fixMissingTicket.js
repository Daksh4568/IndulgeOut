/**
 * Emergency Script: Fix Missing Ticket for Paid User
 * 
 * USE CASE: When a user successfully paid but ticket wasn't created due to webhook failure
 * 
 * HOW TO USE:
 * 1. Get the Cashfree order ID from the payment confirmation email/screenshot
 * 2. Run: node scripts/fixMissingTicket.js <ORDER_ID>
 * 
 * EXAMPLE:
 * node scripts/fixMissingTicket.js ORDER_1740274800000_userId_eventId
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const ticketService = require('../services/ticketService');
const { sendEventRegistrationEmail, sendEventNotificationToHost } = require('../utils/emailService');
const notificationService = require('../services/notificationService');

async function fixMissingTicket(orderId) {
  try {
    console.log('🔧 Starting ticket recovery process...');
    console.log('📋 Order ID:', orderId);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Parse order ID to extract userId, eventId, and quantity
    // Format: ORDER_timestamp_userId_eventId_quantity (new format)
    // Format: ORDER_timestamp_userId_eventId (old format - defaults to quantity 1)
    const orderParts = orderId.split('_');
    if (orderParts.length < 4) {
      throw new Error('Invalid order ID format. Expected: ORDER_timestamp_userId_eventId or ORDER_timestamp_userId_eventId_quantity');
    }

    const userId = orderParts[2];
    const eventId = orderParts[3];
    const quantity = orderParts[4] ? parseInt(orderParts[4]) : 1; // Default to 1 for old format

    console.log('👤 User ID:', userId);
    console.log('🎉 Event ID:', eventId);
    console.log('🎫 Quantity:', quantity);

    // Fetch event and user
    const event = await Event.findById(eventId).populate('host', 'name email');
    const user = await User.findById(userId);

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    console.log('✅ Event found:', event.title);
    console.log('✅ User found:', user.name, `(${user.email})`);

    // Check if already registered
    const alreadyRegistered = event.participants.some(
      p => p.user.toString() === userId
    );

    if (alreadyRegistered) {
      console.log('⚠️ User is already registered for this event');
      
      // Check if ticket exists
      const existingTicket = await require('../models/Ticket').findOne({
        user: userId,
        event: eventId
      });

      if (existingTicket) {
        console.log('✅ Ticket already exists:', existingTicket.ticketNumber);
        console.log('🎫 Resending ticket email...');
        
        // Resend ticket email
        await sendEventRegistrationEmail(user.email, user.name, event, existingTicket);
        console.log('✅ Ticket email resent successfully!');
      } else {
        console.log('⚠️ User registered but ticket missing. Creating ticket...');
        
        // Get participant data to find amount paid
        const participant = event.participants.find(p => p.user.toString() === userId);
        const amountPaid = participant?.amountPaid || event.price?.amount || event.ticketPrice || 0;
        
        // Generate missing ticket
        const ticket = await ticketService.generateTicket({
          userId,
          eventId: event._id,
          amount: amountPaid,
          paymentId: orderId,
          ticketType: 'general',
          quantity: participant?.quantity || 1,
          metadata: {
            registrationSource: 'manual_fix',
            registeredAt: participant?.registeredAt || new Date(),
            orderId: orderId,
            recoveredAt: new Date()
          }
        });

        console.log('✅ Ticket created:', ticket.ticketNumber);
        
        // Send ticket email
        await sendEventRegistrationEmail(user.email, user.name, event, ticket);
        console.log('✅ Ticket email sent successfully!');
        
        // Send booking notification
        await notificationService.notifyBookingConfirmed(userId, event, ticket);
        console.log('✅ Booking confirmation notification sent!');
      }
    } else {
      console.log('❌ User is NOT registered for this event. Creating registration...');
      
      // Calculate amount based on quantity
      const ticketPrice = event.price?.amount || event.ticketPrice || 0;
      const amountPaid = ticketPrice * quantity;
      console.log('💰 Amount calculation:', { ticketPrice, quantity, amountPaid });

      // Register user for event
      const participantData = {
        user: userId,
        registeredAt: new Date(),
        status: 'registered',
        quantity: quantity,
        paymentStatus: 'paid',
        paymentId: 'MANUAL_FIX',
        orderId: orderId,
        amountPaid: amountPaid,
        questionnaireResponses: []
      };

      await Event.findByIdAndUpdate(
        eventId,
        {
          $push: { participants: participantData },
          $inc: { currentParticipants: quantity }
        }
      );

      // Update user's registered events
      if (!user.registeredEvents.includes(eventId)) {
        user.registeredEvents.push(eventId);
        await user.save();
      }

      console.log('✅ User registered for event');

      // Generate ticket
      const ticket = await ticketService.generateTicket({
        userId,
        eventId: event._id,
        amount: amountPaid,
        paymentId: orderId,
        ticketType: quantity > 1 ? 'group' : 'general',
        quantity: quantity,
        metadata: {
          registrationSource: 'manual_fix',
          registeredAt: new Date(),
          orderId: orderId,
          recoveredAt: new Date(),
          basePrice: amountPaid,
          ticketPrice: ticketPrice,
          slotsBooked: quantity
        }
      });

      console.log('✅ Ticket created:', ticket.ticketNumber);

      // Send emails
      await sendEventRegistrationEmail(user.email, user.name, event, ticket);
      console.log('✅ Registration email sent');

      await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
      console.log('✅ Host notification sent');

      await notificationService.notifyBookingConfirmed(userId, event, ticket);
      console.log('✅ Booking confirmation sent');
    }

    console.log('✅ TICKET RECOVERY COMPLETED SUCCESSFULLY!');
    console.log('📧 User should receive email with ticket');
    console.log('🎫 Ticket should now be visible in user dashboard');

    return { success: true, orderId, ticket };
  } catch (error) {
    console.error('❌ Error during ticket recovery:', error);
    console.error(error.stack);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { fixMissingTicket };

// Only run directly if executed as main script
if (require.main === module) {
  // Get order ID from command line arguments
  const orderId = process.argv[2];

  if (!orderId) {
    console.error('❌ Please provide an order ID');
    console.error('Usage: node scripts/fixMissingTicket.js <ORDER_ID>');
    console.error('Example: node scripts/fixMissingTicket.js ORDER_1740274800000_userId_eventId');
    process.exit(1);
  }

  // Run the fix and close DB connection
  fixMissingTicket(orderId)
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}
