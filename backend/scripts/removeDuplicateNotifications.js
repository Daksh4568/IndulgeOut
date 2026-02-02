const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Script to remove duplicate action_required notifications
 * Keeps only the oldest notification of each type for each user
 */
async function removeDuplicateNotifications() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✓ Connected to MongoDB');

    // Find all action_required notifications grouped by user and type
    const duplicates = await Notification.aggregate([
      {
        $match: {
          category: 'action_required'
        }
      },
      {
        $sort: { createdAt: 1 } // Sort by oldest first
      },
      {
        $group: {
          _id: {
            recipient: '$recipient',
            type: '$type'
          },
          notifications: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only groups with duplicates
        }
      }
    ]);

    console.log(`\nFound ${duplicates.length} groups of duplicate notifications`);

    let totalDeleted = 0;

    for (const group of duplicates) {
      // Keep the first (oldest) notification, delete the rest
      const [keepId, ...deleteIds] = group.notifications;
      
      if (deleteIds.length > 0) {
        const result = await Notification.deleteMany({
          _id: { $in: deleteIds }
        });

        console.log(`✓ User ${group._id.recipient}, Type: ${group._id.type}`);
        console.log(`  Kept: ${keepId}, Deleted: ${deleteIds.length} duplicates`);
        
        totalDeleted += result.deletedCount;
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`Total notifications deleted: ${totalDeleted}`);

  } catch (error) {
    console.error('❌ Error removing duplicate notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
removeDuplicateNotifications();
