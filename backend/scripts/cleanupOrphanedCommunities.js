require('dotenv').config();
const mongoose = require('mongoose');
const Community = require('../models/Community');
const User = require('../models/User'); // Import User model for population

/**
 * Cleanup script to remove or deactivate communities whose host users have been deleted
 * Run this script periodically or after batch user deletions
 */

async function cleanupOrphanedCommunities() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all communities
    const allCommunities = await Community.find({})
      .populate('host', '_id');
    
    console.log(`📊 Total communities: ${allCommunities.length}`);
    
    // Find orphaned communities (where host is null after population)
    const orphanedCommunities = allCommunities.filter(comm => !comm.host);
    
    console.log(`❌ Orphaned communities (deleted hosts): ${orphanedCommunities.length}`);
    
    if (orphanedCommunities.length > 0) {
      console.log('\n🗑️  Orphaned communities:');
      orphanedCommunities.forEach(comm => {
        console.log(`  - ${comm.name} (ID: ${comm._id})`);
      });
      
      // Option 1: Delete orphaned communities
      console.log('\n⚠️  Deleting orphaned communities...');
      const deleteResult = await Community.deleteMany({
        _id: { $in: orphanedCommunities.map(c => c._id) }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned communities`);
      
      // Option 2: Alternatively, mark them as inactive instead of deleting
      // await Community.updateMany(
      //   { _id: { $in: orphanedCommunities.map(c => c._id) } },
      //   { $set: { isActive: false } }
      // );
    } else {
      console.log('✨ No orphaned communities found. Database is clean!');
    }
    
    console.log('\n✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the cleanup
cleanupOrphanedCommunities();
