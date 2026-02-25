/**
 * Cashfree Webhook Verification
 * 
 * SECURITY: Verify webhook requests are genuinely from Cashfree
 * Prevents attackers from sending fake payment success webhooks
 */

const crypto = require('crypto');

/**
 * Verify Cashfree webhook signature
 * @param {Object} payload - Webhook payload
 * @param {String} signature - x-webhook-signature header
 * @param {String} timestamp - x-webhook-timestamp header
 * @returns {Boolean} - True if signature is valid
 */
function verifyCashfreeWebhook(payload, signature, timestamp) {
  try {
    // Cashfree signature format: timestamp + '.' + signature
    const signatureParts = signature.split('.');
    if (signatureParts.length !== 2) {
      console.error('❌ [Webhook Verification] Invalid signature format');
      return false;
    }

    const receivedTimestamp = signatureParts[0];
    const receivedSignature = signatureParts[1];

    // Verify timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(receivedTimestamp, 10);
    const timeDifference = Math.abs(currentTime - webhookTime);

    // Reject webhooks older than 5 minutes (300 seconds)
    if (timeDifference > 300) {
      console.error('❌ [Webhook Verification] Timestamp too old:', timeDifference, 'seconds');
      return false;
    }

    // Create signature payload: timestamp.rawBody
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signedPayload = `${receivedTimestamp}.${payloadString}`;

    // Compute expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
      .update(signedPayload)
      .digest('hex');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (isValid) {
      console.log('✅ [Webhook Verification] Signature verified successfully');
    } else {
      console.error('❌ [Webhook Verification] Signature mismatch');
    }

    return isValid;

  } catch (error) {
    console.error('❌ [Webhook Verification] Error:', error);
    return false;
  }
}

module.exports = {
  verifyCashfreeWebhook
};
