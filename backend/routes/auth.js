const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const User = require('../models/User.js');
const { sendWelcomeEmail } = require('../utils/emailService.js');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements');
const cloudinary = require('../config/cloudinary.js');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

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

// NOTE: Password-based registration and login removed
// All user authentication now uses OTP-based flow via /api/auth/otp/* endpoints

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
router.post('/register-venue', registrationLimiter, upload.single('photo'), async (req, res) => {
  try {
    console.log('🏢 VENUE REGISTRATION REQUEST RECEIVED');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const { name, email, phoneNumber, venueName, city, locality, capacityRange, instagramLink } = req.body;

    console.log('📋 Extracted Fields:', { name, email, phoneNumber, venueName, city, locality, capacityRange, instagramLink });

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }
    console.log('✅ No existing user found');

    // Upload photo to Cloudinary if provided
    let photoUrl = null;
    if (req.file) {
      console.log('📸 Uploading photo to Cloudinary...');
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'venue_photos', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        photoUrl = result.secure_url;
        console.log('✅ Photo uploaded:', photoUrl);
      } catch (uploadError) {
        console.error('❌ Photo upload failed:', uploadError);
      }
    }

    // Create user with proper venueProfile structure
    const user = new User({
      name,
      email,
      phoneNumber,
      role: 'host_partner',
      hostPartnerType: 'venue',
      venueProfile: {
        venueName,
        city,
        locality,
        capacityRange,
        contactPerson: {
          name,
          phone: phoneNumber,
          email
        },
        instagram: instagramLink,
        photos: photoUrl ? [photoUrl] : []
      },
      payoutInfo: {}, // Initialize empty payoutInfo
      otpVerification: {
        isPhoneVerified: false
      }
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, hostPartnerType: user.hostPartnerType },
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
    console.error('❌ VENUE REGISTRATION ERROR:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.errors) {
      console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));
    }

    const errorMessage = error.name === 'ValidationError'
      ? `Validation failed: ${Object.values(error.errors).map(e => e.message).join(', ')}`
      : error.message || 'Registration failed';

    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      message: errorMessage,
      details: error.errors ? Object.keys(error.errors) : undefined
    });
  }
});

// Register Brand
router.post('/register-brand', registrationLimiter, upload.single('photo'), async (req, res) => {
  try {
    console.log('🏷️ BRAND REGISTRATION REQUEST RECEIVED');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const { name, email, phoneNumber, brandName, brandCategory, city, instagramLink } = req.body;

    console.log('📋 Extracted Fields:', { name, email, phoneNumber, brandName, brandCategory, city, instagramLink });

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }
    console.log('✅ No existing user found');

    // Upload photo to Cloudinary if provided
    let photoUrl = null;
    if (req.file) {
      console.log('📸 Uploading photo to Cloudinary...');
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'brand_photos', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        photoUrl = result.secure_url;
        console.log('✅ Photo uploaded:', photoUrl);
      } catch (uploadError) {
        console.error('❌ Photo upload failed:', uploadError);
      }
    }

    // Create user with proper brandProfile structure
    const user = new User({
      name,
      email,
      phoneNumber,
      role: 'host_partner',
      hostPartnerType: 'brand_sponsor',
      brandProfile: {
        brandName,
        brandCategory,
        targetCity: [city],
        contactPerson: {
          name,
          workEmail: email,
          phone: phoneNumber
        },
        instagram: instagramLink,
        logo: photoUrl
      },
      payoutInfo: {}, // Initialize empty payoutInfo
      otpVerification: {
        isPhoneVerified: false
      }
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, hostPartnerType: user.hostPartnerType },
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
    console.error('❌ BRAND REGISTRATION ERROR:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.errors) {
      console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));
    }

    const errorMessage = error.name === 'ValidationError'
      ? `Validation failed: ${Object.values(error.errors).map(e => e.message).join(', ')}`
      : error.message || 'Registration failed';

    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      message: errorMessage,
      details: error.errors ? Object.keys(error.errors) : undefined
    });
  }
});

// Register Host
router.post('/register-host', registrationLimiter, upload.single('photo'), async (req, res) => {
  try {
    console.log('📝 HOST REGISTRATION REQUEST RECEIVED');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Request Headers:', req.headers['content-type']);

    const { name, email, phoneNumber, communityName, category, city, instagramLink } = req.body;

    console.log('📋 Extracted Fields:', {
      name,
      email,
      phoneNumber,
      communityName,
      category,
      city,
      instagramLink
    });

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }
    console.log('✅ No existing user found');

    // Upload photo to Cloudinary if provided
    let photoUrl = null;
    if (req.file) {
      console.log('📸 Uploading photo to Cloudinary...');
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'community_photos', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        photoUrl = result.secure_url;
        console.log('✅ Photo uploaded:', photoUrl);
      } catch (uploadError) {
        console.error('❌ Photo upload failed:', uploadError);
      }
    }

    // Create user with proper communityProfile structure
    console.log('🔨 Creating new user object...');
    const userObject = {
      name,
      email,
      phoneNumber,
      role: 'host_partner',
      hostPartnerType: 'community_organizer',
      communityProfile: {
        communityName,
        city,
        primaryCategory: category,
        contactPerson: {
          name,
          email,
          phone: phoneNumber
        },
        instagram: instagramLink,
        pastEventPhotos: photoUrl ? [photoUrl] : []
      },
      payoutInfo: {}, // Initialize empty payoutInfo
      otpVerification: {
        isPhoneVerified: false
      }
    };

    console.log('User Object to Save:', JSON.stringify(userObject, null, 2));

    const user = new User(userObject);
    console.log('📦 User instance created, attempting to save...');

    await user.save();
    console.log('✅ User saved successfully:', user._id);

    // Generate token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { userId: user._id, role: user.role, hostPartnerType: user.hostPartnerType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ Token generated successfully');

    const response = {
      message: 'Host registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType,
      }
    };

    console.log('📤 Sending success response:', JSON.stringify(response, null, 2));
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ HOST REGISTRATION ERROR:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.errors) {
      console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));
    }
    if (error.stack) {
      console.error('Stack Trace:', error.stack);
    }

    // Send more detailed error for debugging
    const errorMessage = error.name === 'ValidationError'
      ? `Validation failed: ${Object.values(error.errors).map(e => e.message).join(', ')}`
      : error.message || 'Registration failed';

    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      message: errorMessage,
      details: error.errors ? Object.keys(error.errors) : undefined
    });
  }
});

module.exports = router;