const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../utils/authUtils');
const { sendOTPEmail } = require('../utils/emailService');

// Helper functions
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) return cleaned;
  throw new Error('Invalid phone number');
};

const router = express.Router();

/**
 * Send OTP for registration
 * POST /api/otp/register/send
 */
router.post('/register/send', async (req, res) => {
  try {
    const { phoneNumber, email, fullName } = req.body;

    // Validate required fields
    if (!phoneNumber || !email || !fullName) {
      return res.status(400).json({ 
        message: 'Phone number, email, and full name are required' 
      });
    }

    // Format and validate phone number
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber(phoneNumber);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Please provide a valid 10-digit Indian mobile number' 
      });
    }

    // Check if user already exists with this phone or email
    const existingUser = await User.findOne({
      $or: [{ phoneNumber }, { email }]
    });

    if (existingUser) {
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ 
          message: 'Phone number already registered. Try logging in instead.' 
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ 
          message: 'Email already registered. Try logging in instead.' 
        });
      }
    }

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store temporary registration data in JWT
    const tempToken = jwt.sign({
      phoneNumber,
      email,
      fullName,
      otp,
      otpExpiry: otpExpiry.getTime(),
      type: 'registration'
    }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Send OTP to email (SMS temporarily disabled)
    try {
      await sendOTPEmail(email, otp, fullName);
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return res.status(500).json({ 
        message: 'Failed to send OTP. Please try again.' 
      });
    }

    console.log(`SMS OTP for ${formattedPhone}: ${otp}`);

    res.status(200).json({
      message: 'OTP sent successfully to your email',
      tempToken // Frontend will store this temporarily
    });

  } catch (error) {
    console.error('Error in send registration OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Verify OTP and complete registration
 * POST /api/otp/register/verify
 */
router.post('/register/verify', async (req, res) => {
  try {
    const { otp, tempToken, interests } = req.body;

    if (!otp || !tempToken) {
      return res.status(400).json({ message: 'OTP and temporary token are required' });
    }

    // Verify temporary token
    let tokenData;
    try {
      tokenData = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (tokenData.type !== 'registration') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    // Verify OTP
    if (tokenData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > tokenData.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Create new user
    const newUser = new User({
      name: tokenData.fullName, // Map fullName to name field
      email: tokenData.email,
      phoneNumber: tokenData.phoneNumber,
      interests: interests || [],
      otpVerification: {
        isPhoneVerified: true,
        otpAttempts: 0
      },
      analytics: {
        registrationDate: new Date(),
        registrationMethod: 'otp',
        lastLogin: new Date()
      }
    });

    await newUser.save();

    // Generate auth token
    const authToken = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token: authToken,
      user: {
        id: newUser._id,
        name: newUser.name, // Use 'name' to match User model
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        interests: newUser.interests
      }
    });

  } catch (error) {
    console.error('Error in verify registration OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Send OTP for login
 * POST /api/otp/login/send
 */
router.post('/login/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Format phone number
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber(phoneNumber);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Please provide a valid 10-digit Indian mobile number' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Phone number not registered. Please sign up first.' 
      });
    }

    // Check rate limiting (1 minute cooldown)
    const lastSent = user.otpVerification?.lastOTPSent;
    if (lastSent && (Date.now() - lastSent.getTime()) < 60000) {
      return res.status(429).json({ 
        message: 'Please wait 1 minute before requesting another OTP' 
      });
    }

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP details
    user.otpVerification = {
      ...user.otpVerification,
      otp, // Store plain OTP (short-lived, single-use)
      otpExpiry,
      lastOTPSent: new Date(),
      otpAttempts: (user.otpVerification?.otpAttempts || 0) + 1
    };

    await user.save();

    // Send OTP to email (SMS temporarily disabled)
    try {
      await sendOTPEmail(user.email, otp, user.name);
    } catch (error) {
      console.error('Failed to send OTP:', error);
    }
    console.log(`SMS OTP for ${formattedPhone}: ${otp}`);

    res.status(200).json({
      message: 'OTP sent successfully to your email',
      userId: user._id // Frontend will store this temporarily
    });

  } catch (error) {
    console.error('Error in send login OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Verify OTP and login
 * POST /api/otp/login/verify
 */
router.post('/login/verify', async (req, res) => {
  try {
    const { otp, userId } = req.body;

    if (!otp || !userId) {
      return res.status(400).json({ message: 'OTP and user ID are required' });
    }

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is expired
    if (!user.otpVerification?.otpExpiry || new Date() > user.otpVerification.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Verify OTP
    const isValidOTP = otp === user.otpVerification.otp;
    
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Reset OTP attempts and update last login
    user.otpVerification.otpAttempts = 0;
    user.analytics.lastLogin = new Date();
    await user.save();

    // Generate auth token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name, // Use 'name' to match User model
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        interests: user.interests
      }
    });

  } catch (error) {
    console.error('Error in verify login OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Resend OTP
 * POST /api/otp/resend
 */
router.post('/resend', async (req, res) => {
  try {
    const { phoneNumber, type } = req.body; // type: 'login' or 'register'

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Format phone number
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber(phoneNumber);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Please provide a valid 10-digit Indian mobile number' 
      });
    }

    if (type === 'register') {
      // Handle resend for registration (similar to registration flow)
      const otp = generateOTP();
      
      const tempToken = jwt.sign({
        phoneNumber,
        otp,
        otpExpiry: Date.now() + 10 * 60 * 1000,
        type: 'registration'
      }, process.env.JWT_SECRET, { expiresIn: '15m' });

      return res.status(200).json({
        message: 'OTP resent successfully',
        tempToken
      });
    } else {
      // Handle resend for login (similar to login flow)
      const user = await User.findOne({ phoneNumber });
      
      if (!user) {
        return res.status(404).json({ message: 'Phone number not registered' });
      }

      // Rate limit check (1 minute cooldown)
      const lastSent = user.otpVerification?.lastOTPSent;
      if (lastSent && (Date.now() - lastSent.getTime()) < 60000) {
        return res.status(429).json({ 
          message: 'Please wait 1 minute before requesting another OTP' 
        });
      }

      const otp = generateOTP();
      try {
        await sendOTPEmail(user.email, otp, user.name);
      } catch (error) {
        console.error('Failed to send OTP:', error);
      }
      console.log(`SMS OTP for ${formattedPhone}: ${otp}`);

      // Update user
      user.otpVerification = {
        ...user.otpVerification,
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        lastOTPSent: new Date(),
        otpAttempts: (user.otpVerification?.otpAttempts || 0) + 1
      };

      await user.save();

      return res.status(200).json({
        message: 'OTP resent successfully',
        userId: user._id
      });
    }

  } catch (error) {
    console.error('Error in resend OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;