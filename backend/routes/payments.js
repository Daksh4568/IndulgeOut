const express = require('express');
const axios = require('axios');
const { Cashfree } = require('cashfree-pg');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const WebhookLog = require('../models/WebhookLog.js');
const { authMiddleware } = require('../utils/authUtils.js');
const { sendEventRegistrationEmail, sendEventNotificationToHost } = require('../utils/emailService.js');
const recommendationEngine = require('../services/recommendationEngine.js');
const ticketService = require('../services/ticketService.js');
const notificationService = require('../services/notificationService.js');
const { verifyCashfreeWebhook } = require('../utils/webhookVerification.js');

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

    // Create unique order ID with quantity
    const orderId = `ORDER_${Date.now()}_${userId}_${eventId}_${quantity || 1}`;

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
    console.log('Using Cashfree credentials:', {
      appId: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.substring(0, 10) + '...' : 'MISSING',
      secretKey: process.env.CASHFREE_SECRET_KEY ? process.env.CASHFREE_SECRET_KEY.substring(0, 10) + '...' : 'MISSING',
      apiUrl: CASHFREE_API_URL
    });

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

    console.log('Cashfree response:', JSON.stringify(cashfreeResponse.data, null, 2));
    console.log('Payment session ID:', cashfreeResponse.data.payment_session_id);

    // Check if payment_session_id exists
    if (!cashfreeResponse.data.payment_session_id) {
      console.error('❌ payment_session_id is missing from Cashfree response!');
      console.error('Full response:', cashfreeResponse.data);
      return res.status(500).json({
        success: false,
        message: 'Payment gateway did not return session ID',
        cashfreeResponse: cashfreeResponse.data
      });
    }

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
      basePrice, // Base price from frontend (already calculated correctly)
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

    // Check if already registered (webhook might have already processed this)
    const existingEvent = await Event.findById(eventId).populate('host', 'name email');
    const alreadyRegistered = existingEvent.participants.some(
      p => p.user.toString() === userId
    );

    if (alreadyRegistered) {
      console.log('⚠️ [VERIFY-PAYMENT] User already registered (webhook likely processed this)');
      
      // Find existing ticket
      const existingTicket = await require('../models/Ticket').findOne({
        user: userId,
        event: eventId,
        orderId: orderId
      });

      return res.json({
        success: true,
        message: 'Already registered (payment was processed via webhook)',
        event: {
          id: existingEvent._id,
          title: existingEvent.title,
          date: existingEvent.date
        },
        ticket: existingTicket ? {
          ticketNumber: existingTicket.ticketNumber,
          qrCode: existingTicket.qrCode,
          downloadUrl: `/api/tickets/${existingTicket.ticketNumber}/download`
        } : null
      });
    }

    // Prepare participant data
    const participantData = {
      user: userId,
      registeredAt: new Date(),
      status: 'registered',
      quantity: ticketQuantity,
      paymentStatus: 'paid',
      paymentId: payment.cf_payment_id,
      orderId: orderId,
      amountPaid: basePrice || totalAmount || payment.payment_amount, // Use frontend basePrice for revenue
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
        basePrice: basePrice || 0, // Base price from frontend (revenue amount)
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
        amount: basePrice || totalAmount || payment.payment_amount, // Use frontend basePrice for revenue
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

    // Send confirmation emails synchronously (for Vercel serverless)
    try {
      console.log(`📧 [Payment Email] Sending registration email with ticket: ${ticket?.ticketNumber}`);
      console.log(`🎫 [Payment Email] Ticket has QR: ${!!ticket?.qrCode}, QR Length: ${ticket?.qrCode?.length}`);
      await sendEventRegistrationEmail(user.email, user.name, event, ticket);
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
    }

    // Send tickets to additional persons if provided (share the same ticket)
    if (additionalPersons && additionalPersons.length > 0 && ticket) {
      console.log(`📧 [Additional Persons] Sending tickets to ${additionalPersons.length} additional person(s)`);
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
    }

    try {
      await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
    } catch (emailError) {
      console.error('Failed to send host notification:', emailError);
    }

    // Send in-app booking confirmation notification to user
    try {
      await notificationService.notifyBookingConfirmed(userId, event, ticket);
      console.log(`✅ [Payment Flow] Booking confirmation notification sent to user ${userId}`);
    } catch (notifError) {
      console.error('Failed to send booking confirmation notification:', notifError);
    }

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
// Note: Raw body parsing handled by global middleware in index.js
router.post('/webhook', async (req, res) => {
  const startTime = Date.now();
  let webhookLog = null;
  let payload = null;
  
  try {
    // Parse payload - handle both raw buffer and already-parsed object
    let rawBody;
    if (Buffer.isBuffer(req.body)) {
      // Body is raw buffer (from express.raw middleware)
      rawBody = req.body.toString();
      payload = JSON.parse(rawBody);
    } else if (typeof req.body === 'object') {
      // Body already parsed by express.json() middleware
      payload = req.body;
      rawBody = JSON.stringify(payload);
    } else if (typeof req.body === 'string') {
      // Body is string
      rawBody = req.body;
      payload = JSON.parse(rawBody);
    } else {
      throw new Error('Invalid request body format');
    }
    
    // Extract headers
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    console.log('🔔 [WEBHOOK] Payment webhook received:', {
      type: payload.type,
      orderId: payload.data?.order?.order_id,
      amount: payload.data?.payment?.payment_amount,
      status: payload.data?.payment?.payment_status,
      environment: process.env.NODE_ENV,
      hasSignature: !!signature,
      hasTimestamp: !!timestamp
    });

    // Verify webhook signature (CRITICAL SECURITY CHECK)
    const isSignatureValid = verifyCashfreeWebhook(rawBody, signature, timestamp);
    
    // Determine if we're in production based on Cashfree credentials (not NODE_ENV)
    const isCashfreeProduction = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_');
    
    if (!isSignatureValid) {
      if (isCashfreeProduction) {
        // In production, reject invalid signatures
        console.error('❌ [WEBHOOK] Invalid signature in PRODUCTION - rejecting webhook');
        
        // Log failed verification
        await WebhookLog.create({
          type: payload.type || 'UNKNOWN',
          orderId: payload.data?.order?.order_id || 'UNKNOWN',
          status: 'failed',
          error: {
            message: 'Invalid webhook signature',
            code: 'SIGNATURE_VERIFICATION_FAILED'
          },
          signatureVerified: false,
          payload: payload,
          headers: { signature, timestamp, userAgent: req.headers['user-agent'] },
          responseStatus: 403,
          responseMessage: 'Invalid signature',
          receivedAt: new Date(),
          processedAt: new Date(),
          processingTime: Date.now() - startTime
        });
        
        return res.status(403).json({ message: 'Invalid signature' });
      } else {
        // In sandbox, log warning but continue processing
        console.warn('⚠️ [WEBHOOK] Invalid signature in SANDBOX - continuing anyway (test mode)');
      }
    }

    console.log(`✅ [WEBHOOK] Signature verified (${isCashfreeProduction ? 'PRODUCTION' : 'SANDBOX'})`);

    // Handle different event types
    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = payload.data?.order?.order_id;
      const paymentAmount = payload.data?.payment?.payment_amount;
      const cfPaymentId = payload.data?.payment?.cf_payment_id;
      
      console.log('✅ [WEBHOOK] Payment successful:', orderId);
      
      if (!orderId) {
        console.error('❌ [WEBHOOK] No order ID in webhook payload');
        return res.status(400).json({ message: 'Invalid webhook payload' });
      }

      // Parse order ID to extract userId, eventId, and quantity
      // Format: ORDER_timestamp_userId_eventId_quantity
      const orderParts = orderId.split('_');
      if (orderParts.length < 4) {
        console.error('❌ [WEBHOOK] Invalid order ID format:', orderId);
        return res.status(400).json({ message: 'Invalid order ID format' });
      }

      const userId = orderParts[2];
      const eventId = orderParts[3];
      const orderQuantity = orderParts[4] ? parseInt(orderParts[4]) : 1;

      console.log('🎫 [WEBHOOK] Processing registration:', { userId, eventId });

      // Fetch event and user
      const event = await Event.findById(eventId).populate('host', 'name email');
      const user = await User.findById(userId);

      if (!event) {
        console.error('❌ [WEBHOOK] Event not found:', eventId);
        return res.status(404).json({ message: 'Event not found' });
      }

      if (!user) {
        console.error('❌ [WEBHOOK] User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if already registered (idempotency check)
      const alreadyRegistered = event.participants.some(
        p => p.user.toString() === userId
      );

      if (alreadyRegistered) {
        console.log('⚠️ [WEBHOOK] User already registered (duplicate webhook or verify-payment already processed)');
        
        // Log duplicate webhook
        await WebhookLog.create({
          type: payload.type,
          orderId: orderId,
          paymentId: cfPaymentId,
          amount: paymentAmount,
          status: 'duplicate',
          signatureVerified: true,
          processingTime: Date.now() - startTime,
          payload: payload,
          headers: {
            signature: req.headers['x-webhook-signature'],
            timestamp: req.headers['x-webhook-timestamp'],
            userAgent: req.headers['user-agent']
          },
          responseStatus: 200,
          responseMessage: 'Already registered',
          userId: userId,
          eventId: eventId,
          receivedAt: new Date(startTime),
          processedAt: new Date()
        });
        
        return res.status(200).json({ success: true, message: 'Already registered' });
      }

      // Use quantity from order ID
      const ticketQuantity = orderQuantity;

      // Calculate base price (revenue without payment gateway fees)
      // Base price = ticket price × quantity
      const ticketPrice = event.price?.amount || event.ticketPrice || 0;
      const basePrice = ticketPrice * ticketQuantity;
      
      console.log('💰 [WEBHOOK] Price calculation:', {
        ticketPrice,
        quantity: ticketQuantity,
        basePrice,
        totalPaid: paymentAmount
      });

      // Prepare participant data
      const participantData = {
        user: userId,
        registeredAt: new Date(),
        status: 'registered',
        quantity: ticketQuantity,
        paymentStatus: 'paid',
        paymentId: cfPaymentId,
        orderId: orderId,
        amountPaid: basePrice, // Use base price for revenue calculation
        questionnaireResponses: []
      };

      // Register user for event (atomic operation)
      const updatedEvent = await Event.findOneAndUpdate(
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
      );

      if (!updatedEvent) {
        // User already registered - this is a duplicate webhook (Cashfree retries)
        console.warn('⚠️ [WEBHOOK] User already registered - duplicate webhook detected, returning success');
        
        // Log duplicate webhook
        await WebhookLog.create({
          type: payload.type,
          orderId: orderId,
          paymentId: cfPaymentId,
          amount: paymentAmount,
          status: 'duplicate',
          signatureVerified: !isCashfreeProduction ? false : isSignatureValid,
          processingTime: Date.now() - startTime,
          payload: payload,
          headers: {
            signature: req.headers['x-webhook-signature'],
            timestamp: req.headers['x-webhook-timestamp'],
            userAgent: req.headers['user-agent']
          },
          responseStatus: 200,
          responseMessage: 'Duplicate webhook - user already registered',
          userId: userId,
          eventId: eventId,
          receivedAt: new Date(startTime),
          processedAt: new Date()
        });
        
        return res.status(200).json({ success: true, message: 'Already processed' });
      }

      // Update user's registered events
      if (!user.registeredEvents.includes(eventId)) {
        user.registeredEvents.push(eventId);
        await user.save();
      }

      // Update analytics
      try {
        await recommendationEngine.updateEventRegistrationAnalytics(userId, eventId);
      } catch (analyticsError) {
        console.error('⚠️ [WEBHOOK] Failed to update analytics:', analyticsError);
      }

      // Generate ticket
      let ticket = null;
      console.log('🎫 [WEBHOOK] Generating ticket for user:', userId);
      try {
        ticket = await ticketService.generateTicket({
          userId,
          eventId: eventId,
          amount: basePrice, // Use base price (revenue amount)
          paymentId: orderId,
          ticketType: ticketQuantity > 1 ? 'group' : 'general',
          quantity: ticketQuantity,
          metadata: {
            registrationSource: 'webhook',
            registeredAt: new Date(),
            slotsBooked: ticketQuantity,
            orderId: orderId,
            basePrice: basePrice, // For revenue calculation
            totalPaid: paymentAmount, // Total including fees
            ticketPrice: ticketPrice // Per-ticket price
          }
        });
        console.log('✅ [WEBHOOK] Ticket generated:', ticket.ticketNumber);
      } catch (ticketError) {
        console.error('❌ [WEBHOOK] Failed to generate ticket:', ticketError);
        // Continue even if ticket generation fails
      }

      // Send confirmation emails asynchronously
      try {
        console.log('📧 [WEBHOOK] Sending registration email to:', user.email);
        await sendEventRegistrationEmail(user.email, user.name, event, ticket);
        console.log('✅ [WEBHOOK] Registration email sent');
      } catch (emailError) {
        console.error('❌ [WEBHOOK] Failed to send registration email:', emailError);
      }

      // Send notification to host
      try {
        await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
        console.log('✅ [WEBHOOK] Host notification sent');
      } catch (emailError) {
        console.error('❌ [WEBHOOK] Failed to send host notification:', emailError);
      }

      // Send in-app booking confirmation notification
      try {
        await notificationService.notifyBookingConfirmed(userId, event, ticket);
        console.log('✅ [WEBHOOK] Booking confirmation notification sent');
      } catch (notifError) {
        console.error('❌ [WEBHOOK] Failed to send booking confirmation:', notifError);
      }

      console.log('✅ [WEBHOOK] Payment processed successfully - Registration and ticket created');

      // Create success webhook log
      webhookLog = await WebhookLog.create({
        type: payload.type,
        orderId: orderId,
        paymentId: cfPaymentId,
        amount: paymentAmount,
        status: 'success',
        signatureVerified: true,
        processingTime: Date.now() - startTime,
        payload: payload,
        headers: {
          signature: req.headers['x-webhook-signature'],
          timestamp: req.headers['x-webhook-timestamp'],
          userAgent: req.headers['user-agent']
        },
        responseStatus: 200,
        responseMessage: 'Payment processed successfully',
        userId: userId,
        eventId: eventId,
        ticketCreated: !!ticket,
        ticketId: ticket?._id,
        emailSent: true,
        receivedAt: new Date(startTime),
        processedAt: new Date()
      });

    } else if (payload.type === 'PAYMENT_FAILED_WEBHOOK') {
      // Payment failed
      console.log('❌ [WEBHOOK] Payment failed:', payload.data?.order?.order_id);
      
      // Log failed payment
      await WebhookLog.create({
        type: payload.type,
        orderId: payload.data?.order?.order_id || 'UNKNOWN',
        paymentId: payload.data?.payment?.cf_payment_id,
        amount: payload.data?.payment?.payment_amount,
        status: 'failed',
        signatureVerified: true,
        processingTime: Date.now() - startTime,
        error: {
          message: 'Payment failed',
          code: payload.data?.payment?.payment_status || 'PAYMENT_FAILED'
        },
        payload: payload,
        headers: {
          signature: req.headers['x-webhook-signature'],
          timestamp: req.headers['x-webhook-timestamp'],
          userAgent: req.headers['user-agent']
        },
        responseStatus: 200,
        responseMessage: 'Payment failed acknowledged',
        receivedAt: new Date(startTime),
        processedAt: new Date()
      });
    } else if (payload.type === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      // User closed payment window/abandoned payment
      console.log('⚠️ [WEBHOOK] User dropped payment:', payload.data?.order?.order_id || 'UNKNOWN');
      
      // Log dropped payment
      await WebhookLog.create({
        type: payload.type,
        orderId: payload.data?.order?.order_id || 'UNKNOWN',
        paymentId: payload.data?.payment?.cf_payment_id,
        amount: payload.data?.payment?.payment_amount,
        status: 'dropped',
        signatureVerified: true,
        processingTime: Date.now() - startTime,
        error: {
          message: 'User abandoned payment',
          code: 'USER_DROPPED'
        },
        payload: payload,
        headers: {
          signature: req.headers['x-webhook-signature'],
          timestamp: req.headers['x-webhook-timestamp'],
          userAgent: req.headers['user-agent']
        },
        responseStatus: 200,
        responseMessage: 'User drop acknowledged',
        receivedAt: new Date(startTime),
        processedAt: new Date()
      });
    } else {
      // Unknown webhook type - log and acknowledge
      console.log('⚠️ [WEBHOOK] Unknown webhook type:', payload.type);
      
      await WebhookLog.create({
        type: payload.type || 'UNKNOWN',
        orderId: payload.data?.order?.order_id || 'UNKNOWN',
        status: 'unknown',
        signatureVerified: true,
        processingTime: Date.now() - startTime,
        payload: payload,
        headers: {
          signature: req.headers['x-webhook-signature'],
          timestamp: req.headers['x-webhook-timestamp'],
          userAgent: req.headers['user-agent']
        },
        responseStatus: 200,
        responseMessage: 'Unknown webhook type acknowledged',
        receivedAt: new Date(startTime),
        processedAt: new Date()
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [WEBHOOK] Critical error:', error);
    console.error('❌ [WEBHOOK] Stack trace:', error.stack);
    
    // Log webhook error
    try {
      await WebhookLog.create({
        type: payload?.type || 'UNKNOWN',
        orderId: payload?.data?.order?.order_id || 'UNKNOWN',
        status: 'failed',
        signatureVerified: false,
        processingTime: Date.now() - startTime,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code || 'UNKNOWN_ERROR'
        },
        payload: payload || { raw: req.body?.toString() },
        headers: {
          signature: req.headers['x-webhook-signature'],
          timestamp: req.headers['x-webhook-timestamp'],
          userAgent: req.headers['user-agent']
        },
        responseStatus: 500,
        responseMessage: 'Webhook processing failed',
        receivedAt: new Date(startTime),
        processedAt: new Date()
      });
    } catch (logError) {
      console.error('❌ [WEBHOOK] Failed to log error:', logError);
    }
    
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;
