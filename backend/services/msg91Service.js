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

/**
 * Send event ticket confirmation via WhatsApp using MSG91
 * 
 * Requires a WhatsApp template named as per MSG91_TICKET_TEMPLATE_NAME env var.
 * Template should have:
 *   - Header: DOCUMENT (PDF ticket with QR code + event poster)
 *   - Body variables: {{1}} firstName, {{2}} eventName, {{3}} eventDate,
 *                     {{4}} eventTime, {{5}} venueName, {{6}} spotsCount,
 *                     {{7}} ticketNumber
 *   - Button 1 (URL): venue map link (dynamic suffix)
 *   - Button 2 (URL): contact-us page (static)
 * 
 * @param {string} phoneNumber - 10-digit Indian mobile number
 * @param {object} params
 * @param {string} params.userName - User's first name
 * @param {string} params.eventName - Event title
 * @param {string} params.eventDate - Formatted date string
 * @param {string} params.eventTime - Formatted time string
 * @param {string} params.venueName - Venue address + city
 * @param {string} params.venueMapUrl - Full Google Maps URL for the venue
 * @param {string} params.spotsCount - Number of spots booked
 * @param {string} params.ticketNumber - Booking/ticket ID
 * @param {string} params.ticketPdfUrl - URL of PDF ticket document
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendWhatsAppTicket(phoneNumber, params) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateName = process.env.MSG91_TICKET_TEMPLATE_NAME;
  const namespace = process.env.MSG91_NAMESPACE;
  const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;

  if (!authKey || !templateName || !namespace || !integratedNumber) {
    console.warn('⚠️ [MSG91] WhatsApp ticket template not configured. Skipping WhatsApp notification.');
    return { success: false, message: 'WhatsApp ticket service not configured' };
  }

  const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

  try {
    console.log(`📱 [MSG91] Sending WhatsApp ticket to ${formattedPhone} for event: ${params.eventName}`);

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
                  header_1: {
                    type: 'document',
                    value: params.ticketPdfUrl,
                    filename: `IndulgeOut-Ticket-${params.ticketNumber || 'ticket'}.pdf`
                  },
                  body_1: { type: 'text', value: params.userName },
                  body_2: { type: 'text', value: params.eventName },
                  body_3: { type: 'text', value: params.eventDate },
                  body_4: { type: 'text', value: params.eventTime },
                  body_5: { type: 'text', value: params.venueName },
                  body_6: { type: 'text', value: params.spotsCount },
                  body_7: { type: 'text', value: params.ticketNumber },
                  button_1: {
                    subtype: 'url',
                    type: 'text',
                    value: params.venueMapUrl
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

    console.log(`✅ [MSG91] WhatsApp ticket response:`, JSON.stringify(response.data));

    if (response.status === 200) {
      console.log(`✅ [MSG91] WhatsApp ticket sent successfully to ${formattedPhone}`);
      return { success: true, message: 'Ticket sent via WhatsApp' };
    }

    console.error(`❌ [MSG91] Unexpected ticket response:`, response.data);
    return { success: false, message: response.data?.message || 'Failed to send WhatsApp ticket' };

  } catch (error) {
    if (error.response) {
      console.error(`❌ [MSG91] WhatsApp ticket API error:`, error.response.status, error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`❌ [MSG91] WhatsApp ticket request timed out`);
    } else {
      console.error(`❌ [MSG91] WhatsApp ticket error:`, error.message);
    }
    // Don't throw — WhatsApp ticket is non-critical, user already has email
    return { success: false, message: error.message };
  }
}

/**
 * Send WhatsApp marketing/promotional message for an event
 * 
 * Requires a Marketing-category WhatsApp template in MSG91 dashboard.
 * Template should have:
 *   - Header: IMAGE (event poster)
 *   - Body variables: {{1}} userName, {{2}} eventName, {{3}} eventDate,
 *                     {{4}} eventTime, {{5}} venueName
 *   - Button 1 (URL): event link (dynamic suffix = event slug)
 * 
 * @param {string} phoneNumber - 10-digit Indian mobile number
 * @param {object} params
 * @param {string} params.userName - User's first name
 * @param {string} params.eventName - Event title
 * @param {string} params.eventDate - Formatted date string
 * @param {string} params.eventTime - Formatted time string
 * @param {string} params.venueName - Venue address + city
 * @param {string} params.eventImageUrl - Event poster image URL
 * @param {string} params.eventSlug - Event slug for the CTA button URL suffix
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendWhatsAppMarketing(phoneNumber, params) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateName = process.env.MSG91_MARKETING_TEMPLATE_NAME;
  const namespace = process.env.MSG91_NAMESPACE;
  const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;

  if (!authKey || !templateName || !namespace || !integratedNumber) {
    console.warn('⚠️ [MSG91] WhatsApp marketing template not configured. Skipping.');
    return { success: false, message: 'WhatsApp marketing service not configured' };
  }

  const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

  try {
    const components = {
      body_1: { type: 'text', value: params.userName || 'there' },
      body_2: { type: 'text', value: params.eventName || 'an exciting event' },
      body_3: { type: 'text', value: params.eventDate || 'TBD' },
      body_4: { type: 'text', value: params.eventTime || 'TBD' },
      body_5: { type: 'text', value: params.venueName || 'TBD' },
    };

    // Add event poster as image header if available
    if (params.eventImageUrl) {
      components.header_1 = {
        type: 'image',
        value: params.eventImageUrl,
      };
    }

    // Add CTA button with event slug if available
    if (params.eventSlug) {
      components.button_1 = {
        subtype: 'url',
        type: 'text',
        value: params.eventSlug,
      };
    }

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
            language: { code: 'en', policy: 'deterministic' },
            namespace: namespace,
            to_and_components: [
              {
                to: [formattedPhone],
                components,
              }
            ]
          }
        }
      },
      {
        headers: { 'Content-Type': 'application/json', 'authkey': authKey },
        timeout: 15000,
      }
    );

    if (response.status === 200) {
      return { success: true, message: 'Marketing message sent' };
    }
    return { success: false, message: response.data?.message || 'Failed' };
  } catch (error) {
    if (error.response) {
      console.error(`❌ [MSG91] Marketing API error:`, error.response.status, error.response.data);
    }
    return { success: false, message: error.message };
  }
}

module.exports = {
  sendWhatsAppOTP,
  sendWhatsAppTicket,
  sendWhatsAppMarketing,
};
