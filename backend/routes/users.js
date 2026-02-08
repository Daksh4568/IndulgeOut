const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Community = require('../models/Community.js');
const cloudinary = require('../config/cloudinary.js');

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
      phoneNumber,
      communityProfile, 
      venueProfile, 
      brandProfile,
      onboardingCompleted,
      createCommunity,
      socialLinks 
    } = req.body;
    
    // Build update data - only allow basic fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (location !== undefined) updateData.location = location;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
    
    // For profile objects during onboarding, allow full update
    // But in normal profile editing, use specific endpoints
    if (communityProfile && !onboardingCompleted) updateData.communityProfile = communityProfile;
    if (venueProfile && !onboardingCompleted) updateData.venueProfile = venueProfile;
    if (brandProfile && !onboardingCompleted) updateData.brandProfile = brandProfile;

    // Allow social links update for community and brand profiles
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (socialLinks) {
      if (user.role === 'host_partner' && user.hostPartnerType === 'community_organizer') {
        if (socialLinks.instagram !== undefined) user.communityProfile.instagram = socialLinks.instagram;
        if (socialLinks.facebook !== undefined) user.communityProfile.facebook = socialLinks.facebook;
        if (socialLinks.website !== undefined) user.communityProfile.website = socialLinks.website;
      } else if (user.role === 'host_partner' && user.hostPartnerType === 'venue') {
        if (socialLinks.instagram !== undefined) user.venueProfile.instagram = socialLinks.instagram;
        if (socialLinks.facebook !== undefined) user.venueProfile.facebook = socialLinks.facebook;
        if (socialLinks.website !== undefined) user.venueProfile.website = socialLinks.website;
      } else if (user.role === 'host_partner' && user.hostPartnerType === 'brand_sponsor') {
        if (socialLinks.instagram !== undefined) user.brandProfile.instagram = socialLinks.instagram;
        if (socialLinks.facebook !== undefined) user.brandProfile.facebook = socialLinks.facebook;
        if (socialLinks.website !== undefined) user.brandProfile.website = socialLinks.website;
        if (socialLinks.linkedin !== undefined) user.brandProfile.linkedin = socialLinks.linkedin;
      } else if (user.role === 'user') {
        // B2C users - store in base socialLinks field
        if (!user.socialLinks) user.socialLinks = {};
        if (socialLinks.instagram !== undefined) user.socialLinks.instagram = socialLinks.instagram;
        if (socialLinks.facebook !== undefined) user.socialLinks.facebook = socialLinks.facebook;
        if (socialLinks.website !== undefined) user.socialLinks.website = socialLinks.website;
      }
    }

    // Apply other updates
    Object.assign(user, updateData);
    await user.save();

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

// Upload profile picture
router.post('/upload-profile-picture', authenticateToken, async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageData, {
      folder: 'indulgeout/profile-pictures',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { profilePicture: uploadResult.secure_url },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: uploadResult.secure_url,
      user
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload profile picture',
      error: error.message 
    });
  }
});

// Delete profile picture
router.delete('/profile-picture', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { profilePicture: null },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile picture removed successfully',
      user
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ message: 'Failed to remove profile picture' });
  }
});

// ==================== SECTION-SPECIFIC UPDATE ENDPOINTS ====================

// Update hosting preferences (for community organizers and venues)
router.put('/profile/hosting-preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { preferredCities, preferredCategories, preferredEventFormats, preferredCollaborationTypes, preferredAudienceTypes, nicheCommunityDescription } = req.body;

    if (user.hostPartnerType === 'community_organizer') {
      // Update only specific fields without replacing the entire object
      if (preferredCities !== undefined) user.communityProfile.preferredCities = preferredCities;
      if (preferredCategories !== undefined) user.communityProfile.preferredCategories = preferredCategories;
      if (preferredEventFormats !== undefined) user.communityProfile.preferredEventFormats = preferredEventFormats;
      if (preferredCollaborationTypes !== undefined) user.communityProfile.preferredCollaborationTypes = preferredCollaborationTypes;
      if (preferredAudienceTypes !== undefined) user.communityProfile.preferredAudienceTypes = preferredAudienceTypes;
      if (nicheCommunityDescription !== undefined) user.communityProfile.nicheCommunityDescription = nicheCommunityDescription;
    } else if (user.hostPartnerType === 'venue') {
      // Update only specific fields without replacing the entire object
      if (preferredCities !== undefined) user.venueProfile.preferredCities = preferredCities;
      if (preferredCategories !== undefined) user.venueProfile.preferredCategories = preferredCategories;
      if (preferredEventFormats !== undefined) user.venueProfile.preferredEventFormats = preferredEventFormats;
      if (preferredCollaborationTypes !== undefined) user.venueProfile.preferredCollaborationTypes = preferredCollaborationTypes;
      if (preferredAudienceTypes !== undefined) user.venueProfile.preferredAudienceTypes = preferredAudienceTypes;
      if (nicheCommunityDescription !== undefined) user.venueProfile.nicheCommunityDescription = nicheCommunityDescription;
    } else if (user.hostPartnerType === 'brand_sponsor') {
      // Update only specific fields without replacing the entire object
      if (preferredCities !== undefined) user.brandProfile.preferredCities = preferredCities;
      if (preferredCategories !== undefined) user.brandProfile.preferredCategories = preferredCategories;
      if (preferredEventFormats !== undefined) user.brandProfile.preferredEventFormats = preferredEventFormats;
      if (preferredCollaborationTypes !== undefined) user.brandProfile.preferredCollaborationTypes = preferredCollaborationTypes;
      if (preferredAudienceTypes !== undefined) user.brandProfile.preferredAudienceTypes = preferredAudienceTypes;
      if (nicheCommunityDescription !== undefined) user.brandProfile.nicheCommunityDescription = nicheCommunityDescription;
    } else {
      return res.status(400).json({ message: 'Hosting preferences only available for host partners' });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Hosting preferences updated successfully',
      user
    });
  } catch (error) {
    console.error('Update hosting preferences error:', error);
    res.status(500).json({ message: 'Failed to update hosting preferences', error: error.message });
  }
});

// Update payout information
router.put('/profile/payout', authenticateToken, async (req, res) => {
  try {
    const { accountNumber, ifscCode, accountHolderName, bankName, accountType, panNumber, gstNumber } = req.body;

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'host_partner') {
      return res.status(400).json({ message: 'Payout information only available for host partners' });
    }

    // Update only specific fields without replacing the entire object
    if (!user.payoutInfo) user.payoutInfo = {};
    if (accountNumber !== undefined) user.payoutInfo.accountNumber = accountNumber;
    if (ifscCode !== undefined) user.payoutInfo.ifscCode = ifscCode;
    if (accountHolderName !== undefined) user.payoutInfo.accountHolderName = accountHolderName;
    if (bankName !== undefined) user.payoutInfo.bankName = bankName;
    if (accountType !== undefined) user.payoutInfo.accountType = accountType;
    if (panNumber !== undefined) user.payoutInfo.panNumber = panNumber;
    if (gstNumber !== undefined) user.payoutInfo.gstNumber = gstNumber;
    if (!user.payoutInfo.addedAt) user.payoutInfo.addedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Payout information updated successfully',
      user
    });
  } catch (error) {
    console.error('Update payout info error:', error);
    res.status(500).json({ message: 'Failed to update payout information', error: error.message });
  }
});

// Update venue details (for venue partners only)
router.put('/profile/venue-details', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.hostPartnerType !== 'venue') {
      return res.status(400).json({ message: 'Venue details only available for venue partners' });
    }

    const { capacityRange, rules, pricing, availability, amenities } = req.body;

    // Update only specific fields without replacing the entire object
    if (capacityRange !== undefined) user.venueProfile.capacityRange = capacityRange;
    if (rules !== undefined) {
      if (!user.venueProfile.rules) user.venueProfile.rules = {};
      if (rules.alcoholAllowed !== undefined) user.venueProfile.rules.alcoholAllowed = rules.alcoholAllowed;
      if (rules.smokingAllowed !== undefined) user.venueProfile.rules.smokingAllowed = rules.smokingAllowed;
      if (rules.ageLimit !== undefined) user.venueProfile.rules.ageLimit = rules.ageLimit;
      if (rules.entryCutoffTime !== undefined) user.venueProfile.rules.entryCutoffTime = rules.entryCutoffTime;
      if (rules.soundRestrictions !== undefined) user.venueProfile.rules.soundRestrictions = rules.soundRestrictions;
      if (rules.additionalRules !== undefined) user.venueProfile.rules.additionalRules = rules.additionalRules;
    }
    if (pricing !== undefined) {
      if (!user.venueProfile.pricing) user.venueProfile.pricing = {};
      Object.assign(user.venueProfile.pricing, pricing);
    }
    if (availability !== undefined) {
      if (!user.venueProfile.availability) user.venueProfile.availability = {};
      Object.assign(user.venueProfile.availability, availability);
    }
    if (amenities !== undefined) user.venueProfile.amenities = amenities;

    await user.save();

    res.json({
      success: true,
      message: 'Venue details updated successfully',
      user
    });
  } catch (error) {
    console.error('Update venue details error:', error);
    res.status(500).json({ message: 'Failed to update venue details', error: error.message });
  }
});

// Upload photo to community/venue profile (max 5)
router.post('/profile/photos', authenticateToken, async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check user type and photo limit
    let photoArray;
    let folderPath;
    
    if (user.hostPartnerType === 'community_organizer') {
      photoArray = user.communityProfile?.pastEventPhotos || [];
      folderPath = 'indulgeout/community-photos';
    } else if (user.hostPartnerType === 'venue') {
      photoArray = user.venueProfile?.photos || [];
      folderPath = 'indulgeout/venue-photos';
    } else {
      return res.status(400).json({ message: 'Photo upload only available for community organizers and venues' });
    }

    // Check if limit reached (max 5)
    if (photoArray.length >= 5) {
      return res.status(400).json({ message: 'Maximum 5 photos allowed' });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageData, {
      folder: folderPath,
      transformation: [
        { width: 1200, height: 800, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    // Add photo to array
    photoArray.push(uploadResult.secure_url);

    // Update user
    if (user.hostPartnerType === 'community_organizer') {
      user.communityProfile.pastEventPhotos = photoArray;
    } else {
      user.venueProfile.photos = photoArray;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: uploadResult.secure_url,
      user
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload photo',
      error: error.message 
    });
  }
});

// Delete specific photo from community/venue profile
router.delete('/profile/photos', authenticateToken, async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL required' });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove photo from array
    if (user.hostPartnerType === 'community_organizer') {
      user.communityProfile.pastEventPhotos = user.communityProfile.pastEventPhotos.filter(url => url !== photoUrl);
    } else if (user.hostPartnerType === 'venue') {
      user.venueProfile.photos = user.venueProfile.photos.filter(url => url !== photoUrl);
    } else {
      return res.status(400).json({ message: 'Photo deletion only available for community organizers and venues' });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Photo deleted successfully',
      user
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Failed to delete photo', error: error.message });
  }
});

module.exports = router;