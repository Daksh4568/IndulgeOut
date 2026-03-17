const User = require('../models/User');
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

/**
 * Check if user needs to complete any required actions
 * and generate notifications accordingly
 * 
 * This function checks for incomplete profile fields and other
 * action items that new users should complete.
 * 
 * @param {String} userId - User ID to check
 * @returns {Promise<Object>} - Object with action requirements
 */
async function checkAndGenerateActionRequiredNotifications(userId) {
  try {
    // Fetch user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check for existing notifications to avoid duplicates
    // Only create new notification if none exists within last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingProfileNotification = await Notification.findOne({
      recipient: userId,
      type: {
        $in: [
          'profile_incomplete', 
          'profile_incomplete_community_organizer', 
          'profile_incomplete_brand_sponsor', 
          'profile_incomplete_venue'
        ]
      },
      createdAt: { $gte: twentyFourHoursAgo } // Last 24 hours only
    });

    const existingKYCNotification = await Notification.findOne({
      recipient: userId,
      type: 'kyc_pending',
      createdAt: { $gte: twentyFourHoursAgo } // Last 24 hours only
    });

    if (existingProfileNotification) {
      console.log(`⏭️ [Notification] Skipping profile notification - already sent within 24h for user: ${userId}`);
    }
    if (existingKYCNotification) {
      console.log(`⏭️ [Notification] Skipping KYC notification - already sent within 24h for user: ${userId}`);
    }

    // Check profile completeness based on user role
    if (user.role === 'host_partner') {
      const { isComplete, missingFields } = checkHostPartnerProfile(user);
      
      if (!isComplete && !existingProfileNotification) {
        // Create profile incomplete notification based on hostPartnerType
        if (user.hostPartnerType === 'venue') {
          await notificationService.notifyProfileIncompleteVenue(userId);
          console.log(`📢 Created profile incomplete notification for venue: ${user.name}`);
        } else if (user.hostPartnerType === 'brand_sponsor') {
          await notificationService.notifyProfileIncompleteBrand(userId);
          console.log(`📢 Created profile incomplete notification for brand: ${user.name}`);
        } else if (user.hostPartnerType === 'community_organizer') {
          await notificationService.notifyProfileIncompleteHost(userId);
          console.log(`📢 Created profile incomplete notification for community: ${user.name}`);
        }
      }

      // Check KYC/payout details for venues and communities only (not brands)
      // Required fields: accountHolderName, accountNumber, ifscCode, billingAddress
      let hasPayoutDetails = true; // Brands don't need payout details
      
      if (user.hostPartnerType !== 'brand_sponsor') {
        hasPayoutDetails = user.payoutDetails?.accountHolderName && 
                          user.payoutDetails?.accountNumber && 
                          user.payoutDetails?.ifscCode &&
                          user.payoutDetails?.billingAddress;
        
        if (!hasPayoutDetails && !existingKYCNotification) {
          await notificationService.notifyKYCPending(userId);
          console.log(`💳 Created KYC/payout notification for: ${user.name} (${user.hostPartnerType})`);
        }
      } else {
        console.log(`⏭️ Skipping payout details check for brand: ${user.name} (not required for brands)`);
      }

      return {
        success: true,
        profileComplete: isComplete,
        payoutDetailsComplete: hasPayoutDetails,
        missingFields,
        requiresAction: !isComplete || (user.hostPartnerType !== 'brand_sponsor' && !hasPayoutDetails)
      };
    } else {
      // Regular B2C user - comprehensive check
      const missingFields = [];
      if (!user.name) missingFields.push('name');
      if (!user.phoneNumber) missingFields.push('phoneNumber');

      if (missingFields.length > 0 && !existingProfileNotification) {
        await notificationService.notifyProfileIncompleteUser(userId, missingFields);
        console.log(`📢 Created profile incomplete notification for user: ${user.name || user.email}`);
      }

      return {
        success: true,
        profileComplete: missingFields.length === 0,
        missingFields,
        requiresAction: missingFields.length > 0
      };
    }

  } catch (error) {
    console.error('Error checking user action requirements:', error);
    throw error;
  }
}

/**
 * Check host partner profile completeness based on type
 * @param {Object} user - User object
 * @returns {Object} - { isComplete: boolean, missingFields: array }
 */
function checkHostPartnerProfile(user) {
  const missingFields = [];

  if (user.hostPartnerType === 'venue') {
    // Profile fields
    if (!user.venueProfile?.venueName) missingFields.push('venueName');
    if (!user.venueProfile?.venueDescription) missingFields.push('venueDescription');
    if (!user.venueProfile?.photos || user.venueProfile?.photos.length === 0) missingFields.push('photos');
    // Hosting Preferences
    if (!user.venueProfile?.preferredCities || user.venueProfile?.preferredCities.length === 0) missingFields.push('preferredCities');
    if (!user.venueProfile?.preferredCategories || user.venueProfile?.preferredCategories.length === 0) missingFields.push('preferredCategories');
    if (!user.venueProfile?.preferredEventFormats || user.venueProfile?.preferredEventFormats.length === 0) missingFields.push('preferredEventFormats');
    if (!user.venueProfile?.preferredAudienceTypes || user.venueProfile?.preferredAudienceTypes.length === 0) missingFields.push('preferredAudienceTypes');
  } else if (user.hostPartnerType === 'brand_sponsor') {
    // Profile fields
    if (!user.brandProfile?.brandName) missingFields.push('brandName');
    if (!user.brandProfile?.brandDescription) missingFields.push('brandDescription');
    // Hosting Preferences
    if (!user.brandProfile?.preferredCities || user.brandProfile?.preferredCities.length === 0) missingFields.push('preferredCities');
    if (!user.brandProfile?.preferredCategories || user.brandProfile?.preferredCategories.length === 0) missingFields.push('preferredCategories');
    if (!user.brandProfile?.preferredEventFormats || user.brandProfile?.preferredEventFormats.length === 0) missingFields.push('preferredEventFormats');
    if (!user.brandProfile?.preferredCollaborationTypes || user.brandProfile?.preferredCollaborationTypes.length === 0) missingFields.push('preferredCollaborationTypes');
    if (!user.brandProfile?.preferredAudienceTypes || user.brandProfile?.preferredAudienceTypes.length === 0) missingFields.push('preferredAudienceTypes');
  } else if (user.hostPartnerType === 'community_organizer') {
    // Profile fields
    if (!user.communityProfile?.communityName) missingFields.push('communityName');
    if (!user.communityProfile?.communityDescription) missingFields.push('communityDescription');
    if (!user.communityProfile?.pastEventPhotos || user.communityProfile?.pastEventPhotos.length === 0) missingFields.push('pastEventPhotos');
    // Hosting Preferences
    if (!user.communityProfile?.preferredCities || user.communityProfile?.preferredCities.length === 0) missingFields.push('preferredCities');
    if (!user.communityProfile?.preferredCategories || user.communityProfile?.preferredCategories.length === 0) missingFields.push('preferredCategories');
    if (!user.communityProfile?.preferredEventFormats || user.communityProfile?.preferredEventFormats.length === 0) missingFields.push('preferredEventFormats');
    if (!user.communityProfile?.preferredAudienceTypes || user.communityProfile?.preferredAudienceTypes.length === 0) missingFields.push('preferredAudienceTypes');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}

/**
 * Check if user profile is complete
 * @param {String} userId - User ID to check
 * @returns {Promise<Boolean>} - True if profile is complete
 */
async function isProfileComplete(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return false;
    }

    // Host partners need role-specific fields
    if (user.role === 'host_partner') {
      const { isComplete } = checkHostPartnerProfile(user);
      return isComplete;
    }

    // Regular users just need basic info
    const hasBasicInfo = user.name && user.email && user.phoneNumber;
    const hasProfilePicture = !!user.profilePicture;
    const hasLocation = !!user.location;
    const hasInterests = user.interests && user.interests.length > 0;
    
    return hasBasicInfo && hasProfilePicture && hasLocation && hasInterests;
    
  } catch (error) {
    console.error('Error checking profile completeness:', error);
    return false;
  }
}

/**
 * Get percentage of profile completion
 * @param {String} userId - User ID to check
 * @returns {Promise<Number>} - Percentage (0-100)
 */
async function getProfileCompletionPercentage(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return 0;
    }

    let totalFields = 0;
    let completedFields = 0;

    // Basic fields (required for all users)
    const basicFields = ['name', 'email', 'phoneNumber'];
    totalFields += basicFields.length;
    
    basicFields.forEach(field => {
      if (user[field]) completedFields++;
    });

    // Role-specific fields
    if (user.role === 'host_partner') {
      if (user.hostPartnerType === 'venue') {
        totalFields += 7;
        if (user.venueProfile?.venueName) completedFields++;
        if (user.venueProfile?.venueDescription) completedFields++;
        if (user.venueProfile?.photos?.length > 0) completedFields++;
        if (user.venueProfile?.preferredCities?.length > 0) completedFields++;
        if (user.venueProfile?.preferredCategories?.length > 0) completedFields++;
        if (user.venueProfile?.preferredEventFormats?.length > 0) completedFields++;
        if (user.venueProfile?.preferredAudienceTypes?.length > 0) completedFields++;
      } else if (user.hostPartnerType === 'brand_sponsor') {
        totalFields += 7;
        if (user.brandProfile?.brandName) completedFields++;
        if (user.brandProfile?.brandDescription) completedFields++;
        if (user.brandProfile?.preferredCities?.length > 0) completedFields++;
        if (user.brandProfile?.preferredCategories?.length > 0) completedFields++;
        if (user.brandProfile?.preferredEventFormats?.length > 0) completedFields++;
        if (user.brandProfile?.preferredCollaborationTypes?.length > 0) completedFields++;
        if (user.brandProfile?.preferredAudienceTypes?.length > 0) completedFields++;
      } else if (user.hostPartnerType === 'community_organizer') {
        totalFields += 7;
        if (user.communityProfile?.communityName) completedFields++;
        if (user.communityProfile?.communityDescription) completedFields++;
        if (user.communityProfile?.pastEventPhotos?.length > 0) completedFields++;
        if (user.communityProfile?.preferredCities?.length > 0) completedFields++;
        if (user.communityProfile?.preferredCategories?.length > 0) completedFields++;
        if (user.communityProfile?.preferredEventFormats?.length > 0) completedFields++;
        if (user.communityProfile?.preferredAudienceTypes?.length > 0) completedFields++;
      }

      // Payout details (only for venues & communities)
      if (user.hostPartnerType !== 'brand_sponsor') {
        totalFields += 2;
        if (user.payoutDetails?.accountNumber) completedFields++;
        if (user.payoutDetails?.accountHolderName) completedFields++;
      }
    } else {
      // B2C user additional fields
      totalFields += 3;
      if (user.profilePicture) completedFields++;
      if (user.location) completedFields++;
      if (user.interests && user.interests.length > 0) completedFields++;
    }

    return Math.round((completedFields / totalFields) * 100);
    
  } catch (error) {
    console.error('Error calculating profile completion:', error);
    return 0;
  }
}

module.exports = {
  checkAndGenerateActionRequiredNotifications,
  isProfileComplete,
  getProfileCompletionPercentage
};
