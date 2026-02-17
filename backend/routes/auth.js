const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const User = require('../models/User.js');
const { sendWelcomeEmail } = require('../utils/emailService.js');
const { uploadToCloudinary } = require('../config/cloudinary.js');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements.js');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
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

// B2B Registration - For Host Partners (Venue/Organizer/Brand)
// Note: B2C users should use /api/auth/otp/register instead
router.post('/register', registrationLimiter, upload.array('photos', 3), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phoneNumber, 
      role, 
      hostPartnerType, 
      interests, 
      location,
      // Community Organizer fields
      communityName,
      // Venue fields
      venueName,
      venueType,
      // Brand fields
      brandName,
      // Common fields
      category,
      city,
      locality,
      instagramLink
    } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !hostPartnerType) {
      return res.status(400).json({ 
        message: 'Name, email, phone number, and host partner type are required' 
      });
    }

    // Validate hostPartnerType
    if (!['community_organizer', 'venue', 'brand_sponsor'].includes(hostPartnerType)) {
      return res.status(400).json({ 
        message: 'Invalid host partner type' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit Indian mobile number' });
    }

    // Check if user already exists with email or phone
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        console.log(`⚠️ Duplicate registration attempt for email: ${email}`);
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        console.log(`⚠️ Duplicate registration attempt for phone: ${phoneNumber}`);
        return res.status(409).json({ message: 'User with this phone number already exists' });
      }
    }

    console.log(`📝 Starting registration for: ${email} (${hostPartnerType})`);

    // Upload photos to Cloudinary (if any)
    const photoUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        console.log(`📤 Uploading ${req.files.length} photos to Cloudinary...`);
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.buffer, {
            folder: `${hostPartnerType}/${email}`,
            resource_type: 'image'
          });
          photoUrls.push(result.secure_url);
        }
        console.log(`✅ Uploaded ${photoUrls.length} photos to Cloudinary`);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload photos. Please try again.' });
      }
    }

    // Build user data
    const userData = {
      name,
      email,
      phoneNumber,
      role: 'host_partner',
      hostPartnerType,
      interests: interests ? (Array.isArray(interests) ? interests : [interests]) : [],
      location: location || {},
      otpVerification: {
        isPhoneVerified: false
      },
      analytics: {
        registrationDate: new Date(),
        registrationMethod: 'b2b_registration',
        lastLogin: new Date()
      }
    };

    // Add profile-specific fields based on hostPartnerType
    if (hostPartnerType === 'community_organizer' && communityName) {
      userData.communityProfile = {
        communityName,
        category: category ? (Array.isArray(category) ? category : [category]) : [],
        city: city || '',
        contactPerson: {
          name: name,
          email: email,
          phone: phoneNumber
        },
        instagram: instagramLink || '',
        pastEventPhotos: photoUrls
      };
    } else if (hostPartnerType === 'venue' && venueName) {
      userData.venueProfile = {
        venueName,
        venueType: venueType || '',
        capacityRange: req.body.capacityRange || '',
        city: city || '',
        locality: locality || '',
        contactPerson: {
          name: name,
          phone: phoneNumber,
          email: email
        },
        instagram: instagramLink || '',
        photos: photoUrls
      };
    } else if (hostPartnerType === 'brand_sponsor' && brandName) {
      userData.brandProfile = {
        brandName,
        brandCategory: category || '',
        targetCity: city ? [city] : [],
        contactPerson: {
          name: name,
          workEmail: email,
          phone: phoneNumber
        },
        instagram: instagramLink || '',
        brandAssets: photoUrls
      };
    }

    // Create new host partner user
    const user = new User(userData);
    
    try {
      await user.save();
      console.log(`✅ User saved to database: ${email}`);
    } catch (saveError) {
      // Handle duplicate key error (race condition where two requests try to create same user)
      if (saveError.code === 11000) {
        console.log(`⚠️ Duplicate key error during save for: ${email} - User may have been created by concurrent request`);
        return res.status(409).json({ 
          message: 'User with this email or phone number already exists. If you just registered, please check your email for the confirmation.' 
        });
      }
      throw saveError; // Re-throw other errors
    }

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

    // Generate action required notifications (profile incomplete, KYC pending)
    try {
      await checkAndGenerateActionRequiredNotifications(user._id);
      console.log(`📬 Action required notifications generated for ${hostPartnerType}: ${email}`);
    } catch (notifError) {
      console.error('Failed to generate action required notifications:', notifError);
      // Don't fail registration if notification generation fails
    }

    console.log(`✅ New B2B ${hostPartnerType} registered: ${email}`);

    res.status(201).json({
      message: 'Host partner registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostPartnerType: user.hostPartnerType,
        communityProfile: user.communityProfile,
        venueProfile: user.venueProfile,
        brandProfile: user.brandProfile
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Password-based login removed - use /api/auth/otp/send and /api/auth/otp/verify instead

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

module.exports = router;