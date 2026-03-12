const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID = '1462994898219509';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

/**
 * Hash email/phone for privacy (SHA256)
 */
const hash = (value) => {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
};

/**
 * Send Purchase event to Meta Conversions API
 * Call this after payment success (Cashfree webhook)
 * @param  {Object} user - User object with email, phone, ip, userAgent, userId, fbp, fbc
 * @param {Object} order - Order object with amount, eventId, orderId, quantity, eventName, category, city, date
 */
exports.sendPurchaseEvent = async (user, order) => {
  try {
    if (!ACCESS_TOKEN) {
      console.warn('⚠️ META_ACCESS_TOKEN not set - skipping CAPI');
      return;
    }

    const eventId = order.orderId || crypto.randomUUID();

    // Build user_data with all available parameters for better Event Match Quality
    const userData = {
      client_ip_address: user.ip,
      client_user_agent: user.userAgent,
    };
    
    // Add hashed email and phone
    if (user.email) userData.em = [hash(user.email)];
    if (user.phone) userData.ph = [hash(user.phone)];
    
    // Add Facebook parameters for better matching
    if (user.fbp) userData.fbp = user.fbp; // Facebook Browser ID
    if (user.fbc) userData.fbc = user.fbc; // Facebook Click ID
    if (user.userId) userData.external_id = user.userId; // Your user ID

    await axios.post(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`,
      {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId, // For deduplication with browser event
            action_source: 'website',
            event_source_url: `${process.env.FRONTEND_URL || 'https://indulgeout.com'}/events/${order.eventId}`,

            user_data: userData,

            custom_data: {
              currency: 'INR',
              value: order.amount,
              content_ids: [order.eventId],
              content_name: order.eventName || 'Event Ticket',
              content_type: 'event',
              num_items: order.quantity || 1,
              content_category: order.category || 'Events',
              event_city: order.city || 'Unknown',
              event_date: order.date,
            },
          },
        ],
      },
      {
        params: { access_token: ACCESS_TOKEN },
      }
    );

    console.log(`✅ Meta CAPI: Purchase event sent - ₹${order.amount} [${order.city || 'Unknown'}] (Order: ${eventId}) [Match params: ${Object.keys(userData).length}]`);
  } catch (err) {
    console.error('❌ Meta CAPI error:', err.response?.data || err.message);
  }
};

/**
 * Send InitiateCheckout event to Meta Conversions API (optional)
 * @param {Object} user - User object with email, phone
 * @param {Object} order - Order object with amount, eventId
 */
exports.sendInitiateCheckoutEvent = async (user, order) => {
  try {
    if (!ACCESS_TOKEN) return;

    await axios.post(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`,
      {
        data: [
          {
            event_name: 'InitiateCheckout',
            event_time: Math.floor(Date.now() / 1000),
            event_id: crypto.randomUUID(),
            action_source: 'website',
            event_source_url: process.env.FRONTEND_URL || 'https://indulgeout.com',

            user_data: {
              em: user.email ? [hash(user.email)] : undefined,
              ph: user.phone ? [hash(user.phone)] : undefined,
            },

            custom_data: {
              currency: 'INR',
              value: order.amount,
              content_ids: [order.eventId],
              content_type: 'event',
            },
          },
        ],
      },
      {
        params: { access_token: ACCESS_TOKEN },
      }
    );

    console.log(`✅ Meta CAPI: InitiateCheckout event sent`);
  } catch (err) {
    console.error('❌ Meta CAPI InitiateCheckout error:', err.response?.data || err.message);
  }
};
