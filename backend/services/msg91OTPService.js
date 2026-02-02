const axios = require('axios');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/emailService');

class MSG91OTPService {
  constructor() {
    // MSG91 configuration
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.senderId = process.env.MSG91_SENDER_ID || 'INDOUT';
    this.templateId = process.env.MSG91_TEMPLATE_ID;
    this.apiUrl = 'https://control.msg91.com/api/v5';
    
    if (!this.authKey) {
      console.warn('MSG91 credentials not configured. OTP service will use mock mode.');
    }
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via SMS using MSG91
   * @param {String} phoneNumber - Phone number (10-digit Indian number)
   * @param {String} otp - The OTP to send
   */
  async sendSMS(phoneNumber, otp) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.authKey) {
        // Mock mode for development
        console.log(`[MOCK SMS] Sending OTP ${otp} to ${formattedPhone}`);
        return {
          success: true,
          messageId: 'mock-sms-' + Date.now(),
          mock: true
        };
      }

      // MSG91 SMS API request
      const response = await axios.post(
        `${this.apiUrl}/flow/`,
        {
          sender: this.senderId,
          short_url: '0',
          mobiles: formattedPhone,
          var1: otp, // OTP variable
          var2: 'IndulgeOut', // Brand name
          template_id: this.templateId
        },
        {
          headers: {
            'authkey': this.authKey,
            'content-type': 'application/json'
          }
        }
      );

      console.log(`✅ SMS sent successfully to ${formattedPhone} via MSG91`);

      return {
        success: true,
        messageId: response.data.request_id || response.data.message_id,
        status: response.data.type || 'success'
      };
    } catch (error) {
      console.error('❌ Error sending OTP via MSG91:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send SMS'
      };
    }
  }

  /**
   * Send OTP via Email
   * @param {String} email - Email address
   * @param {String} otp - The OTP to send
   * @param {String} userName - User's name
   */
  async sendEmail(email, otp, userName = 'User') {
    try {
      if (!this.authKey) {
        // Mock mode for development
        console.log(`[MOCK EMAIL] Sending OTP ${otp} to ${email}`);
        return {
          success: true,
          messageId: 'mock-email-' + Date.now(),
          mock: true
        };
      }

      // Send email using the emailService utility
      await sendOTPEmail(email, userName, otp);

      console.log(`✅ OTP email sent successfully to ${email}`);

      return {
        success: true,
        messageId: 'email-' + Date.now(),
        status: 'sent'
      };
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Send OTP based on method (sms or email)
   * @param {Object} options - { method: 'sms'|'email', to: 'phone/email', otp, userName }
   */
  async sendOTP(options) {
    const { method, to, otp, userName } = options;

    if (method === 'sms') {
      return await this.sendSMS(to, otp);
    } else if (method === 'email') {
      return await this.sendEmail(to, otp, userName);
    } else {
      return {
        success: false,
        error: 'Invalid OTP method. Use "sms" or "email"'
      };
    }
  }

  /**
   * Format phone number for Indian numbers
   * @param {String} phoneNumber - 10-digit Indian mobile number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Return 10-digit number without country code for MSG91
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return cleaned;
    }
    
    // If it has country code, remove it
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned.substring(2);
    }
    
    throw new Error('Invalid phone number format. Please provide a 10-digit Indian mobile number');
  }

  /**
   * Check if OTP rate limit is exceeded
   * @param {Date} lastOTPSent - Last OTP sent time
   * @param {Number} attempts - Number of attempts
   */
  isRateLimited(lastOTPSent, attempts) {
    const now = new Date();
    const timeSinceLastOTP = lastOTPSent ? now - lastOTPSent : Infinity;
    
    // Rate limiting rules:
    // - Max 5 attempts per hour
    // - Min 1 minute between consecutive requests
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    
    if (timeSinceLastOTP < oneMinute) {
      return { 
        limited: true, 
        reason: 'Please wait 1 minute before requesting another OTP',
        retryAfter: Math.ceil((oneMinute - timeSinceLastOTP) / 1000) 
      };
    }
    
    if (attempts >= 5 && timeSinceLastOTP < oneHour) {
      return { 
        limited: true, 
        reason: 'Too many OTP requests. Please try again after 1 hour',
        retryAfter: Math.ceil((oneHour - timeSinceLastOTP) / 1000)
      };
    }
    
    return { limited: false };
  }

  /**
   * Validate OTP format
   */
  isValidOTP(otp) {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  isValidPhone(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  }
}

module.exports = new MSG91OTPService();
