const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Migration Script: Add payoutInfo field to existing B2B users
 * This ensures all host_partner users have the payoutInfo object initialized
 */

async function addPayoutInfoToB2BUsers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all host_partner users
        const b2bUsers = await User.find({
            role: 'host_partner',
            payoutInfo: { $exists: false }
        });

        console.log(`📊 Found ${b2bUsers.length} B2B users without payoutInfo field\n`);

        if (b2bUsers.length === 0) {
            console.log('✅ All B2B users already have payoutInfo field');
            await mongoose.connection.close();
            return;
        }

        let updated = 0;

        for (const user of b2bUsers) {
            console.log(`👤 Processing user: ${user.name} (${user.email})`);
            console.log(`   Type: ${user.hostPartnerType}`);

            user.payoutInfo = {};
            await user.save();

            updated++;
            console.log(`   ✅ Added payoutInfo field\n`);
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   Total B2B users processed: ${b2bUsers.length}`);
        console.log(`   Successfully updated: ${updated}`);
        console.log('\n✅ Migration completed successfully!');

        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
addPayoutInfoToB2BUsers();
