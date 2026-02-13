const User = require('../models/User');

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

    const actionItems = [];

    // Check if profile picture is missing
    if (!user.profilePicture) {
      actionItems.push({
        type: 'profile_incomplete',
        field: 'profilePicture',
        message: 'Add a profile picture to personalize your account',
        priority: 'low'
      });
    }

    // Check if bio/about is missing (for host partners)
    if (user.role === 'host_partner' && !user.about) {
      actionItems.push({
        type: 'profile_incomplete',
        field: 'about',
        message: 'Complete your profile by adding an about section',
        priority: 'medium'
      });
    }

    // Check if location is missing
    if (!user.location) {
      actionItems.push({
        type: 'profile_incomplete',
        field: 'location',
        message: 'Add your location to discover nearby events',
        priority: 'low'
      });
    }

    // Log action items (in future, create notifications here)
    if (actionItems.length > 0) {
      console.log(`📋 User ${user.name} has ${actionItems.length} action items:`, 
        actionItems.map(item => item.field).join(', '));
    } else {
      console.log(`✅ User ${user.name} profile is complete`);
    }

    // TODO: When Notification model is implemented, create notifications here:
    // for (const item of actionItems) {
    //   await Notification.create({
    //     user: userId,
    //     type: item.type,
    //     message: item.message,
    //     priority: item.priority,
    //     isRead: false
    //   });
    // }

    return {
      success: true,
      actionItems,
      requiresAction: actionItems.length > 0
    };

  } catch (error) {
    console.error('Error checking user action requirements:', error);
    throw error;
  }
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

    // Basic completeness check
    const hasBasicInfo = user.name && user.email && user.phoneNumber;
    const hasProfilePicture = !!user.profilePicture;
    const hasLocation = !!user.location;

    // Host partners need additional fields
    if (user.role === 'host_partner') {
      const hasAbout = !!user.about;
      return hasBasicInfo && hasProfilePicture && hasLocation && hasAbout;
    }

    // Regular users just need basic info
    return hasBasicInfo;
    
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
    const basicFields = ['name', 'email', 'phoneNumber', 'profilePicture', 'location'];
    totalFields += basicFields.length;
    
    basicFields.forEach(field => {
      if (user[field]) completedFields++;
    });

    // Additional fields for host partners
    if (user.role === 'host_partner') {
      const hostFields = ['about', 'hostPartnerType'];
      totalFields += hostFields.length;
      
      hostFields.forEach(field => {
        if (user[field]) completedFields++;
      });
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
