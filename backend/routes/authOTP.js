const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const otpService = require('../services/msg91OTPService');
const { authMiddleware } = require('../utils/authUtils');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements');

const router = express.Router();

/**
 * Send OTP for Login (Phone or Email)
 * POST /api/auth/otp/send
 */
router.post('/otp/send', async (req, res) => {
  try {
    const { identifier, method } = req.body; // identifier can be phone or email

    // Validate required fields
    if (!identifier || !method) {
      return res.status(400).json({
        message: 'Identifier (phone/email) and method are required'
      });
    }

    // Validate method
    if (!['sms', 'email'].includes(method)) {
      return res.status(400).json({
        message: 'Method must be either "sms" or "email"'
      });
    }

    // Validate identifier format based on method
    if (method === 'sms' && !otpService.isValidPhone(identifier)) {
      return res.status(400).json({
        message: 'Please provide a valid 10-digit Indian mobile number'
      });
    }

    if (method === 'email' && !otpService.isValidEmail(identifier)) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      });
    }

    // Find user by phone or email
    const query = method === 'sms' 
      ? { phoneNumber: identifier } 
      : { email: identifier.toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: `No account found with this ${method === 'sms' ? 'phone number' : 'email'}. Please register first.`
      });
    }

    // Check rate limiting
    const rateLimit = otpService.isRateLimited(
      user.otpVerification?.lastOTPSent,
      user.otpVerification?.otpAttempts || 0
    );

    if (rateLimit.limited) {
      return res.status(429).json({
        message: rateLimit.reason,
        retryAfter: rateLimit.retryAfter
      });
    }

    // Generate OTP
    const otp = otpService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP
    const result = await otpService.sendOTP({
      method,
      to: identifier,
      otp,
      userName: user.name
    });

    if (!result.success) {
      return res.status(500).json({
        message: `Failed to send OTP: ${result.error}`
      });
    }

    // Update user with OTP details
    user.otpVerification = {
      otp,
      otpExpiry,
      otpAttempts: (user.otpVerification?.otpAttempts || 0) + 1,
      lastOTPSent: new Date(),
      isPhoneVerified: method === 'sms' ? user.otpVerification?.isPhoneVerified : true
    };

    await user.save();

    console.log(`✅ OTP sent to ${identifier} via ${method}. Mock: ${result.mock || false}`);

    // Check if this is a test/dummy email (common patterns for test accounts)
    const isDummyEmail = method === 'email' && (
      identifier.includes('test@') ||
      identifier.includes('dummy@') ||
      identifier.includes('@test.com') ||
      identifier.includes('@dummy.com') ||
      identifier.includes('@example.com') ||
      identifier.includes('@indulgeout.com') || // Development domain for test accounts
      identifier.endsWith('.test') ||
      result.mock // Also include mock mode
    );

    const response = {
      message: `OTP sent successfully to your ${method === 'sms' ? 'phone' : 'email'}`,
      mock: result.mock || false,
      expiresIn: 600 // 10 minutes in seconds
    };

    // Include OTP in response for test accounts (development only)
    if (isDummyEmail || result.mock) {
      response.otp = otp;
      response.isDummyAccount = true;
      console.log(`⚠️ TEST ACCOUNT: OTP ${otp} returned in response for ${identifier}`);
    }

    res.json(response);

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      message: 'Failed to send OTP. Please try again.',
      error: error.message
    });
  }
});

/**
 * Verify OTP and Login
 * POST /api/auth/otp/verify
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { identifier, otp, method } = req.body;

    // Validate required fields
    if (!identifier || !otp || !method) {
      return res.status(400).json({
        message: 'Identifier, OTP, and method are required'
      });
    }

    // Validate OTP format
    if (!otpService.isValidOTP(otp)) {
      return res.status(400).json({
        message: 'Invalid OTP format. OTP must be 6 digits'
      });
    }

    // Find user
    const query = method === 'sms'
      ? { phoneNumber: identifier }
      : { email: identifier.toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if OTP exists
    if (!user.otpVerification || !user.otpVerification.otp) {
      // If OTP is already cleared and phone is verified, user might have already logged in
      // (React Strict Mode can cause double requests)
      if (user.otpVerification?.isPhoneVerified) {
        // Generate token for already verified user
        const token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            role: user.role,
            hostPartnerType: user.hostPartnerType
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          message: 'Already verified. Login successful',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            hostPartnerType: user.hostPartnerType,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified
          }
        });
      }

      return res.status(400).json({
        message: 'No OTP found. Please request a new OTP'
      });
    }

    // Check if OTP is expired
    if (new Date() > user.otpVerification.otpExpiry) {
      return res.status(400).json({
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Verify OTP
    if (user.otpVerification.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP. Please check and try again'
      });
    }

    // OTP verified successfully - clear OTP data
    user.otpVerification = {
      ...user.otpVerification,
      otp: undefined,
      otpExpiry: undefined,
      otpAttempts: 0,
      isPhoneVerified: true
    };

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate action required notifications in background (non-blocking)
    checkAndGenerateActionRequiredNotifications(user._id).catch(err => {
      console.error('Error generating action required notifications on login:', err);
    });

    console.log(`✅ User logged in successfully via OTP: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        hostPartnerType: user.hostPartnerType,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      message: 'Failed to verify OTP. Please try again.',
      error: error.message
    });
  }
});

/**
 * Resend OTP
 * POST /api/auth/otp/resend
 */
router.post('/otp/resend', async (req, res) => {
  try {
    const { identifier, method } = req.body;

    if (!identifier || !method) {
      return res.status(400).json({
        message: 'Identifier and method are required'
      });
    }

    // Find user
    const query = method === 'sms'
      ? { phoneNumber: identifier }
      : { email: identifier.toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check rate limiting
    const rateLimit = otpService.isRateLimited(
      user.otpVerification?.lastOTPSent,
      user.otpVerification?.otpAttempts || 0
    );

    if (rateLimit.limited) {
      return res.status(429).json({
        message: rateLimit.reason,
        retryAfter: rateLimit.retryAfter
      });
    }

    // Generate new OTP
    const otp = otpService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Send OTP
    const result = await otpService.sendOTP({
      method,
      to: identifier,
      otp,
      userName: user.name
    });

    if (!result.success) {
      return res.status(500).json({
        message: `Failed to resend OTP: ${result.error}`
      });
    }

    // Update user
    user.otpVerification = {
      otp,
      otpExpiry,
      otpAttempts: (user.otpVerification?.otpAttempts || 0) + 1,
      lastOTPSent: new Date(),
      isPhoneVerified: user.otpVerification?.isPhoneVerified
    };

    await user.save();

    console.log(`✅ OTP resent to ${identifier} via ${method}`);

    res.json({
      message: `OTP resent successfully to your ${method === 'sms' ? 'phone' : 'email'}`,
      mock: result.mock || false,
      expiresIn: 600
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({
      message: 'Failed to resend OTP. Please try again.',
      error: error.message
    });
  }
});

module.exports = router;
