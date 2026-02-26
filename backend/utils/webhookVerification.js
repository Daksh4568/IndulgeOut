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

    // Reject webhooks older than 30 minutes (1800 seconds) for production
    // Users may take time on payment page, bank OTP, etc.
    const maxAllowedAge = 1800; // 30 minutes
    if (timeDifference > maxAllowedAge) {
      console.error('❌ [Webhook Verification] Timestamp too old:', timeDifference, 'seconds (max:', maxAllowedAge, 'seconds)');
      return false;
    }

    // Create signature payload: timestamp.rawBody
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signedPayload = `${receivedTimestamp}.${payloadString}`;
    
    // Debug logging
    console.log('🔍 [DEBUG] Payload type:', typeof payload);
    console.log('🔍 [DEBUG] Payload string length:', payloadString.length);
    console.log('🔍 [DEBUG] Timestamp used:', receivedTimestamp);
    console.log('🔍 [DEBUG] Signed payload length:', signedPayload.length);
    console.log('🔍 [DEBUG] Signed payload first 150 chars:', signedPayload.substring(0, 150));
    console.log('🔍 [DEBUG] Signed payload last 100 chars:', signedPayload.substring(signedPayload.length - 100));
    
    // Use webhook-specific secret key (separate from API secret)
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;
    console.log('🔍 [DEBUG] Webhook secret starts with:', webhookSecret?.substring(0, 15) + '...');
    console.log('🔍 [DEBUG] Webhook secret length:', webhookSecret?.length);
    console.log('🔍 [DEBUG] Received signature:', receivedSignature);
    
    if (!webhookSecret) {
      console.error('❌ [Webhook Verification] No webhook secret configured');
      return false;
    }

    // Compute expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
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
