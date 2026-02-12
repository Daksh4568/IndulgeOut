const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Verification Script: Check if all B2B users have payoutInfo field
 */

async function verifyB2BUsersPayoutInfo() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all host_partner users
        const allB2BUsers = await User.find({ role: 'host_partner' });

        console.log('📊 B2B Users Analysis\n');
        console.log(`Total B2B users: ${allB2BUsers.length}\n`);

        // Group by hostPartnerType
        const byType = {
            community_organizer: [],
            venue: [],
            brand_sponsor: []
        };

        const withPayoutInfo = [];
        const withoutPayoutInfo = [];

        for (const user of allB2BUsers) {
            if (user.hostPartnerType) {
                byType[user.hostPartnerType].push(user);
            }

            if (user.payoutInfo) {
                withPayoutInfo.push(user);
            } else {
                withoutPayoutInfo.push(user);
            }
        }

        console.log('📈 Breakdown by Type:');
        console.log(`   Community Organizers: ${byType.community_organizer.length}`);
        console.log(`   Venues: ${byType.venue.length}`);
        console.log(`   Brand Sponsors: ${byType.brand_sponsor.length}\n`);

        console.log('💳 PayoutInfo Status:');
        console.log(`   ✅ With payoutInfo field: ${withPayoutInfo.length}`);
        console.log(`   ❌ Without payoutInfo field: ${withoutPayoutInfo.length}\n`);

        if (withoutPayoutInfo.length > 0) {
            console.log('⚠️  Users missing payoutInfo field:');
            withoutPayoutInfo.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Type: ${user.hostPartnerType}`);
            });
            console.log('\n💡 Run: node scripts/addPayoutInfoToB2BUsers.js to fix this\n');
        } else {
            console.log('✅ All B2B users have payoutInfo field!\n');
        }

        // Check who has completed payout info
        const completedPayout = allB2BUsers.filter(user =>
            user.payoutInfo &&
            user.payoutInfo.accountNumber &&
            user.payoutInfo.ifscCode &&
            user.payoutInfo.accountHolderName
        );

        const incompletePayout = allB2BUsers.filter(user =>
            !user.payoutInfo ||
            !user.payoutInfo.accountNumber ||
            !user.payoutInfo.ifscCode ||
            !user.payoutInfo.accountHolderName
        );

        console.log('📋 Payout Completion Status:');
        console.log(`   ✅ Completed payout setup: ${completedPayout.length}`);
        console.log(`   ⏳ Pending payout setup: ${incompletePayout.length}\n`);

        if (completedPayout.length > 0) {
            console.log('✅ Users with complete payout info:');
            completedPayout.forEach(user => {
                console.log(`   - ${user.name} (${user.hostPartnerType})`);
            });
            console.log();
        }

        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

// Run the verification
verifyB2BUsersPayoutInfo();
