const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../utils/authUtils');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/emailService');
const { notifyProfileIncompleteUser } = require('../services/notificationService');
const { sendWhatsAppOTP } = require('../services/msg91Service');

// Helper functions
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const isValidOTP = (otp) => /^\d{6}$/.test(otp);
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const router = express.Router();

/**
 * Register New User (No OTP required on first signup)
 * POST /api/auth/otp/register
 * Similar to B2B registration - direct account creation without OTP verification
 */
router.post('/otp/register', async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({
        message: 'Name, email, and phone number are required'
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

    // Create user account (verified immediately) - B2C only
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phoneNumber,
      role: 'user',
      otpVerification: {
        isPhoneVerified: true // Mark as verified immediately on signup
      },
      analytics: {
        registrationDate: new Date(),
        registrationMethod: 'direct_signup'
      },
      loginCount: 1,
      lastLoginAt: new Date(),
      lastLoginMethod: 'email',
      loginHistory: [{ timestamp: new Date(), method: 'email' }]
    });

    try {
      await newUser.save();
      console.log(`✅ B2C user registered and saved to database: ${email}`);
    } catch (saveError) {
      // Handle duplicate key error (race condition where two requests try to create same user)
      if (saveError.code === 11000) {
        console.log(`⚠️ Duplicate key error during B2C registration for: ${email} - User may have been created by concurrent request`);
        return res.status(409).json({ 
          message: 'An account with this email or phone number already exists.' 
        });
      }
      throw saveError; // Re-throw other errors
    }

    // Generate JWT token immediately
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '90d' }
    );

    console.log(`✅ New B2C user registered successfully: ${email}`);

    // Send welcome email for new B2C user registration
    try {
      await sendWelcomeEmail(newUser.email, newUser.name);
      console.log(`📧 Welcome email sent to new B2C user: ${newUser.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if welcome email fails
    }

    // Check for action required notifications
    try {
      await checkAndGenerateActionRequiredNotifications(newUser._id);
    } catch (notifError) {
      console.error('Failed to generate action required notifications:', notifError);
      // Don't fail registration if notification generation fails
    }

    // Return success response with token and user data
    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        profilePicture: newUser.profilePicture
      }
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
    console.log(`🔐 [OTP] Generated OTP for ${identifier}: ${otp}`);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via email or WhatsApp
    if (method === 'email') {
      try {
        await sendOTPEmail(identifier, otp, user.name);
      } catch (error) {
        return res.status(500).json({
          message: `Failed to send OTP: ${error.message}`
        });
      }
    } else {
      try {
        await sendWhatsAppOTP(identifier, otp, user.name);
      } catch (error) {
        if (error.code === 'WHATSAPP_NOT_REGISTERED') {
          return res.status(400).json({
            message: 'This number is not registered on WhatsApp. Please use email login instead.',
            whatsappNotRegistered: true
          });
        }
        return res.status(500).json({
          message: `Failed to send WhatsApp OTP: ${error.message}`
        });
      }
    }

    // Update user with OTP details
    user.otpVerification = {
      otp,
      otpExpiry,
      otpAttempts: (user.otpVerification?.otpAttempts || 0) + 1,
      lastOTPSent: new Date(),
      isPhoneVerified: method === 'sms' ? user.otpVerification?.isPhoneVerified : true
    };

    await user.save({ validateModifiedOnly: true });

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
      message: `OTP sent successfully to your ${method === 'sms' ? 'WhatsApp' : 'email'}`,
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
 * Verify OTP and Complete Login/Registration
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
        message: 'OTP must be a 6-digit number'
      });
    }

    // Find user by phone or email
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
    if (!user.otpVerification?.otp) {
      return res.status(400).json({
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (new Date() > user.otpVerification.otpExpiry) {
      return res.status(400).json({
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (user.otpVerification.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark phone as verified
    user.otpVerification.isPhoneVerified = true;
    user.otpVerification.otp = undefined; // Clear OTP after successful verification
    user.otpVerification.otpExpiry = undefined;

    // Track login analytics
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    user.lastLoginMethod = method;
    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.push({ timestamp: new Date(), method });

    await user.save({ validateModifiedOnly: true });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType // Include for B2B users
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '90d' }
    );

    console.log(`✅ OTP verified for ${identifier}. User logged in.`);

    // Check for action required notifications
    try {
      await checkAndGenerateActionRequiredNotifications(user._id);
    } catch (notifError) {
      console.error('Failed to generate action required notifications:', notifError);
      // Don't fail login if notification generation fails
    }

    // Check if B2C user profile is incomplete and send notification
    if (user.role === 'user') {
      try {
        const missingFields = [];
        if (!user.age) missingFields.push('age');
        if (!user.gender) missingFields.push('gender');
        if (!user.bio) missingFields.push('bio');
        
        // Only send notification if there are missing fields
        if (missingFields.length > 0) {
          await notifyProfileIncompleteUser(user._id, missingFields);
          console.log(`📢 Sent profile completion notification to ${user.name}`);
        }
      } catch (notifError) {
        console.error('Error sending profile notification:', notifError);
        // Don't fail login if notification fails
      }
    }

    // Return success response with token and user data
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePicture: user.profilePicture,
        hostPartnerType: user.hostPartnerType
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

    // Validate required fields
    if (!identifier || !method) {
      return res.status(400).json({
        message: 'Identifier and method are required'
      });
    }

    // Validate method
    if (!['sms', 'email'].includes(method)) {
      return res.status(400).json({
        message: 'Method must be either "sms" or "email"'
      });
    }

    // Find user by phone or email
    const query = method === 'sms' 
      ? { phoneNumber: identifier } 
      : { email: identifier.toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check rate limiting (1 minute between resends)
    const lastSent = user.otpVerification?.lastOTPSent;
    if (lastSent && (Date.now() - lastSent.getTime()) < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - lastSent.getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitTime} seconds before requesting another OTP`,
        retryAfter: waitTime
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    console.log(`🔐 [OTP] Resend - Generated OTP for ${identifier}: ${otp}`);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via email or WhatsApp
    if (method === 'email') {
      try {
        await sendOTPEmail(identifier, otp, user.name);
      } catch (error) {
        return res.status(500).json({
          message: `Failed to send OTP: ${error.message}`
        });
      }
    } else {
      try {
        await sendWhatsAppOTP(identifier, otp, user.name);
      } catch (error) {
        if (error.code === 'WHATSAPP_NOT_REGISTERED') {
          return res.status(400).json({
            message: 'This number is not registered on WhatsApp. Please use email login instead.',
            whatsappNotRegistered: true
          });
        }
        return res.status(500).json({
          message: `Failed to send WhatsApp OTP: ${error.message}`
        });
      }
    }

    // Update user with new OTP details
    user.otpVerification.otp = otp;
    user.otpVerification.otpExpiry = otpExpiry;
    user.otpVerification.otpAttempts = (user.otpVerification.otpAttempts || 0) + 1;
    user.otpVerification.lastOTPSent = new Date();

    await user.save({ validateModifiedOnly: true });

    console.log(`✅ OTP resent to ${identifier} via ${method}`);

    res.json({
      message: `OTP resent successfully to your ${method === 'sms' ? 'WhatsApp' : 'email'}`,
      expiresIn: 600
    });

  } catch (error) {
    console.error('OTP resend error:', error);
    res.status(500).json({
      message: 'Failed to resend OTP. Please try again.',
      error: error.message
    });
  }
});

module.exports = router;
