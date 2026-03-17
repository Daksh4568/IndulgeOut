/**
 * Script to check if any data exists in the database for fields
 * that have been removed from the User model schema.
 * 
 * Run: node scripts/checkDeletedFields.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkDeletedFields() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const deletedFields = [
      // Venue Profile - removed fields
      { path: 'venueProfile.pricing.hourlyRate', label: 'venueProfile.pricing.hourlyRate' },
      { path: 'venueProfile.pricing.minimumBooking', label: 'venueProfile.pricing.minimumBooking' },
      { path: 'venueProfile.availability.daysAvailable', label: 'venueProfile.availability.daysAvailable' },
      { path: 'venueProfile.availability.timeSlots', label: 'venueProfile.availability.timeSlots' },
      { path: 'venueProfile.commercialModel', label: 'venueProfile.commercialModel' },
      { path: 'venueProfile.defaultPricing.rentalFee', label: 'venueProfile.defaultPricing.rentalFee' },
      { path: 'venueProfile.defaultPricing.coverChargePerGuest', label: 'venueProfile.defaultPricing.coverChargePerGuest' },
      { path: 'venueProfile.defaultPricing.revenueSharePercentage', label: 'venueProfile.defaultPricing.revenueSharePercentage' },
      { path: 'venueProfile.operatingDays', label: 'venueProfile.operatingDays' },
      { path: 'venueProfile.rules.soundRestrictions', label: 'venueProfile.rules.soundRestrictions' },
      { path: 'venueProfile.rules.soundCutoffTime', label: 'venueProfile.rules.soundCutoffTime' },
      { path: 'venueProfile.rules.additionalRules', label: 'venueProfile.rules.additionalRules' },
      { path: 'venueProfile.rules.entryCutoffTime', label: 'venueProfile.rules.entryCutoffTime' },
      { path: 'venueProfile.rules.foodBeverageExclusivity', label: 'venueProfile.rules.foodBeverageExclusivity' },
      { path: 'venueProfile.rules.externalVendorsAllowed', label: 'venueProfile.rules.externalVendorsAllowed' },
      { path: 'venueProfile.rules.decorationAllowed', label: 'venueProfile.rules.decorationAllowed' },

      // Brand Profile - removed fields
      { path: 'brandProfile.contactPerson.designation', label: 'brandProfile.contactPerson.designation' },
      { path: 'brandProfile.brandAssets', label: 'brandProfile.brandAssets' },

      // Community Profile - removed fields
      { path: 'communityProfile.established', label: 'communityProfile.established' },
    ];

    console.log('=== Checking for existing data in deleted fields ===\n');

    let hasData = false;

    for (const field of deletedFields) {
      // For arrays, check if they exist and are non-empty
      // For other fields, check if they exist and are not null/empty
      const query = { [field.path]: { $exists: true, $ne: null, $ne: '' } };
      const count = await usersCollection.countDocuments({
        [field.path]: { $exists: true, $nin: [null, '', []] }
      });

      if (count > 0) {
        hasData = true;
        // Get sample data
        const samples = await usersCollection.find(
          { [field.path]: { $exists: true, $nin: [null, '', []] } },
          { projection: { name: 1, email: 1, [field.path]: 1 } }
        ).limit(3).toArray();

        console.log(`❌ ${field.label}: ${count} document(s) have data`);
        samples.forEach(s => {
          const value = field.path.split('.').reduce((obj, key) => obj?.[key], s);
          console.log(`   - ${s.name} (${s.email}): ${JSON.stringify(value)}`);
        });
        console.log('');
      } else {
        console.log(`✅ ${field.label}: No data found`);
      }
    }

    console.log('\n=== Summary ===');
    if (hasData) {
      console.log('⚠️  Some deleted fields still have data in the database.');

      // Auto-cleanup
      const runCleanup = process.argv.includes('--cleanup');
      
      if (runCleanup) {
        console.log('\n🧹 Running cleanup...\n');
        const unsetFields = {};
        deletedFields.forEach(f => { unsetFields[f.path] = ''; });
        
        const result = await usersCollection.updateMany({}, { $unset: unsetFields });
        console.log(`✅ Cleanup complete: ${result.modifiedCount} document(s) updated.`);
        console.log('   All deleted fields have been removed from the database.');
      } else {
        console.log('   Run with --cleanup flag to remove them:');
        console.log('   node scripts/checkDeletedFields.js --cleanup\n');
        
        const unsetFields = {};
        deletedFields.forEach(f => { unsetFields[f.path] = ''; });
        console.log('=== Or run manually in MongoDB shell ===\n');
        console.log(`db.users.updateMany({}, { $unset: ${JSON.stringify(unsetFields, null, 2)} })`);
      }
    } else {
      console.log('✅ No data found in any deleted fields. Database is clean.');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDeletedFields();
