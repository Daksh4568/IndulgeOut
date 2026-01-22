/**
 * Migration Script: Update existing users from old role structure to new 2-tier system
 * 
 * OLD STRUCTURE:
 * - role: 'user' | 'community_member' | 'venue' | 'brand_sponsor'
 * 
 * NEW STRUCTURE:
 * - role: 'user' | 'host_partner'
 * - hostPartnerType: 'community_organizer' | 'venue' | 'brand_sponsor' (when role is 'host_partner')
 * 
 * MIGRATION MAP:
 * - 'user' → 'user' (no change)
 * - 'community_member' → role: 'host_partner', hostPartnerType: 'community_organizer'
 * - 'venue' → role: 'host_partner', hostPartnerType: 'venue'
 * - 'brand_sponsor' → role: 'host_partner', hostPartnerType: 'brand_sponsor'
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const migrateUserRoles = async () => {
  try {
    console.log('🔄 Starting user role migration...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout');
    console.log('✅ Connected to MongoDB\n');

    // Find all users with old role structure
    const usersToMigrate = await User.find({
      role: { $in: ['community_member', 'venue', 'brand_sponsor'] }
    });

    console.log(`📊 Found ${usersToMigrate.length} users to migrate\n`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No users need migration. All users are already using the new role structure.\n');
      await mongoose.connection.close();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    // Migration mapping
    const roleMapping = {
      'community_member': 'community_organizer',
      'venue': 'venue',
      'brand_sponsor': 'brand_sponsor'
    };

    for (const user of usersToMigrate) {
      try {
        const oldRole = user.role;
        const newHostPartnerType = roleMapping[oldRole];

        // Update user
        user.role = 'host_partner';
        user.hostPartnerType = newHostPartnerType;
        
        await user.save();

        console.log(`✅ Migrated: ${user.email}`);
        console.log(`   Old role: ${oldRole} → New: host_partner (${newHostPartnerType})\n`);
        
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log(`   📊 Total processed: ${usersToMigrate.length} users\n`);

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    const remainingOldUsers = await User.countDocuments({
      role: { $in: ['community_member', 'venue', 'brand_sponsor'] }
    });

    if (remainingOldUsers === 0) {
      console.log('✅ All users successfully migrated to new role structure!\n');
    } else {
      console.log(`⚠️  Warning: ${remainingOldUsers} users still have old role structure\n`);
    }

    // Show current role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: { role: '$role', hostPartnerType: '$hostPartnerType' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.role': 1 } }
    ]);

    console.log('📊 Current User Role Distribution:');
    roleDistribution.forEach(({ _id, count }) => {
      if (_id.role === 'host_partner') {
        console.log(`   - host_partner (${_id.hostPartnerType}): ${count} users`);
      } else {
        console.log(`   - ${_id.role}: ${count} users`);
      }
    });

    await mongoose.connection.close();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateUserRoles();
