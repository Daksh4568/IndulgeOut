/**
 * Script to clean up incorrect profile_incomplete_host notifications for brands and venues
 * These users should get profile_incomplete_brand or profile_incomplete_venue instead
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout';

async function cleanupWrongNotifications() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all brands and venues
        const brandsAndVenues = await User.find({
            role: 'host_partner',
            hostPartnerType: { $in: ['brand_sponsor', 'venue'] }
        }).select('_id hostPartnerType');

        console.log(`\n📊 Found ${brandsAndVenues.length} brand/venue users`);

        const brandIds = brandsAndVenues
            .filter(u => u.hostPartnerType === 'brand_sponsor')
            .map(u => u._id);

        const venueIds = brandsAndVenues
            .filter(u => u.hostPartnerType === 'venue')
            .map(u => u._id);

        console.log(`   - ${brandIds.length} brands`);
        console.log(`   - ${venueIds.length} venues`);

        // Delete profile_incomplete_host notifications for brands and venues
        const deleteResult = await Notification.deleteMany({
            recipient: { $in: [...brandIds, ...venueIds] },
            type: 'profile_incomplete_host'
        });

        console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} incorrect profile_incomplete_host notifications`);

        // Also delete any community profile notifications for brands and venues
        const communityNotifResult = await Notification.deleteMany({
            recipient: { $in: [...brandIds, ...venueIds] },
            type: { $in: ['profile_incomplete_host', 'kyc_pending_host'] },
            $or: [
                { message: { $regex: 'community', $options: 'i' } },
                { title: { $regex: 'community', $options: 'i' } }
            ]
        });

        console.log(`🗑️  Deleted ${communityNotifResult.deletedCount} community-related notifications for brands/venues`);

        console.log('\n✅ Cleanup completed successfully!');

        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}

cleanupWrongNotifications();
