const axios = require('axios');

/**
 * MSG91 WhatsApp OTP Service
 * 
 * Uses MSG91's WhatsApp Outbound Message API to send OTP via WhatsApp.
 * 
 * Required ENV variables:
 *   MSG91_AUTH_KEY          - Your MSG91 auth key
 *   MSG91_TEMPLATE_NAME     - WhatsApp template name (e.g. indulgeout_otp)
 *   MSG91_NAMESPACE         - Template namespace from MSG91 dashboard
 *   MSG91_INTEGRATED_NUMBER - Your registered WhatsApp business number (with country code)
 * 
 * Run with: node -e "require('./services/msg91Service')"
 */

const MSG91_WHATSAPP_URL = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

/**
 * Send OTP via WhatsApp using MSG91
 * @param {string} phoneNumber - 10-digit Indian mobile number (without country code)
 * @param {string} otp - 6-digit OTP to send
 * @param {string} userName - User's name (unused for now, available for future templates)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendWhatsAppOTP(phoneNumber, otp, userName = 'User') {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateName = process.env.MSG91_TEMPLATE_NAME;
  const namespace = process.env.MSG91_NAMESPACE;
  const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;

  if (!authKey || !templateName || !namespace || !integratedNumber) {
    console.error('❌ MSG91 credentials not configured. Set MSG91_AUTH_KEY, MSG91_TEMPLATE_NAME, MSG91_NAMESPACE, MSG91_INTEGRATED_NUMBER in .env');
    throw new Error('WhatsApp OTP service not configured');
  }

  // Ensure phone number is in correct format (91XXXXXXXXXX)
  const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

  try {
    console.log(`📱 [MSG91] Sending WhatsApp OTP to ${formattedPhone}...`);

    const response = await axios.post(
      MSG91_WHATSAPP_URL,
      {
        integrated_number: integratedNumber,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en',
              policy: 'deterministic'
            },
            namespace: namespace,
            to_and_components: [
              {
                to: [formattedPhone],
                components: {
                  body_1: {
                    type: 'text',
                    value: otp
                  },
                  button_1: {
                    subtype: 'url',
                    type: 'text',
                    value: otp
                  }
                }
              }
            ]
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey
        },
        timeout: 15000
      }
    );

    console.log(`✅ [MSG91] WhatsApp OTP response:`, JSON.stringify(response.data));
    
    // MSG91 returns 200 on success
    if (response.status === 200) {
      console.log(`✅ [MSG91] WhatsApp OTP sent successfully to ${formattedPhone}`);
      return { success: true, message: 'OTP sent via WhatsApp' };
    }

    console.error(`❌ [MSG91] Unexpected response:`, response.data);
    throw new Error(response.data?.message || 'Failed to send WhatsApp OTP');

  } catch (error) {
    if (error.response) {
      const errData = error.response.data;
      const errMsg = typeof errData === 'string' ? errData : (errData?.message || errData?.msg || JSON.stringify(errData));
      console.error(`❌ [MSG91] API error:`, error.response.status, errData);
      
      // Detect WhatsApp not registered on this number
      const lowerMsg = (errMsg || '').toLowerCase();
      if (lowerMsg.includes('not a valid whatsapp') || lowerMsg.includes('not registered') || 
          lowerMsg.includes('invalid whatsapp') || lowerMsg.includes('whatsapp account') ||
          lowerMsg.includes('not on whatsapp')) {
        const notRegisteredError = new Error('This number is not registered on WhatsApp. Please use email login instead.');
        notRegisteredError.code = 'WHATSAPP_NOT_REGISTERED';
        throw notRegisteredError;
      }
      throw new Error(`WhatsApp OTP failed: ${errMsg}`);
    }
    if (error.code === 'ECONNABORTED') {
      console.error(`❌ [MSG91] Request timed out`);
      throw new Error('WhatsApp OTP request timed out. Please try again.');
    }
    throw error;
  }
}

module.exports = {
  sendWhatsAppOTP,
};
