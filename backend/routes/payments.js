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
const { sendPurchaseEvent } = require('../utils/metaCapi.js');
// Webhook verification temporarily disabled
// const { verifyCashfreeWebhook } = require('../utils/webhookVerification.js');

const router = express.Router();

// Helper function to find event by ID or slug
async function findEventByIdOrSlug(identifier) {
  const mongoose = require('mongoose');
  
  // Check if identifier is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier) && identifier.match(/^[0-9a-fA-F]{24}$/)) {
    return await Event.findById(identifier);
  } else {
    // Search by slug
    return await Event.findOne({ slug: identifier });
  }
}

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
    const { 
      eventId, 
      amount, 
      quantity = 1, 
      basePrice,              // ✅ Receive base price
      gstAndOtherCharges,     // ✅ Receive GST
      platformFees,           // ✅ Receive platform fees
      questionnaireResponses = [], 
      groupingOffer, 
      additionalPersons = [],
      couponCode              // ✅ Receive coupon code
    } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Payment order request:', { 
      eventId, userId, amount, quantity, 
      basePrice, gstAndOtherCharges, platformFees,
      hasQuestionnaireResponses: questionnaireResponses.length > 0 
    });

    // Fetch event details
    let event = await findEventByIdOrSlug(eventId);
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Populate host after finding
    event = await Event.findById(event._id).populate('host', 'name email');

    console.log('Event found:', {
      title: event.title,
      priceAmount: event.price?.amount,
      ticketPrice: event.ticketPrice,
      requestedAmount: amount
    });

    // Use provided amount (from billing page with fees) or calculate from current effective price
    const currentEventPrice = event.getCurrentPrice();
    const ticketPrice = amount || currentEventPrice * quantity;
    
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

    // Create unique order ID with quantity (use event._id to ensure ObjectId is in orderId, not slug)
    const orderId = `ORDER_${Date.now()}_${userId}_${event._id}_${quantity || 1}`;
    
    // TODO: Temporarily disabled metadata storage due to Cashfree sandbox issues
    // Responses will be handled via PaymentCallback sessionStorage instead
    // Re-enable this once Cashfree sandbox is stable
    console.log('📝 Questionnaire responses received (will be processed via callback):', {
      orderId,
      hasResponses: questionnaireResponses.length > 0,
      responsesCount: questionnaireResponses.length
    });

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
    console.log('Fee breakdown to be stored:', { basePrice, gstAndOtherCharges, platformFees });
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

    // Store fee breakdown and coupon in session for verify-payment to retrieve
    // This ensures fees and coupon are persisted even if webhook fires first
    // If frontend didn't send basePrice (e.g. EventDetailNew quick-register), compute it server-side
    const computedBasePrice = basePrice || (currentEventPrice * quantity);
    if (!global.pendingPaymentFees) global.pendingPaymentFees = {};
    global.pendingPaymentFees[orderId] = {
      basePrice: computedBasePrice,
      gstAndOtherCharges: gstAndOtherCharges || parseFloat((computedBasePrice * 0.026).toFixed(2)),
      platformFees: platformFees || parseFloat((computedBasePrice * 0.03).toFixed(2)),
      couponCode: couponCode || null,
      groupingOffer: groupingOffer || null,
      additionalPersons: additionalPersons || [],
      questionnaireResponses: questionnaireResponses || [],
      createdAt: Date.now()
    };

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
      questionnaireResponses = []
      // Note: basePrice, gst, platformFees, couponCode will be retrieved from global store or req.body
    } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Verifying payment:', { orderId, eventId, userId });

    // Retrieve fee breakdown and coupon from global store (set by create-order)
    const storedFees = global.pendingPaymentFees?.[orderId] || {};
    
    // Fetch event early so we can compute server-side price if needed
    let verifyEvent = await findEventByIdOrSlug(eventId);
    const serverSideBasePrice = verifyEvent ? verifyEvent.getCurrentPrice() * (parseInt(quantity) || 1) : 0;
    
    const basePrice = req.body.basePrice || storedFees.basePrice || serverSideBasePrice;
    const gstAndOtherCharges = req.body.gstAndOtherCharges || storedFees.gstAndOtherCharges || parseFloat((serverSideBasePrice * 0.026).toFixed(2));
    const platformFees = req.body.platformFees || storedFees.platformFees || parseFloat((serverSideBasePrice * 0.03).toFixed(2));
    const totalAmount = req.body.totalAmount || (basePrice + gstAndOtherCharges + platformFees);
    const couponCode = req.body.couponCode || storedFees.couponCode || null;
    
    // Clean up stored fees
    if (global.pendingPaymentFees?.[orderId]) {
      delete global.pendingPaymentFees[orderId];
    }
    
    console.log('Fee breakdown retrieved:', { basePrice, gstAndOtherCharges, platformFees, totalAmount });

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
    // Reuse the event already fetched for price computation, populate host
    let existingEvent = verifyEvent
      ? await Event.findById(verifyEvent._id).populate('host', 'name email')
      : null;
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const alreadyRegistered = existingEvent.participants.some(
      p => p.user.toString() === userId
    );

    if (alreadyRegistered) {
      console.log('⚠️ [VERIFY-PAYMENT] User already registered (webhook likely processed this)');
      
      // Find existing ticket (use resolved _id, not raw eventId which could be a slug)
      const existingTicket = await require('../models/Ticket').findOne({
        user: userId,
        event: existingEvent._id,
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

    // ==================== COUPON VALIDATION & APPLICATION ====================
    let couponData = null;
    if (couponCode && couponCode.trim()) {
      console.log(`🎟️ [VERIFY-PAYMENT] Validating coupon: ${couponCode} for user ${userId}`);
      const couponValidation = await existingEvent.validateCoupon(couponCode, userId, basePrice);
      
      if (couponValidation.valid) {
        couponData = couponValidation.coupon;
        console.log(`✅ [VERIFY-PAYMENT] Coupon validated: ${couponCode}, discount: ₹${couponData.discountApplied}`);
        
        // Apply the coupon (increment usage count)
        await existingEvent.applyCoupon(couponCode, userId, couponData.discountApplied);
      } else {
        console.log(`⚠️ [VERIFY-PAYMENT] Coupon validation failed: ${couponValidation.message}`);
        // Don't fail the registration, just log the error
      }
    }
    // ==================== END COUPON VALIDATION ====================

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

    // Add coupon details if applicable
    if (couponData) {
      participantData.couponUsed = {
        code: couponData.code,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        discountApplied: couponData.discountApplied
      };
      console.log(`✅ [VERIFY-PAYMENT] Coupon data added to participant:`, participantData.couponUsed);
    }

    // Register user for event (atomic operation) — use resolved ObjectId, not raw eventId
    const event = await Event.findOneAndUpdate(
      {
        _id: existingEvent._id,
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
        basePrice: basePrice || 0, // Base price from frontend (organizer's revenue - ticket price only)
        gstAndOtherCharges: gstAndOtherCharges || 0,
        platformFees: platformFees || 0,
        totalPaid: totalAmount || (basePrice + (gstAndOtherCharges || 0) + (platformFees || 0)) // Total amount customer paid
      };
      
      // Validation: Ensure basePrice is properly set
      if (!basePrice || basePrice === 0) {
        console.warn('⚠️ [Payment Ticket] basePrice is missing or zero! This will affect revenue calculation.');
      }
      
      // Validation: Check if basePrice + fees approximately equals totalAmount
      if (basePrice && totalAmount) {
        const calculatedTotal = basePrice + (gstAndOtherCharges || 0) + (platformFees || 0);
        if (Math.abs(calculatedTotal - totalAmount) > 1) {
          console.warn(`⚠️ [Payment Ticket] Amount mismatch! basePrice(${basePrice}) + fees(${(gstAndOtherCharges || 0) + (platformFees || 0)}) = ${calculatedTotal} but totalAmount = ${totalAmount}`);
        }
      }
      
      if (groupingOffer) {
        ticketMetadata.groupingOffer = groupingOffer.tierLabel;
        ticketMetadata.tierPeople = groupingOffer.tierPeople;
      }
      
      // Add coupon information to ticket metadata
      if (couponData) {
        ticketMetadata.couponCode = couponData.code;
        ticketMetadata.couponDiscount = couponData.discountApplied;
        ticketMetadata.couponDiscountType = couponData.discountType;
        ticketMetadata.couponDiscountValue = couponData.discountValue;
        ticketMetadata.originalAmount = (basePrice || 0) + (couponData.discountApplied || 0);
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

      // Update ticket with payment details, gateway response, and reconciliation status
      try {
        const Ticket = require('../models/Ticket');
        const calculatedTotalPaid = totalAmount || (basePrice + (gstAndOtherCharges || 0) + (platformFees || 0));
        await Ticket.findByIdAndUpdate(ticket._id, {
          $set: {
            'metadata.totalPaid': calculatedTotalPaid,
            'gatewayResponse.paymentId': payment.cf_payment_id?.toString(),
            'gatewayResponse.paymentStatus': payment.payment_status,
            'gatewayResponse.paymentMethod': payment.payment_method || 'unknown',
            settlementStatus: 'captured',
            reconciliationStatus: 'verified',
            lastReconciliationDate: new Date()
          }
        });
        console.log(`✅ [Payment Ticket] Updated ticket ${ticket.ticketNumber} with payment & reconciliation details`);
      } catch (updateErr) {
        console.error('⚠️ [Payment Ticket] Failed to update payment details:', updateErr.message);
      }
    } catch (ticketError) {
      console.error('❌ [Payment Ticket] Failed to generate ticket:', ticketError.message);
      console.error('❌ [Payment Ticket Stack]:', ticketError.stack);
      // Continue without failing the entire registration
    }

    // Update questionnaire submission as paid (if exists)
    if (ticket && ticket.ticketNumber) {
      try {
        const questionnaireUpdate = await Event.findOneAndUpdate(
          {
            _id: event._id,
            'questionnaireSubmissions.user': userId
          },
          {
            $set: {
              'questionnaireSubmissions.$.isPaid': true,
              'questionnaireSubmissions.$.ticketNumber': ticket.ticketNumber
            }
          }
        );
        if (questionnaireUpdate) {
          console.log('✅ [VERIFY-PAYMENT] Questionnaire marked as paid for user:', userId);
        }
      } catch (qError) {
        console.error('⚠️ [VERIFY-PAYMENT] Failed to update questionnaire isPaid flag:', qError);
      }
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
    // Debug: Log the raw body type
    console.log('🔍 [DEBUG] req.body type:', typeof req.body, 'isBuffer:', Buffer.isBuffer(req.body));
    
    // Parse payload - handle both raw buffer and already-parsed object
    let rawBody;
    if (Buffer.isBuffer(req.body)) {
      // Body is raw buffer (from express.raw middleware)
      rawBody = req.body.toString('utf8');
      payload = JSON.parse(rawBody);
      console.log('✅ [DEBUG] Using raw buffer body (correct for signature verification)');
      console.log('🔍 [DEBUG] Raw body length:', rawBody.length);
      console.log('🔍 [DEBUG] Raw body first 200 chars:', rawBody.substring(0, 200));
    } else if (typeof req.body === 'object') {
      // Body already parsed by express.json() middleware
      payload = req.body;
      rawBody = JSON.stringify(payload);
      console.warn('⚠️ [DEBUG] Body already parsed - signature verification may fail!');
    } else if (typeof req.body === 'string') {
      // Body is string
      rawBody = req.body;
      payload = JSON.parse(rawBody);
      console.log('✅ [DEBUG] Using string body');
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
      hasTimestamp: !!timestamp,
      signatureLength: signature?.length,
      timestampValue: timestamp
    });
    
    // ⚠️ WEBHOOK SIGNATURE VERIFICATION TEMPORARILY DISABLED
    // TODO: Re-enable after IP whitelisting and production testing
    // For security, enable signature verification before scaling platform
    console.warn('⚠️⚠️⚠️ [WEBHOOK] SIGNATURE VERIFICATION DISABLED - ACCEPTING ALL WEBHOOKS ⚠️⚠️⚠️');
    console.log('🔍 [DEBUG] Webhook headers:', { signature: !!signature, timestamp: !!timestamp });
    
    // Determine if we're using production Cashfree credentials
    const isCashfreeProduction = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_');
    console.log(`🔍 [WEBHOOK] Cashfree mode: ${isCashfreeProduction ? 'PRODUCTION' : 'SANDBOX'}`);

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
      let event = await findEventByIdOrSlug(eventId);
      if (!event) {
        console.error('❌ [WEBHOOK] Event not found:', eventId);
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Populate host after finding
      event = await Event.findById(event._id).populate('host', 'name email');
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
          signatureVerified: false, // Verification temporarily disabled
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

      // Retrieve stored order data (basePrice, questionnaire, coupon, groupingOffer)
      // This was saved at create-order time with the correct effective price
      let questionnaireResponses = [];
      let groupingOffer = null;
      let couponCode = null;
      
      const storedData = global.pendingPaymentFees?.[orderId];
      
      // Calculate base price: prefer stored value (from create-order time), fallback to current price
      const ticketPrice = storedData?.basePrice
        ? storedData.basePrice / ticketQuantity  // Per-ticket price from stored total
        : event.getCurrentPrice();
      const basePrice = storedData?.basePrice || (ticketPrice * ticketQuantity);
      
      // Calculate fees from payment amount
      // Total paid = basePrice + GST (2.6%) + Platform Fee (3%)
      // So fees = totalPaid - basePrice
      const totalFees = paymentAmount - basePrice;
      const gstAndOtherCharges = storedData?.gstAndOtherCharges || parseFloat((totalFees * 0.46).toFixed(2));
      const platformFees = storedData?.platformFees || parseFloat((totalFees * 0.54).toFixed(2));
      
      console.log('💰 [WEBHOOK] Price calculation:', {
        ticketPrice,
        quantity: ticketQuantity,
        basePrice,
        totalPaid: paymentAmount,
        gstAndOtherCharges,
        platformFees,
        source: storedData?.basePrice ? 'stored (create-order time)' : 'getCurrentPrice() fallback',
        note: 'basePrice = organizer revenue (ticket price only), totalPaid includes gateway (3%) + GST (2.6%)'
      });
      
      // Validation: Check if totalPaid approximately equals basePrice + 5.6% fees
      const expectedTotal = basePrice * 1.056;
      if (Math.abs(expectedTotal - paymentAmount) > 2) {
        console.warn(`⚠️ [WEBHOOK] Payment amount mismatch! Expected ${expectedTotal.toFixed(2)} (basePrice + 5.6% fees) but got ${paymentAmount}`);
      }

      // Retrieve questionnaire responses and coupon from stored data
      if (storedData) {
        questionnaireResponses = storedData.questionnaireResponses || [];
        groupingOffer = storedData.groupingOffer || null;
        couponCode = storedData.couponCode || null;
        console.log('📦 [WEBHOOK] Retrieved stored data:', { 
          hasQuestions: questionnaireResponses.length > 0, 
          hasGrouping: !!groupingOffer,
          hasCoupon: !!couponCode 
        });
      } else {
        console.log('⚠️ [WEBHOOK] No stored data found for order:', orderId);
      }
      
      // ==================== COUPON VALIDATION & APPLICATION ====================
      let couponData = null;
      if (couponCode && couponCode.trim()) {
        console.log(`🎟️ [WEBHOOK] Validating coupon: ${couponCode} for user ${userId}`);
        const couponValidation = await event.validateCoupon(couponCode, userId, basePrice);
        
        if (couponValidation.valid) {
          couponData = couponValidation.coupon;
          console.log(`✅ [WEBHOOK] Coupon validated: ${couponCode}, discount: ₹${couponData.discountApplied}`);
          
          // Apply the coupon (increment usage count)
          await event.applyCoupon(couponCode, userId, couponData.discountApplied);
        } else {
          console.log(`⚠️ [WEBHOOK] Coupon validation failed: ${couponValidation.message}`);
          // Don't fail the registration, just log the error
        }
      }
      // ==================== END COUPON VALIDATION ====================
      
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
        questionnaireResponses: questionnaireResponses
      };
      
      // Add grouping offer if exists
      if (groupingOffer) {
        participantData.groupingOffer = groupingOffer;
      }
      
      // Add coupon details if applicable
      if (couponData) {
        participantData.couponUsed = {
          code: couponData.code,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          discountApplied: couponData.discountApplied
        };
        console.log(`✅ [WEBHOOK] Coupon data added to participant:`, participantData.couponUsed);
      }

      // Register user for event (atomic operation) — use resolved event._id, not raw eventId
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: event._id,
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
          signatureVerified: false, // Verification temporarily disabled
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

      // Update user's registered events (use event._id for ObjectId)
      if (!user.registeredEvents.includes(event._id.toString())) {
        user.registeredEvents.push(event._id);
        await user.save();
      }

      // Update analytics
      try {
        await recommendationEngine.updateEventRegistrationAnalytics(userId, event._id);
      } catch (analyticsError) {
        console.error('⚠️ [WEBHOOK] Failed to update analytics:', analyticsError);
      }

      // Generate ticket
      let ticket = null;
      console.log('🎫 [WEBHOOK] Generating ticket for user:', userId);
      try {
        ticket = await ticketService.generateTicket({
          userId,
          eventId: event._id,
          amount: basePrice, // Use base price (revenue amount)
          paymentId: orderId,
          ticketType: ticketQuantity > 1 ? 'group' : 'general',
          quantity: ticketQuantity,
          metadata: {
            registrationSource: 'webhook',
            registeredAt: new Date(),
            slotsBooked: ticketQuantity,
            orderId: orderId,
            basePrice: basePrice,                     // ✅ Organizer revenue
            gstAndOtherCharges: gstAndOtherCharges,   // ✅ GST breakdown
            platformFees: platformFees,               // ✅ Platform fee breakdown
            totalPaid: paymentAmount,                 // ✅ Total customer paid
            ticketPrice: ticketPrice,                 // Per-ticket price
            // Coupon information
            couponCode: couponData?.code || null,
            couponDiscount: couponData?.discountApplied || 0,
            couponDiscountType: couponData?.discountType || null,
            couponDiscountValue: couponData?.discountValue || 0,
            originalAmount: couponData ? (basePrice + (couponData.discountApplied || 0)) : null
          }
        });
        console.log('✅ [WEBHOOK] Ticket generated:', ticket.ticketNumber);

        // Update ticket with gateway response and reconciliation status
        try {
          const Ticket = require('../models/Ticket');
          await Ticket.findByIdAndUpdate(ticket._id, {
            $set: {
              'gatewayResponse.paymentId': cfPaymentId?.toString(),
              'gatewayResponse.paymentStatus': 'SUCCESS',
              'gatewayResponse.paymentMethod': payload.data?.payment?.payment_method || 'unknown',
              settlementStatus: 'captured',
              reconciliationStatus: 'verified',
              lastReconciliationDate: new Date()
            }
          });
          console.log(`✅ [WEBHOOK] Updated ticket ${ticket.ticketNumber} with payment & reconciliation details`);
        } catch (updateErr) {
          console.error('⚠️ [WEBHOOK] Failed to update ticket payment details:', updateErr.message);
        }
      } catch (ticketError) {
        console.error('❌ [WEBHOOK] Failed to generate ticket:', ticketError);
        // Continue even if ticket generation fails
      }

      // Update questionnaire submission as paid (if exists)
      if (ticket && ticket.ticketNumber) {
        try {
          const questionnaireUpdate = await Event.findOneAndUpdate(
            {
              _id: event._id,
              'questionnaireSubmissions.user': userId
            },
            {
              $set: {
                'questionnaireSubmissions.$.isPaid': true,
                'questionnaireSubmissions.$.ticketNumber': ticket.ticketNumber
              }
            }
          );
          if (questionnaireUpdate) {
            console.log('✅ [WEBHOOK] Questionnaire marked as paid for user:', userId);
          }
        } catch (qError) {
          console.error('⚠️ [WEBHOOK] Failed to update questionnaire isPaid flag:', qError);
        }
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

      // Track purchase in Meta Conversions API
      try {
        console.log('📊 [META CAPI] Sending Purchase event to Meta');
        await sendPurchaseEvent(
          {
            email: user.email,
            phone: user.phone,
            userId: user._id,
            ip: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
            // Note: fbp and fbc would need to be passed from frontend in future
          },
          {
            amount: paymentAmount,
            eventId: event._id, // Use ObjectId for consistent tracking
            eventSlug: event.slug, // Pass slug for SEO-friendly URLs
            orderId: orderId,
            quantity: ticketQuantity,
            eventName: event.title,
            category: event.categories?.[0] || 'Events',
            city: event.location?.city || 'Unknown',
            date: event.date
          }
        );
        console.log('✅ [META CAPI] Purchase event sent successfully');
      } catch (metaError) {
        console.error('❌ [META CAPI] Failed to send Purchase event:', metaError);
        // Don't fail webhook if Meta tracking fails
      }

      // Clean up stored fees and coupon data
      if (global.pendingPaymentFees?.[orderId]) {
        delete global.pendingPaymentFees[orderId];
        console.log('🗑️ [WEBHOOK] Cleaned up stored payment data for order:', orderId);
      }

      // Create success webhook log
      webhookLog = await WebhookLog.create({
        type: payload.type,
        orderId: orderId,
        paymentId: cfPaymentId,
        amount: paymentAmount,
        status: 'success',
        signatureVerified: false, // Verification temporarily disabled
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
        signatureVerified: false, // Verification temporarily disabled,
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
        signatureVerified: false, // Verification temporarily disabled
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
        signatureVerified: false, // Verification temporarily disabled
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
