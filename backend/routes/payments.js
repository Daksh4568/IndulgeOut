const express = require('express');
const axios = require('axios');
const { Cashfree } = require('cashfree-pg');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const { authMiddleware } = require('../utils/authUtils.js');
const { sendEventRegistrationEmail, sendEventNotificationToHost } = require('../utils/emailService.js');
const recommendationEngine = require('../services/recommendationEngine.js');
const ticketService = require('../services/ticketService.js');
const notificationService = require('../services/notificationService.js');

const router = express.Router();

// Initialize Cashfree configuration
Cashfree.XClientId = process.env.CASHFREE_APP_ID || '';
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || '';
// Set environment: 'SANDBOX' for testing, 'PRODUCTION' for live
Cashfree.XEnvironment = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX';

// Determine Cashfree API URL based on secret key
const CASHFREE_API_URL = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_') 
  ? 'https://api.cashfree.com'
  : 'https://sandbox.cashfree.com';

console.log('🔑 Cashfree Configuration:', {
  appId: process.env.CASHFREE_APP_ID?.substring(0, 10) + '...',
  environment: Cashfree.XEnvironment,
  apiUrl: CASHFREE_API_URL
});

// Create payment order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { eventId, amount, quantity = 1 } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Payment order request:', { eventId, userId, amount, quantity });

    // Fetch event details
    const event = await Event.findById(eventId).populate('host', 'name email');
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('Event found:', {
      title: event.title,
      priceAmount: event.price?.amount,
      ticketPrice: event.ticketPrice,
      requestedAmount: amount
    });

    // Use provided amount (from billing page with fees) or calculate from event price
    const ticketPrice = amount || (event.price?.amount || event.ticketPrice || 0) * quantity;
    
    // Round to 2 decimal places to avoid floating point precision issues
    const roundedTicketPrice = parseFloat(ticketPrice.toFixed(2));
    
    console.log('Final ticket price for payment:', roundedTicketPrice);
    
    if (!roundedTicketPrice || roundedTicketPrice === 0) {
      console.log('Event is free, no payment required');
      return res.status(400).json({ message: 'This event is free, no payment required' });
    }

    // Check if event is full
    if (event.participants && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if already registered
    const alreadyRegistered = event.participants.some(
      p => p.user.toString() === userId
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create unique order ID
    const orderId = `ORDER_${Date.now()}_${userId}_${eventId}`;

    // Create Cashfree order request
    const request = {
      order_amount: roundedTicketPrice,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: userId,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone || '9999999999'
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment-callback?order_id=${orderId}`,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`
      },
      order_note: `Payment for event: ${event.title}`
    };

    console.log('Creating Cashfree order with request:', request);

    // Create order with Cashfree using REST API
    const cashfreeResponse = await axios.post(
      `${CASHFREE_API_URL}/pg/orders`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01'
        }
      }
    );

    console.log('Cashfree response:', cashfreeResponse.data);

    res.json({
      success: true,
      payment_session_id: cashfreeResponse.data.payment_session_id,
      order_id: orderId,
      amount: ticketPrice
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    
    // Log detailed error response from Cashfree
    if (error.response) {
      console.error('Cashfree API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create payment order', 
      error: error.message,
      cashfreeError: error.response?.data || null
    });
  }
});

// Verify payment and complete registration
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { 
      orderId, 
      eventId,
      quantity = 1,
      groupingOffer,
      additionalPersons = [],
      questionnaireResponses = [],
      basePrice,
      gstAndOtherCharges,
      platformFees,
      totalAmount
    } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Verifying payment:', { orderId, eventId, userId });

    // Fetch order status from Cashfree using REST API
    const cashfreeResponse = await axios.get(
      `${CASHFREE_API_URL}/pg/orders/${orderId}/payments`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01'
        }
      }
    );
    
    console.log('Cashfree payment response:', cashfreeResponse.data);
    
    if (!cashfreeResponse.data || cashfreeResponse.data.length === 0) {
      return res.status(400).json({ message: 'Payment not found' });
    }

    const payment = cashfreeResponse.data[0];

    // Check if payment is successful
    if (payment.payment_status !== 'SUCCESS') {
      return res.status(400).json({ 
        message: 'Payment not successful', 
        status: payment.payment_status 
      });
    }

    // Determine ticket quantity based on grouping offer or manual quantity
    let ticketQuantity;
    if (groupingOffer && groupingOffer.tierPeople > 0) {
      ticketQuantity = groupingOffer.tierPeople;
    } else {
      ticketQuantity = Math.min(Math.max(parseInt(quantity) || 1, 1), 10);
    }

    console.log(`📊 Payment verified - registering with quantity=${quantity}, ticketQuantity=${ticketQuantity}`);

    // Prepare participant data
    const participantData = {
      user: userId,
      registeredAt: new Date(),
      status: 'registered',
      quantity: ticketQuantity,
      paymentStatus: 'paid',
      paymentId: payment.cf_payment_id,
      orderId: orderId,
      amountPaid: payment.payment_amount,
      questionnaireResponses: questionnaireResponses || []
    };

    // Add grouping offer details if applicable
    if (groupingOffer) {
      participantData.groupingOffer = {
        tierLabel: groupingOffer.tierLabel,
        tierPeople: groupingOffer.tierPeople,
        tierPrice: groupingOffer.tierPrice
      };
    }

    // Register user for event (atomic operation)
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        'participants.user': { $ne: userId }
      },
      {
        $push: { participants: participantData },
        $inc: { currentParticipants: ticketQuantity }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('host', 'name email');

    if (!event) {
      // Refund might be needed here
      return res.status(400).json({ 
        message: 'Registration failed. Event may be full or you may already be registered.' 
      });
    }

    // Update user's registered events
    const user = await User.findById(userId);
    user.registeredEvents.push(event._id);
    await user.save();

    // Update analytics
    try {
      await recommendationEngine.updateEventRegistrationAnalytics(userId, event._id);
    } catch (analyticsError) {
      console.error('Failed to update analytics:', analyticsError);
    }

    // Generate ticket for the primary user
    let ticket = null;
    console.log(`🎫 [Payment Flow] Starting ticket generation for user ${userId}, event ${event._id}`);
    try {
      const ticketMetadata = {
        registrationSource: 'payment',
        registeredAt: new Date(),
        slotsBooked: ticketQuantity,
        orderId: orderId,
        basePrice: basePrice || 0,
        gstAndOtherCharges: gstAndOtherCharges || 0,
        platformFees: platformFees || 0
      };
      
      if (groupingOffer) {
        ticketMetadata.groupingOffer = groupingOffer.tierLabel;
        ticketMetadata.tierPeople = groupingOffer.tierPeople;
      }
      
      ticket = await ticketService.generateTicket({
        userId,
        eventId: event._id,
        amount: totalAmount || payment.payment_amount,
        paymentId: orderId,
        ticketType: groupingOffer ? 'group' : (ticketQuantity > 1 ? 'group' : 'general'),
        quantity: ticketQuantity,
        metadata: ticketMetadata
      });
      console.log(`✅ Ticket generated: ${ticket.ticketNumber} (${ticketQuantity} spots)`);
      console.log(`🎫 [Payment Ticket] QR Code present: ${!!ticket?.qrCode}, Length: ${ticket?.qrCode?.length || 0}`);
    } catch (ticketError) {
      console.error('❌ [Payment Ticket] Failed to generate ticket:', ticketError.message);
      console.error('❌ [Payment Ticket Stack]:', ticketError.stack);
      // Continue without failing the entire registration
    }

    // Send confirmation emails asynchronously
    setImmediate(async () => {
      try {
        console.log(`📧 [Payment Email] Sending registration email with ticket: ${ticket?.ticketNumber}`);
        console.log(`🎫 [Payment Email] Ticket has QR: ${!!ticket?.qrCode}, QR Length: ${ticket?.qrCode?.length}`);
        await sendEventRegistrationEmail(user.email, user.name, event, ticket);
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
      }
    });

    // Send tickets to additional persons if provided (share the same ticket)
    if (additionalPersons && additionalPersons.length > 0 && ticket) {
      console.log(`📧 [Additional Persons] Sending tickets to ${additionalPersons.length} additional person(s)`);
      setImmediate(async () => {
        for (const person of additionalPersons) {
          if (person.email && person.name) {
            try {
              // Send the same ticket to additional person (they share the booking)
              await sendEventRegistrationEmail(person.email, person.name, event, ticket);
              console.log(`✅ [Additional Person] Ticket sent to: ${person.email}`);
            } catch (guestError) {
              console.error(`❌ [Additional Person] Failed to send ticket to ${person.email}:`, guestError.message);
            }
          }
        }
      });
    }

    setImmediate(async () => {
      try {
        await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
      } catch (emailError) {
        console.error('Failed to send host notification:', emailError);
      }
    });

    // Send in-app booking confirmation notification to user
    setImmediate(async () => {
      try {
        await notificationService.notifyBookingConfirmed(userId, event, ticket);
        console.log(`✅ [Payment Flow] Booking confirmation notification sent to user ${userId}`);
      } catch (notifError) {
        console.error('Failed to send booking confirmation notification:', notifError);
      }
    });

    res.json({
      success: true,
      message: 'Payment verified and registration successful',
      event: {
        id: event._id,
        title: event.title,
        date: event.date
      },
      ticket: ticket ? {
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        downloadUrl: `/api/tickets/${ticket.ticketNumber}/download`
      } : null,
      additionalTicketsSent: additionalPersons.length
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      message: 'Failed to verify payment', 
      error: error.message 
    });
  }
});

// Webhook for payment status updates
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature (implement Cashfree signature verification)
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    // TODO: Verify signature using Cashfree's verification method
    
    const payload = JSON.parse(req.body.toString());
    
    console.log('Payment webhook received:', payload);

    // Handle different event types
    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      // Payment successful - you might want to update payment status in database
      console.log('Payment successful:', payload.data.order.order_id);
    } else if (payload.type === 'PAYMENT_FAILED_WEBHOOK') {
      // Payment failed
      console.log('Payment failed:', payload.data.order.order_id);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;
