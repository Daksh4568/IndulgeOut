const twilio = require('twilio');
const crypto = require('crypto');

class OTPService {
  constructor() {
    // Twilio configuration
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.serviceSid = process.env.TWILIO_SERVICE_SID;
    
    if (this.accountSid && this.authToken) {
      // Configure Twilio with SSL options for Windows compatibility
      this.client = twilio(this.accountSid, this.authToken, {
        httpOptions: {
          timeout: 30000,
          // Add SSL options for Windows development
          agent: process.env.NODE_ENV === 'development' ? 
            require('https').globalAgent : undefined
        }
      });
    } else {
      console.warn('Twilio credentials not configured. OTP service will use mock mode.');
      this.client = null;
    }
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via SMS
   * @param {String} phoneNumber - Phone number with country code (+91 for India)
   * @param {String} otp - The OTP to send
   */
  async sendOTP(phoneNumber, otp) {
    try {
      // Format phone number for Indian numbers
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.client) {
        // Mock mode for development
        console.log(`[MOCK SMS] Sending OTP ${otp} to ${formattedPhone}`);
        return {
          success: true,
          messageId: 'mock-' + Date.now(),
          mock: true
        };
      }

      // Send SMS using Twilio with better error handling
      const message = await this.client.messages.create({
        body: `Your IndulgeOut verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      console.log(`✅ SMS sent successfully to ${formattedPhone}. Message SID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      
      // Handle specific Twilio errors
      if (error.code === 21211) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      } else if (error.code === 21614) {
        return {
          success: false,
          error: 'Phone number is not verified for trial account'
        };
      } else if (error.message?.includes('UNABLE_TO_GET_ISSUER_CERT_LOCALLY')) {
        return {
          success: false,
          error: 'SSL certificate issue. Please check network settings.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  }

  /**
   * Send OTP using Twilio Verify Service (Alternative method)
   * @param {String} phoneNumber - Phone number with country code
   */
  async sendOTPVerify(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.client || !this.serviceSid) {
        // Mock mode
        const otp = this.generateOTP();
        console.log(`[MOCK VERIFY] Sending OTP ${otp} to ${formattedPhone}`);
        return {
          success: true,
          otp: otp, // Return OTP for mock mode
          mock: true
        };
      }

      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications
        .create({
          to: formattedPhone,
          channel: 'sms'
        });

      return {
        success: true,
        status: verification.status,
        verificationSid: verification.sid
      };
    } catch (error) {
      console.error('Error sending OTP via Verify:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify OTP using Twilio Verify Service
   * @param {String} phoneNumber - Phone number
   * @param {String} otp - OTP to verify
   */
  async verifyOTPCode(phoneNumber, otp) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.client || !this.serviceSid) {
        // Mock verification - always return true for development
        console.log(`[MOCK VERIFY] Verifying OTP ${otp} for ${formattedPhone}`);
        return {
          success: true,
          valid: true,
          mock: true
        };
      }

      const verificationCheck = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks
        .create({
          to: formattedPhone,
          code: otp
        });

      return {
        success: true,
        valid: verificationCheck.status === 'approved',
        status: verificationCheck.status
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        valid: false,
        error: error.message
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
    
    // If it's a 10-digit number, add +91 country code
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    
    // If it already has country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    
    // If it already has + and country code
    if (phoneNumber.startsWith('+91')) {
      return phoneNumber;
    }
    
    throw new Error('Invalid phone number format');
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
      return { limited: true, reason: 'Please wait 1 minute before requesting another OTP' };
    }
    
    if (attempts >= 5) {
      return { limited: true, reason: 'Too many OTP requests. Please try again after 1 hour' };
    }
    
    return { limited: false };
  }

  /**
   * Validate OTP format
   */
  isValidOTP(otp) {
    return /^\d{6}$/.test(otp);
  }
}

module.exports = new OTPService();