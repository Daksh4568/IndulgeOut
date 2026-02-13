const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Community = require('../models/Community.js');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Update user interests
router.put('/interests', authenticateToken, async (req, res) => {
  try {
    const { interests } = req.body;
    
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { interests },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Interests updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests
      }
    });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('registeredEvents', 'title date location categories')
      .populate('hostedEvents', 'title date location categories currentParticipants maxParticipants');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      bio, 
      location, 
      communityProfile, 
      venueProfile, 
      brandProfile,
      onboardingCompleted,
      createCommunity 
    } = req.body;
    
    const updateData = {
      ...(name && { name }),
      ...(bio && { bio }),
      ...(location && { location }),
      ...(communityProfile && { communityProfile }),
      ...(venueProfile && { venueProfile }),
      ...(brandProfile && { brandProfile }),
      ...(onboardingCompleted !== undefined && { onboardingCompleted })
    };

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If createCommunity flag is true, create a Community document
    if (createCommunity && communityProfile && user.role === 'host_partner' && user.hostPartnerType === 'community_organizer') {
      // Check if community already exists for this user
      const existingCommunity = await Community.findOne({ host: user._id });
      
      if (!existingCommunity) {
        const newCommunity = new Community({
          name: communityProfile.communityName,
          description: communityProfile.communityDescription || `Join ${communityProfile.communityName} for exciting ${communityProfile.primaryCategory} experiences`,
          shortDescription: communityProfile.communityDescription?.substring(0, 200) || `${communityProfile.primaryCategory} community`,
          category: communityProfile.primaryCategory,
          host: user._id,
          isPrivate: communityProfile.communityType === 'curated',
          location: {
            city: communityProfile.city || user.location?.city,
            state: user.location?.state,
            country: user.location?.country || 'India'
          },
          socialLinks: {
            instagram: communityProfile.instagram,
            facebook: communityProfile.facebook,
            website: communityProfile.website
          },
          images: communityProfile.pastEventPhotos || [],
          coverImage: communityProfile.pastEventPhotos?.[0] || null,
          members: [{
            user: user._id,
            joinedAt: new Date(),
            role: 'admin' // Creator is admin
          }],
          tags: [communityProfile.primaryCategory.toLowerCase(), 'community', 'events'],
          stats: {
            totalEvents: 0,
            totalMembers: 1,
            averageRating: 0
          },
          isActive: true,
          forum: [], // Empty forum initially
          testimonials: [] // Empty testimonials initially
        });

        await newCommunity.save();
        
        console.log(`✅ Created community "${communityProfile.communityName}" for organizer ${user.name}`);
      }
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user payout details (KYC)
router.put('/profile/payout', authenticateToken, async (req, res) => {
  try {
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      accountType,
      panNumber,
      gstNumber
    } = req.body;

    // Validation
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName || !panNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: accountHolderName, accountNumber, ifscCode, bankName, panNumber' 
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only host_partners can have payout details
    if (user.role !== 'host_partner') {
      return res.status(403).json({ 
        message: 'Only host partners (venues, brands, communities) can add payout details' 
      });
    }

    // Update payout details
    user.payoutDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      accountType: accountType || 'savings',
      panNumber,
      gstNumber: gstNumber || undefined,
      isVerified: false, // Admin needs to verify
      lastUpdated: new Date()
    };

    await user.save();

    console.log(`✅ Payout details updated for ${user.name} (${user.hostPartnerType})`);

    res.json({
      success: true,
      message: 'Payout details submitted successfully. Admin will verify shortly.',
      payoutDetails: {
        accountHolderName: user.payoutDetails.accountHolderName,
        bankName: user.payoutDetails.bankName,
        isVerified: user.payoutDetails.isVerified
      }
    });
  } catch (error) {
    console.error('Update payout details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's registered events
router.get('/registered-events', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'registeredEvents',
        populate: {
          path: 'host',
          select: 'name'
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out any null events (in case some events were deleted)
    const validEvents = user.registeredEvents.filter(event => event !== null);

    res.json({
      success: true,
      events: validEvents
    });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;