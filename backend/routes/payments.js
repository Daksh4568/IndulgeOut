const express = require('express');
const axios = require('axios');
const { Cashfree } = require('cashfree-pg');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const { authMiddleware } = require('../utils/authUtils.js');
const { sendEventRegistrationEmail, sendEventNotificationToHost } = require('../utils/emailService.js');
const recommendationEngine = require('../services/recommendationEngine.js');

const router = express.Router();

// Initialize Cashfree configuration
Cashfree.XClientId = process.env.CASHFREE_APP_ID || '';
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || '';
// Set environment: 'SANDBOX' for testing, 'PRODUCTION' for live
Cashfree.XEnvironment = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX';

// Create payment order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Payment order request:', { eventId, userId });

    // Fetch event details
    const event = await Event.findById(eventId).populate('host', 'name email');
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('Event found:', {
      title: event.title,
      priceAmount: event.price?.amount,
      ticketPrice: event.ticketPrice
    });

    // Check if event has ticket price
    const ticketPrice = event.price?.amount || event.ticketPrice || 0;
    console.log('Calculated ticket price:', ticketPrice);
    
    if (!ticketPrice || ticketPrice === 0) {
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
      order_amount: ticketPrice,
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
      'https://sandbox.cashfree.com/pg/orders',
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
    res.status(500).json({ 
      message: 'Failed to create payment order', 
      error: error.message 
    });
  }
});

// Verify payment and complete registration
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { orderId, eventId } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Verifying payment:', { orderId, eventId, userId });

    // Fetch order status from Cashfree using REST API
    const cashfreeResponse = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`,
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

    // Register user for event (atomic operation)
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        $expr: { $lt: [{ $size: '$participants' }, '$maxParticipants'] },
        'participants.user': { $ne: userId }
      },
      {
        $push: {
          participants: {
            user: userId,
            registeredAt: new Date(),
            status: 'registered',
            paymentStatus: 'paid',
            paymentId: payment.cf_payment_id,
            orderId: orderId,
            amountPaid: payment.payment_amount
          }
        }
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

    // Update participant count
    await event.updateParticipantCount();

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

    // Send confirmation emails asynchronously
    setImmediate(async () => {
      try {
        await sendEventRegistrationEmail(user.email, user.name, event);
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
      }
    });

    setImmediate(async () => {
      try {
        await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
      } catch (emailError) {
        console.error('Failed to send host notification:', emailError);
      }
    });

    res.json({
      success: true,
      message: 'Payment verified and registration successful',
      event: {
        id: event._id,
        title: event.title,
        date: event.date
      }
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
