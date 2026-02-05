const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

/**
 * Check user's profile and generate action required notifications if needed
 * @param {String} userId - The user ID to check
 * @returns {Promise<Array>} Array of created notifications
 */
async function checkAndGenerateActionRequiredNotifications(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const createdNotifications = [];
    
    // Check for existing notifications created in the last 24 hours (regardless of read status)
    // This prevents spamming users with the same notifications on every login
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingNotifications = await Notification.find({
      recipient: userId,
      category: 'action_required',
      createdAt: { $gte: twentyFourHoursAgo }
    }).select('type');

    const existingTypes = new Set(existingNotifications.map(n => n.type));

    // Check 1: Profile Incomplete (User)
    if (user.role === 'user') {
      const missingFields = [];
      if (!user.interests || user.interests.length === 0) missingFields.push('interests');
      if (!user.location?.city) missingFields.push('location');
      if (!user.phoneNumber) missingFields.push('phone number');
      if (!user.bio || user.bio.length < 10) missingFields.push('bio');

      if (missingFields.length > 0 && !existingTypes.has('profile_incomplete_user')) {
        const notification = await notificationService.notifyProfileIncompleteUser(
          userId,
          missingFields,
          { sendEmail: false } // Don't send email for auto-generated notifications
        );
        if (notification) createdNotifications.push(notification);
      }
    }

    // Check 2: Profile Incomplete (Host/Organizer)
    if (user.role === 'host_partner' || user.role === 'community_organizer') {
      const isProfileIncomplete = 
        !user.communityProfile?.communityName ||
        !user.communityProfile?.communityDescription ||
        !user.phoneNumber;

      if (isProfileIncomplete && !existingTypes.has('profile_incomplete_host')) {
        const notification = await notificationService.notifyProfileIncompleteHost(
          userId,
          { sendEmail: false }
        );
        if (notification) createdNotifications.push(notification);
      }
    }

    // Check 3: KYC/Payout Details Missing
    if (user.role === 'host_partner' || user.role === 'community_organizer') {
      const hasPayoutDetails = user.payoutInfo && 
        user.payoutInfo.accountNumber && 
        user.payoutInfo.ifscCode &&
        user.payoutInfo.accountHolderName;

      if (!hasPayoutDetails && !existingTypes.has('kyc_pending')) {
        const notification = await notificationService.notifyKYCPending(
          userId,
          { sendEmail: false }
        );
        if (notification) createdNotifications.push(notification);
      }
    }

    // Check 4: Brand Profile Incomplete
    if (user.role === 'brand_sponsor') {
      const isBrandProfileIncomplete =
        !user.brandProfile?.brandName ||
        !user.brandProfile?.brandCategory ||
        !user.brandProfile?.brandDescription ||
        !user.phoneNumber;

      if (isBrandProfileIncomplete && !existingTypes.has('profile_incomplete_brand')) {
        const notification = await notificationService.notifyProfileIncompleteBrand(
          userId,
          { sendEmail: false }
        );
        if (notification) createdNotifications.push(notification);
      }
    }

    // Check 5: Venue Profile Incomplete
    if (user.role === 'venue') {
      const isVenueProfileIncomplete =
        !user.venueProfile?.venueName ||
        !user.venueProfile?.venueType ||
        !user.venueProfile?.capacityRange ||
        !user.phoneNumber;

      if (isVenueProfileIncomplete && !existingTypes.has('profile_incomplete_venue')) {
        const notification = await notificationService.notifyProfileIncompleteVenue(
          userId,
          { sendEmail: false }
        );
        if (notification) createdNotifications.push(notification);
      }
    }

    console.log(`Generated ${createdNotifications.length} action required notifications for user ${userId}`);
    return createdNotifications;

  } catch (error) {
    console.error('Error checking user action requirements:', error);
    return [];
  }
}

module.exports = {
  checkAndGenerateActionRequiredNotifications
};
