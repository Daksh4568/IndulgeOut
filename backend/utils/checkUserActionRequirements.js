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
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    const existingKYCNotification = await Notification.findOne({
      recipient: userId,
      type: 'kyc_pending',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

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

      // Check KYC/payout details for all host partners
      // Required fields: accountHolderName, accountNumber, ifscCode, billingAddress
      const hasPayoutDetails = user.payoutDetails?.accountHolderName && 
                               user.payoutDetails?.accountNumber && 
                               user.payoutDetails?.ifscCode &&
                               user.payoutDetails?.billingAddress;
      
      if (!hasPayoutDetails && !existingKYCNotification) {
        await notificationService.notifyKYCPending(userId);
        console.log(`💳 Created KYC/payout notification for: ${user.name} (${user.hostPartnerType})`);
      }

      return {
        success: true,
        profileComplete: isComplete,
        payoutDetailsComplete: hasPayoutDetails,
        missingFields,
        requiresAction: !isComplete || !hasPayoutDetails
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
    // Check venue profile fields - comprehensive check
    if (!user.venueProfile?.venueName) missingFields.push('venueName');
    if (!user.venueProfile?.venueType) missingFields.push('venueType');
    if (!user.venueProfile?.capacityRange) missingFields.push('capacityRange');
    if (!user.venueProfile?.city) missingFields.push('city');
    if (!user.venueProfile?.locality) missingFields.push('locality');
    if (!user.venueProfile?.photos || user.venueProfile?.photos.length === 0) missingFields.push('photos');
  } else if (user.hostPartnerType === 'brand_sponsor') {
    // Check brand profile fields - comprehensive check
    if (!user.brandProfile?.brandName) missingFields.push('brandName');
    if (!user.brandProfile?.industry) missingFields.push('industry');
    if (!user.brandProfile?.targetAudience) missingFields.push('targetAudience');
    if (!user.brandProfile?.city) missingFields.push('city');
    if (!user.brandProfile?.brandDescription) missingFields.push('brandDescription');
  } else if (user.hostPartnerType === 'community_organizer') {
    // Check community profile fields - comprehensive check
    if (!user.communityProfile?.communityName) missingFields.push('communityName');
    if (!user.communityProfile?.city) missingFields.push('city');
    if (!user.communityProfile?.eventExperience) missingFields.push('eventExperience');
    if (!user.communityProfile?.description) missingFields.push('description');
    if (!user.communityProfile?.eventCategories || user.communityProfile?.eventCategories.length === 0) missingFields.push('eventCategories');
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
        const venueFields = [
          'venueProfile.venueName',
          'venueProfile.locality',
          'venueProfile.venueType',
          'venueProfile.capacityRange',
          'venueProfile.contactPerson.name',
          'location.city'
        ];
        totalFields += venueFields.length;
        
        if (user.venueProfile?.venueName) completedFields++;
        if (user.venueProfile?.locality) completedFields++;
        if (user.venueProfile?.venueType) completedFields++;
        if (user.venueProfile?.capacityRange) completedFields++;
        if (user.venueProfile?.contactPerson?.name) completedFields++;
        if (user.location?.city) completedFields++;
      } else if (user.hostPartnerType === 'brand_sponsor') {
        const brandFields = [
          'brandProfile.brandName',
          'brandProfile.brandCategory',
          'brandProfile.contactPerson.name',
          'brandProfile.targetCity',
          'brandProfile.sponsorshipType'
        ];
        totalFields += brandFields.length;
        
        if (user.brandProfile?.brandName) completedFields++;
        if (user.brandProfile?.brandCategory) completedFields++;
        if (user.brandProfile?.contactPerson?.name) completedFields++;
        if (user.brandProfile?.targetCity?.length > 0) completedFields++;
        if (user.brandProfile?.sponsorshipType?.length > 0) completedFields++;
      } else if (user.hostPartnerType === 'community_organizer') {
        const communityFields = [
          'communityProfile.communityName',
          'communityProfile.primaryCategory',
          'communityProfile.contactPerson.name',
          'communityProfile.typicalAudienceSize',
          'location.city'
        ];
        totalFields += communityFields.length;
        
        if (user.communityProfile?.communityName) completedFields++;
        if (user.communityProfile?.primaryCategory) completedFields++;
        if (user.communityProfile?.contactPerson?.name) completedFields++;
        if (user.communityProfile?.typicalAudienceSize) completedFields++;
        if (user.location?.city) completedFields++;
      }

      // Payout details
      totalFields += 2;
      if (user.payoutDetails?.accountNumber) completedFields++;
      if (user.payoutDetails?.bankName) completedFields++;
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
