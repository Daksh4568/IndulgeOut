/**
 * Migration Script: Clean up payout-related data for brands
 * 
 * This script:
 * 1. Removes payout/KYC related notifications for brand users
 * 2. Clears payoutDetails from brand user documents
 * 3. Logs all operations for visibility
 * 
 * Run: node scripts/cleanupBrandPayoutData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupBrandPayoutData() {
  try {
    console.log('🚀 Starting brand payout data cleanup...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find all brand users
    const brandUsers = await User.find({ 
      hostPartnerType: 'brand_sponsor' 
    }).select('_id name email payoutDetails');

    console.log(`📊 Found ${brandUsers.length} brand users\n`);

    if (brandUsers.length === 0) {
      console.log('ℹ️  No brand users found. Exiting...');
      await mongoose.connection.close();
      return;
    }

    // Extract brand user IDs
    const brandUserIds = brandUsers.map(user => user._id);

    // Step 2: Delete payout/KYC related notifications for brands
    console.log('🗑️  Deleting payout/KYC related notifications for brands...');
    
    // First, get count of existing notifications to show before/after
    const existingNotificationsCount = await Notification.countDocuments({
      recipient: { $in: brandUserIds },
      $or: [
        { type: { $in: ['kyc_pending', 'kyc_missing', 'payout_pending', 'payout_required'] } },
        { 
          type: 'profile_incomplete_brand_sponsor',
          message: { $regex: /payout|kyc|bank|payment/i }
        }
      ]
    });

    console.log(`   Found ${existingNotificationsCount} payout-related notifications for brands`);
    
    const notificationResult = await Notification.deleteMany({
      recipient: { $in: brandUserIds },
      $or: [
        { type: { $in: ['kyc_pending', 'kyc_missing', 'payout_pending', 'payout_required'] } },
        { 
          type: 'profile_incomplete_brand_sponsor',
          message: { $regex: /payout|kyc|bank|payment/i }
        }
      ]
    });

    console.log(`   ✓ Deleted ${notificationResult.deletedCount} notifications\n`);

    // Step 3: Clear payoutDetails from brand users
    console.log('🧹 Clearing payoutDetails from brand user documents...');
    
    let clearedCount = 0;
    let alreadyEmptyCount = 0;

    for (const brandUser of brandUsers) {
      if (brandUser.payoutDetails && Object.keys(brandUser.payoutDetails).length > 0) {
        // Update user to remove payoutDetails
        await User.findByIdAndUpdate(
          brandUser._id,
          { $unset: { payoutDetails: "" } },
          { new: true }
        );
        
        console.log(`   ✓ Cleared payout details for: ${brandUser.name || brandUser.email}`);
        clearedCount++;
      } else {
        alreadyEmptyCount++;
      }
    }

    console.log(`\n   • Cleared: ${clearedCount} brand profiles`);
    console.log(`   • Already empty: ${alreadyEmptyCount} brand profiles\n`);

    // Step 4: Summary
    console.log('📋 CLEANUP SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total brand users processed: ${brandUsers.length}`);
    console.log(`Notifications deleted: ${notificationResult.deletedCount}`);
    console.log(`Payout details cleared: ${clearedCount}`);
    console.log(`Already empty: ${alreadyEmptyCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Cleanup completed successfully!');
    console.log('ℹ️  Brands will no longer receive payout-related notifications.');
    console.log('ℹ️  Payout details section removed from brand profiles.\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('\nStack trace:', error.stack);
    
    // Close connection on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed.');
    }
    
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Script interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
  process.exit(0);
});

// Run the cleanup
cleanupBrandPayoutData();
