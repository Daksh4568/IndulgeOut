const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User.js');
const { sendWelcomeEmail } = require('../utils/emailService.js');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements');

const router = express.Router();

// Rate limiter for registration - prevent bot signups
// Allows 3 registrations per 15 minutes per IP
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 registration attempts per windowMs
  message: 'Too many registration attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many registration attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for login - prevent brute force attacks
// Allows 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: 'Too many login attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Register user (Traditional email/password method)
router.post('/register', registrationLimiter, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').optional().matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid 10-digit Indian mobile number'),
  body('role').isIn(['user', 'host_partner']).withMessage('Invalid role'),
  body('hostPartnerType').optional().isIn(['community_organizer', 'venue', 'brand_sponsor']).withMessage('Invalid host partner type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, phoneNumber, role, hostPartnerType, interests, location } = req.body;

    // Check if user already exists with email or phone
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(409).json({ message: 'User with this phone number already exists' });
      }
    }

    // Create new user
    const user = new User({
      name: name, // Keep as 'name' to match User model
      email,
      password,
      phoneNumber,
      role,
      hostPartnerType: role === 'host_partner' ? hostPartnerType : undefined,
      interests: interests || [],
      location: location || {},
      isOTPUser: false, // This is a password-based user
      otpVerification: {
        isPhoneVerified: false // Phone not verified yet for password users
      },
      analytics: {
        registrationDate: new Date(),
        registrationMethod: 'password',
        lastLogin: new Date()
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, phoneNumber: user.phoneNumber, role: user.role, hostPartnerType: user.hostPartnerType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, hostPartnerType: user.hostPartnerType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate action required notifications in background (don't await)
    checkAndGenerateActionRequiredNotifications(user._id).catch(err => {
      console.error('Error generating action required notifications on login:', err);
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType,
        interests: user.interests
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('registeredEvents hostedEvents');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Register Venue
router.post('/register-venue', registrationLimiter, async (req, res) => {
  try {
    const { name, email, phoneNumber, venueName, city, locality, capacityRange, instagramLink } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      phoneNumber,
      role: 'host_partner',
      hostPartnerType: 'venue',
      venueName,
      city,
      locality,
      capacityRange,
      instagramLink,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Venue registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType,
      }
    });
  } catch (error) {
    console.error('Venue registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Register Brand
router.post('/register-brand', registrationLimiter, async (req, res) => {
  try {
    const { name, email, phoneNumber, brandName, brandCategory, city, instagramLink } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      phoneNumber,
      role: 'host_partner',
      hostPartnerType: 'brand_sponsor',
      brandName,
      brandCategory,
      city,
      instagramLink,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Brand registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType,
      }
    });
  } catch (error) {
    console.error('Brand registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Register Host
router.post('/register-host', registrationLimiter, async (req, res) => {
  try {
    const { name, email, phoneNumber, communityName, category, city, instagramLink } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      phoneNumber,
      role: 'host_partner',
      hostPartnerType: 'community_organizer',
      communityName,
      category,
      city,
      instagramLink,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Host registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType,
      }
    });
  } catch (error) {
    console.error('Host registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

module.exports = router;