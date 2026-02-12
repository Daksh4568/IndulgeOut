const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../utils/authUtils');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/emailService');

// Helper functions
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const isValidOTP = (otp) => /^\d{6}$/.test(otp);
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const router = express.Router();

/**
 * Register New User with OTP
 * POST /api/auth/otp/register
 */
router.post('/otp/register', async (req, res) => {
  try {
    const { name, email, phoneNumber, method } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !method) {
      return res.status(400).json({
        message: 'Name, email, phone number, and method are required'
      });
    }

    // Validate method
    if (!['sms', 'email'].includes(method)) {
      return res.status(400).json({
        message: 'Method must be either "sms" or "email"'
      });
    }

    // Validate formats
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      });
    }

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({
        message: 'Please provide a valid 10-digit Indian mobile number'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phoneNumber: phoneNumber }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ 
          message: 'An account with this email already exists. Please login instead.' 
        });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(409).json({ 
          message: 'An account with this phone number already exists. Please login instead.' 
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via email (SMS temporarily disabled)
    if (method === 'email') {
      try {
        await sendOTPEmail(email, otp, name);
      } catch (error) {
        return res.status(500).json({
          message: `Failed to send OTP: ${error.message}`
        });
      }
    } else {
      // SMS not implemented - for now, just log
      console.log(`SMS OTP for ${phoneNumber}: ${otp}`);
    }

    // Create user account (unverified)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phoneNumber,
      role: 'user',
      otpVerification: {
        otp,
        otpExpiry,
        otpAttempts: 1,
        lastOTPSent: new Date(),
        isPhoneVerified: false
      },
      analytics: {
        registrationDate: new Date(),
        registrationMethod: 'otp',
        lastLogin: new Date()
      }
    });

    await newUser.save();

    console.log(`✅ New user registered and OTP sent to ${method === 'email' ? email : phoneNumber} via ${method}`);

    res.status(201).json({
      message: `OTP sent successfully to your ${method === 'sms' ? 'phone' : 'email'}`,
      expiresIn: 600,
      userId: newUser._id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Failed to register. Please try again.',
      error: error.message
    });
  }
});

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
    if (method === 'sms' && !isValidPhone(identifier)) {
      return res.status(400).json({
        message: 'Please provide a valid 10-digit Indian mobile number'
      });
    }

    if (method === 'email' && !isValidEmail(identifier)) {
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

    // Check rate limiting (simple 1-minute check)
    const lastSent = user.otpVerification?.lastOTPSent;
    if (lastSent && (Date.now() - lastSent.getTime()) < 60000) {
      return res.status(429).json({
        message: 'Please wait 1 minute before requesting another OTP',
        retryAfter: 60
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via email (SMS temporarily disabled)
    let emailSent = false;
    if (method === 'email') {
      try {
        await sendOTPEmail(identifier, otp, user.name);
        emailSent = true;
      } catch (error) {
        return res.status(500).json({
          message: `Failed to send OTP: ${error.message}`
        });
      }
    } else {
      // SMS not implemented - for now, just log
      console.log(`SMS OTP for ${identifier}: ${otp}`);
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

    console.log(`✅ OTP sent to ${identifier} via ${method}`);

    // Check if this is a test/dummy email (common patterns for test accounts)
    const isDummyEmail = method === 'email' && (
      identifier.includes('test@') ||
      identifier.includes('dummy@') ||
      identifier.includes('@test.com') ||
      identifier.includes('@dummy.com') ||
      identifier.includes('@example.com') ||
      identifier.includes('@indulgeout.com') || // Development domain for test accounts
      identifier.endsWith('.test')
    );

    const response = {
      message: `OTP sent successfully to your ${method === 'sms' ? 'phone' : 'email'}`,
      expiresIn: 600 // 10 minutes in seconds
    };

    // Include OTP in response for test accounts (development only)
    if (isDummyEmail) {
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
    if (!isValidOTP(otp)) {
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

    // OTP verified successfully - clear OTP data and activate account
    const isNewUser = !user.otpVerification?.isPhoneVerified;
    
    user.otpVerification = {
      ...user.otpVerification,
      otp: undefined,
      otpExpiry: undefined,
      otpAttempts: 0,
      isPhoneVerified: true
    };

    await user.save();

    // Send welcome email for new users (non-blocking)
    if (isNewUser) {
      setImmediate(async () => {
        try {
          await sendWelcomeEmail(user.email, user.name);
          console.log(`✅ Welcome email sent to: ${user.email}`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
      });
    }

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

    console.log(`✅ User ${isNewUser ? 'registered and verified' : 'logged in'} successfully via OTP: ${user.email}`);

    res.json({
      message: isNewUser ? 'Account verified successfully! Welcome to IndulgeOut.' : 'Login successful',
      token,
      isNewUser,
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

    // Check rate limiting (simple 1-minute check)
    const lastSent = user.otpVerification?.lastOTPSent;
    if (lastSent && (Date.now() - lastSent.getTime()) < 60000) {
      return res.status(429).json({
        message: 'Please wait 1 minute before requesting another OTP',
        retryAfter: 60
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Send OTP via email (SMS temporarily disabled)
    if (method === 'email') {
      try {
        await sendOTPEmail(identifier, otp, user.name);
      } catch (error) {
        return res.status(500).json({
          message: `Failed to resend OTP: ${error.message}`
        });
      }
    } else {
      // SMS not implemented - for now, just log
      console.log(`SMS OTP for ${identifier}: ${otp}`);
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
