/**
 * Test Webhook Locally
 * 
 * PURPOSE: Simulate a Cashfree webhook call to test webhook handler
 * USAGE: node scripts/testWebhook.js <orderId>
 * 
 * This sends a fake webhook to your local server to test:
 * - Signature verification
 * - Ticket creation
 * - Email sending
 * - WebhookLog creation
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Your local server URL
const SERVER_URL = process.env.LOCAL_SERVER_URL || 'http://localhost:5000';

/**
 * Generate Cashfree webhook signature
 */
function generateWebhookSignature(payload) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${timestamp}.${payload}`;
  
  const signature = crypto
    .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
    .update(signedPayload)
    .digest('hex');
  
  return {
    signature: `${timestamp}.${signature}`,
    timestamp: timestamp
  };
}

/**
 * Send test webhook to local server
 */
async function sendTestWebhook(orderId) {
  try {
    console.log('🧪 [Test] Sending test webhook for order:', orderId);

    // Parse order ID to get user and event IDs
    const orderParts = orderId.split('_');
    if (orderParts.length !== 4) {
      throw new Error('Invalid order ID format. Expected: ORDER_timestamp_userId_eventId');
    }

    const [prefix, timestamp, userId, eventId] = orderParts;

    // Create webhook payload (matches Cashfree's format)
    const webhookPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: orderId,
          order_amount: 630.43,
          order_currency: 'INR',
          order_status: 'PAID'
        },
        payment: {
          cf_payment_id: Math.floor(Math.random() * 1000000000),
          payment_status: 'SUCCESS',
          payment_amount: 630.43,
          payment_currency: 'INR',
          payment_message: 'Test payment',
          payment_time: new Date().toISOString(),
          payment_group: 'upi',
          payment_method: {
            upi: {
              upi_id: 'test@paytm'
            }
          }
        },
        customer_details: {
          customer_name: 'Test User',
          customer_id: userId,
          customer_email: 'test@example.com',
          customer_phone: '9999999999'
        }
      }
    };

    const payloadString = JSON.stringify(webhookPayload);

    // Generate signature
    const { signature, timestamp: webhookTimestamp } = generateWebhookSignature(payloadString);

    console.log('📝 [Test] Webhook payload:', webhookPayload);
    console.log('🔐 [Test] Generated signature:', signature);

    // Send webhook to local server
    const response = await axios.post(
      `${SERVER_URL}/api/payments/webhook`,
      payloadString,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': webhookTimestamp,
          'User-Agent': 'Cashfree-Webhook-Test'
        }
      }
    );

    console.log('✅ [Test] Webhook sent successfully!');
    console.log('📊 [Test] Response:', response.data);
    console.log('');
    console.log('🔍 Next steps:');
    console.log('1. Check your terminal for webhook processing logs');
    console.log('2. Check WebhookLog collection in MongoDB');
    console.log('3. Check if ticket was created');
    console.log('4. Check if emails were sent');

  } catch (error) {
    console.error('❌ [Test] Error sending webhook:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Get order ID from command line
const orderId = process.argv[2];

if (!orderId) {
  console.error('❌ Please provide an order ID');
  console.error('Usage: node scripts/testWebhook.js <ORDER_ID>');
  console.error('Example: node scripts/testWebhook.js ORDER_1740274800000_userId_eventId');
  process.exit(1);
}

// Validate order ID format
if (!orderId.startsWith('ORDER_')) {
  console.error('❌ Invalid order ID format');
  console.error('Order ID must start with ORDER_ and follow format: ORDER_timestamp_userId_eventId');
  process.exit(1);
}

// Run the test
sendTestWebhook(orderId);
