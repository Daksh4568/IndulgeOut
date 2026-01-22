const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const deleteDummyAccounts = async () => {
  try {
    await connectDB();

    console.log('🗑️  Deleting dummy accounts...\n');

    // Delete all venue dummy accounts
    const venueEmails = [
      'venue1@indulgeout.com',
      'venue2@indulgeout.com',
      'venue3@indulgeout.com',
      'venue4@indulgeout.com',
      'venue5@indulgeout.com'
    ];

    const deletedVenues = await User.deleteMany({ email: { $in: venueEmails } });
    console.log(`✅ Deleted ${deletedVenues.deletedCount} venue accounts`);

    // Delete all brand dummy accounts
    const brandEmails = [
      'brand1@indulgeout.com',
      'brand2@indulgeout.com',
      'brand3@indulgeout.com',
      'brand4@indulgeout.com',
      'brand5@indulgeout.com'
    ];

    const deletedBrands = await User.deleteMany({ email: { $in: brandEmails } });
    console.log(`✅ Deleted ${deletedBrands.deletedCount} brand accounts`);

    console.log('\n✅ All dummy accounts deleted successfully!');
    console.log('💡 Now run: node scripts/seedDummyAccounts.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting dummy accounts:', error);
    process.exit(1);
  }
};

deleteDummyAccounts();
