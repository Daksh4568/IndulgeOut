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
    // Handle both old and new Cashfree webhook formats
    let receivedTimestamp;
    let receivedSignature;
    
    // NEW FORMAT (2023-08-01): Separate headers for signature and timestamp
    if (timestamp && !signature.includes('.')) {
      receivedTimestamp = timestamp;
      receivedSignature = signature;
      console.log('🔐 [Webhook] Using NEW format: separate signature and timestamp headers');
    } 
    // OLD FORMAT: timestamp + '.' + signature combined
    else if (signature.includes('.')) {
      const signatureParts = signature.split('.');
      if (signatureParts.length !== 2) {
        console.error('❌ [Webhook Verification] Invalid signature format');
        return false;
      }
      receivedTimestamp = signatureParts[0];
      receivedSignature = signatureParts[1];
      console.log('🔐 [Webhook] Using OLD format: combined timestamp.signature');
    } else {
      console.error('❌ [Webhook Verification] Invalid signature format');
      return false;
    }

    // Verify timestamp (prevent replay attacks)
    // Timestamp is in milliseconds, convert to seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(receivedTimestamp, 10);
    const webhookTimeSeconds = webhookTime > 9999999999 ? Math.floor(webhookTime / 1000) : webhookTime;
    const timeDifference = Math.abs(currentTime - webhookTimeSeconds);

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
      .digest('base64');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );

    if (isValid) {
      console.log('✅ [Webhook Verification] Signature verified successfully');
    } else {
      console.error('❌ [Webhook Verification] Signature mismatch');
      console.error('   Expected:', expectedSignature.substring(0, 20) + '...');
      console.error('   Received:', receivedSignature.substring(0, 20) + '...');
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
