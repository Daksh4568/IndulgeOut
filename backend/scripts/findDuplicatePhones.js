/**
 * Script: Find Duplicate Phone Numbers
 * 
 * Checks how many accounts share the same phone number.
 * 
 * HOW TO USE:
 * node scripts/findDuplicatePhones.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function findDuplicatePhones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const duplicates = await User.aggregate([
      { $match: { phoneNumber: { $ne: null, $ne: '' } } },
      { $group: { _id: '$phoneNumber', count: { $sum: 1 }, accounts: { $push: { id: '$_id', name: '$name', email: '$email', role: '$role', lastLoginAt: '$lastLoginAt', createdAt: '$createdAt' } } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate phone numbers found.');
    } else {
      console.log(`⚠️  Found ${duplicates.length} phone number(s) shared across multiple accounts:\n`);
      let totalAffected = 0;
      for (const dup of duplicates) {
        totalAffected += dup.count;
        console.log(`📱 Phone: ${dup._id} — ${dup.count} accounts`);
        for (const acc of dup.accounts) {
          console.log(`   • ${acc.name} (${acc.email}) | role: ${acc.role} | created: ${acc.createdAt?.toISOString().split('T')[0] || 'N/A'} | lastLogin: ${acc.lastLoginAt?.toISOString().split('T')[0] || 'never'}`);
        }
        console.log('');
      }
      console.log(`Total: ${duplicates.length} duplicate phone(s) affecting ${totalAffected} accounts`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

findDuplicatePhones();
