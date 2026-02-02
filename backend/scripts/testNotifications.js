/**
 * Notification System Testing Script
 * Tests all notification types, delivery channels, and functionality
 * Run: node scripts/testNotifications.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.magenta}${'='.repeat(50)}${colors.reset}\n${colors.magenta}${msg}${colors.reset}\n${colors.magenta}${'='.repeat(50)}${colors.reset}\n`)
};

// Test configuration
const TEST_CONFIG = {
  createTestUsers: true,
  createTestEvent: true,
  testAllNotificationTypes: true,
  testEmailDelivery: false, // Set to true to send actual emails
  cleanupAfterTest: true
};

let testData = {
  users: [],
  event: null,
  notifications: []
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error('MongoDB connection failed: ' + error.message);
    process.exit(1);
  }
}

/**
 * Create test users
 */
async function createTestUsers() {
  log.section('CREATING TEST USERS');
  
  try {
    const userTypes = [
      { 
        email: 'test-attendee@indulgeout.test', 
        name: 'Test Attendee', 
        role: 'user' 
      },
      { 
        email: 'test-organizer@indulgeout.test', 
        name: 'Test Organizer', 
        role: 'host_partner',
        hostPartnerType: 'community_organizer'
      },
      { 
        email: 'test-brand@indulgeout.test', 
        name: 'Test Brand', 
        role: 'host_partner',
        hostPartnerType: 'brand_sponsor'
      }
    ];

    for (const userData of userTypes) {
      // Check if user exists
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        // Generate valid 10-digit Indian mobile number (starts with 6-9)
        const firstDigit = Math.floor(Math.random() * 4) + 6; // Random digit between 6-9
        const remainingDigits = Math.floor(Math.random() * 900000000) + 100000000; // 9 more digits
        const phoneNumber = `${firstDigit}${remainingDigits.toString().substring(0, 9)}`;
        
        const userDoc = {
          name: userData.name,
          email: userData.email,
          phoneNumber: phoneNumber,
          role: userData.role,
          password: 'Test@123456', // This will be hashed
          emailVerified: true,
          phoneVerified: true,
          notificationSettings: {
            emailNotifications: TEST_CONFIG.testEmailDelivery,
            pushNotifications: true,
            smsNotifications: false,
            inAppNotifications: true
          }
        };
        
        // Add hostPartnerType if applicable
        if (userData.hostPartnerType) {
          userDoc.hostPartnerType = userData.hostPartnerType;
        }
        
        user = new User(userDoc);
        await user.save();
        log.success(`Created ${userData.role}${userData.hostPartnerType ? ` (${userData.hostPartnerType})` : ''}: ${user.email}`);
      } else {
        log.warning(`User already exists: ${userData.email}`);
      }
      
      testData.users.push(user);
    }
  } catch (error) {
    log.error('Error creating test users: ' + error.message);
    throw error;
  }
}

/**
 * Create test event
 */
async function createTestEvent() {
  log.section('CREATING TEST EVENT');
  
  try {
    const organizer = testData.users.find(u => u.role === 'host_partner' && u.hostPartnerType === 'community_organizer');
    
    // Ensure Music category exists
    let musicCategory = await Category.findOne({ name: 'Music' });
    if (!musicCategory) {
      musicCategory = new Category({
        id: 'music-test',
        slug: 'music',
        name: 'Music',
        emoji: '🎵',
        descriptor: 'Music events',
        description: 'Test music category'
      });
      await musicCategory.save();
      log.success('Created Music category');
    }
    
    let socialCategory = await Category.findOne({ name: 'Social' });
    if (!socialCategory) {
      socialCategory = new Category({
        id: 'social-test',
        slug: 'social',
        name: 'Social',
        emoji: '👥',
        descriptor: 'Social events',
        description: 'Test social category'
      });
      await socialCategory.save();
      log.success('Created Social category');
    }
    
    const event = new Event({
      title: 'Test Notification Event',
      description: 'This is a test event for notification system testing',
      categories: ['Music', 'Social'],
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      time: '19:00',
      location: {
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        coordinates: {
          latitude: 19.0760,
          longitude: 72.8777
        }
      },
      host: organizer._id,
      createdBy: organizer._id,
      maxParticipants: 100,
      currentParticipants: 0,
      price: {
        amount: 50,
        currency: 'INR'
      },
      status: 'published',
      mood: 'energetic',
      tags: ['test', 'notifications', 'music'],
      images: ['https://example.com/test-event.jpg']
    });
    
    await event.save();
    testData.event = event;
    log.success(`Created test event: ${event.title} (ID: ${event._id})`);
  } catch (error) {
    log.error('Error creating test event: ' + error.message);
    throw error;
  }
}

/**
 * Test notification creation
 */
async function testNotificationCreation() {
  log.section('TESTING NOTIFICATION CREATION');
  
  const attendee = testData.users.find(u => u.role === 'user');
  const organizer = testData.users.find(u => u.role === 'organizer');
  const event = testData.event;

  const tests = [
    {
      name: 'Booking Confirmation',
      fn: () => notificationService.notifyBookingConfirmed(attendee._id, event._id, 'TKT12345', 2, 100)
    },
    {
      name: 'Event Reminder (24h)',
      fn: () => notificationService.notifyEventReminder(attendee._id, event._id, '24 hours')
    },
    {
      name: 'Event Cancellation',
      fn: () => notificationService.notifyEventCancelled(attendee._id, event._id, 'Weather conditions')
    },
    {
      name: 'Payment Success',
      fn: () => notificationService.notifyPaymentSuccess(attendee._id, event._id, 100, 'TXN12345')
    },
    {
      name: 'Event Published',
      fn: () => notificationService.notifyEventPublished(organizer._id, event._id)
    },
    {
      name: 'New Registration',
      fn: () => notificationService.notifyNewRegistration(organizer._id, event._id, attendee._id, 2)
    },
    {
      name: 'Follower Milestone',
      fn: () => notificationService.notifyMilestoneReached(organizer._id, 'followers', 1000)
    },
    {
      name: 'Profile Incomplete',
      fn: () => notificationService.notifyProfileIncomplete(attendee._id, ['phone', 'bio'])
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      log.test(`Testing: ${test.name}`);
      const notification = await test.fn();
      
      if (notification && notification._id) {
        log.success(`${test.name} - Notification created (ID: ${notification._id})`);
        testData.notifications.push(notification);
        passed++;
      } else {
        log.error(`${test.name} - No notification returned`);
        failed++;
      }
    } catch (error) {
      log.error(`${test.name} - Error: ${error.message}`);
      failed++;
    }
  }

  log.info(`\nTest Results: ${passed} passed, ${failed} failed`);
}

/**
 * Test notification queries
 */
async function testNotificationQueries() {
  log.section('TESTING NOTIFICATION QUERIES');
  
  const attendee = testData.users.find(u => u.role === 'user');

  try {
    // Test 1: Get all notifications for user
    log.test('Fetching all notifications for attendee');
    const allNotifications = await Notification.find({ user: attendee._id });
    log.success(`Found ${allNotifications.length} notifications`);

    // Test 2: Get unread count
    log.test('Getting unread notification count');
    const unreadCount = await Notification.getUnreadCount(attendee._id);
    log.success(`Unread count: ${unreadCount}`);

    // Test 3: Get notifications by category
    log.test('Fetching action-required notifications');
    const actionNotifications = await Notification.find({
      user: attendee._id,
      category: 'action-required'
    });
    log.success(`Found ${actionNotifications.length} action-required notifications`);

    // Test 4: Mark notification as read
    if (allNotifications.length > 0) {
      log.test('Marking first notification as read');
      await allNotifications[0].markAsRead();
      log.success(`Notification marked as read`);
    }

    // Test 5: Archive notification
    if (allNotifications.length > 0) {
      log.test('Archiving first notification');
      await allNotifications[0].archive();
      log.success(`Notification archived`);
    }

    // Test 6: Get notifications with pagination
    log.test('Testing pagination (limit 5)');
    const paginatedNotifications = await Notification.find({ user: attendee._id })
      .limit(5)
      .sort({ createdAt: -1 });
    log.success(`Retrieved ${paginatedNotifications.length} notifications with pagination`);

  } catch (error) {
    log.error('Query test failed: ' + error.message);
  }
}

/**
 * Test notification model methods
 */
async function testNotificationMethods() {
  log.section('TESTING NOTIFICATION MODEL METHODS');
  
  const attendee = testData.users.find(u => u.role === 'user');

  try {
    // Create a test notification
    const notification = new Notification({
      user: attendee._id,
      type: 'system_update',
      category: 'status-update',
      title: 'System Update Test',
      message: 'Testing notification methods',
      priority: 'medium'
    });
    await notification.save();

    // Test virtual field
    log.test('Testing timeAgo virtual field');
    log.info(`Created: ${notification.timeAgo}`);

    // Test isExpired method
    log.test('Testing isExpired method');
    const expired = notification.isExpired();
    log.info(`Is expired: ${expired}`);

    // Test markAsRead
    log.test('Testing markAsRead method');
    await notification.markAsRead();
    log.success(`Read at: ${notification.readAt}`);

    // Test archive
    log.test('Testing archive method');
    await notification.archive();
    log.success(`Archived: ${notification.archived}`);

    // Test delete
    log.test('Testing delete method');
    await notification.deleteOne();
    log.success('Notification deleted');

  } catch (error) {
    log.error('Method test failed: ' + error.message);
  }
}

/**
 * Test bulk operations
 */
async function testBulkOperations() {
  log.section('TESTING BULK OPERATIONS');
  
  const attendee = testData.users.find(u => u.role === 'user');

  try {
    // Mark all as read
    log.test('Marking all notifications as read');
    const markResult = await Notification.updateMany(
      { user: attendee._id, readAt: null },
      { readAt: new Date() }
    );
    log.success(`Marked ${markResult.modifiedCount} notifications as read`);

    // Delete all read notifications
    log.test('Deleting all read notifications');
    const deleteResult = await Notification.deleteMany({
      user: attendee._id,
      readAt: { $ne: null }
    });
    log.success(`Deleted ${deleteResult.deletedCount} notifications`);

  } catch (error) {
    log.error('Bulk operation failed: ' + error.message);
  }
}

/**
 * Test notification settings respect
 */
async function testNotificationSettings() {
  log.section('TESTING NOTIFICATION SETTINGS');
  
  const attendee = testData.users.find(u => u.role === 'user');

  try {
    // Disable email notifications
    log.test('Disabling email notifications for user');
    attendee.notificationSettings.emailNotifications = false;
    await attendee.save();
    log.success('Email notifications disabled');

    // Try to send a notification
    log.test('Attempting to send notification with email disabled');
    const notification = await notificationService.notifySystemUpdate(
      attendee._id,
      'Test Update',
      'Testing notification settings'
    );
    log.info(`Notification created: ${notification._id}`);
    log.info('Check that no email was sent (verify email service logs)');

    // Re-enable email notifications
    attendee.notificationSettings.emailNotifications = TEST_CONFIG.testEmailDelivery;
    await attendee.save();

  } catch (error) {
    log.error('Settings test failed: ' + error.message);
  }
}

/**
 * Display test summary
 */
async function displaySummary() {
  log.section('TEST SUMMARY');
  
  try {
    for (const user of testData.users) {
      const count = await Notification.countDocuments({ user: user._id });
      const unreadCount = await Notification.getUnreadCount(user._id);
      
      log.info(`${user.name} (${user.role}):`);
      log.info(`  Total notifications: ${count}`);
      log.info(`  Unread: ${unreadCount}`);
      log.info(`  Read: ${count - unreadCount}`);
    }

    const totalNotifications = await Notification.countDocuments();
    log.info(`\nTotal notifications in database: ${totalNotifications}`);

  } catch (error) {
    log.error('Error generating summary: ' + error.message);
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  if (!TEST_CONFIG.cleanupAfterTest) {
    log.warning('Cleanup disabled - test data will remain in database');
    return;
  }

  log.section('CLEANING UP TEST DATA');
  
  try {
    // Delete test notifications
    const notificationResult = await Notification.deleteMany({
      user: { $in: testData.users.map(u => u._id) }
    });
    log.success(`Deleted ${notificationResult.deletedCount} test notifications`);

    // Delete test event
    if (testData.event) {
      await Event.deleteOne({ _id: testData.event._id });
      log.success('Deleted test event');
    }

    // Delete test categories
    const categoryResult = await Category.deleteMany({
      id: { $in: ['music-test', 'social-test'] }
    });
    if (categoryResult.deletedCount > 0) {
      log.success(`Deleted ${categoryResult.deletedCount} test categories`);
    }

    // Delete test users
    const userResult = await User.deleteMany({
      email: { $in: testData.users.map(u => u.email) }
    });
    log.success(`Deleted ${userResult.deletedCount} test users`);

  } catch (error) {
    log.error('Cleanup failed: ' + error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + colors.cyan + '╔════════════════════════════════════════════════╗');
  console.log('║    NOTIFICATION SYSTEM TESTING SCRIPT         ║');
  console.log('╚════════════════════════════════════════════════╝' + colors.reset + '\n');

  try {
    await connectDB();

    if (TEST_CONFIG.createTestUsers) {
      await createTestUsers();
    }

    if (TEST_CONFIG.createTestEvent) {
      await createTestEvent();
    }

    if (TEST_CONFIG.testAllNotificationTypes) {
      await testNotificationCreation();
      await testNotificationQueries();
      await testNotificationMethods();
      await testBulkOperations();
      await testNotificationSettings();
    }

    await displaySummary();
    await cleanup();

    log.section('ALL TESTS COMPLETED');
    log.success('Notification system testing finished successfully!');
    
  } catch (error) {
    log.error('Test suite failed: ' + error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    log.info('Database connection closed');
    process.exit(0);
  }
}

// Run the tests
runTests();
