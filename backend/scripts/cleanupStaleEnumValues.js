const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User.js');

/**
 * Cleanup Script: Find and fix users with stale/invalid enum values
 * 
 * Checks ALL enum-constrained fields in the User model and removes
 * values that don't match the current schema definitions.
 * 
 * Usage:
 *   DRY RUN (default): node scripts/cleanupStaleEnumValues.js
 *   APPLY FIXES:       node scripts/cleanupStaleEnumValues.js --fix
 */

const DRY_RUN = !process.argv.includes('--fix');

// ─── Current valid enum values per field (from User.js schema) ───

const VALID_ENUMS = {
  // ── Scalar fields ──
  'role': ['user', 'host_partner', 'admin'],
  'hostPartnerType': ['community_organizer', 'venue', 'brand_sponsor'],
  'gender': ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  'adminProfile.accessLevel': ['super_admin', 'content_moderator', 'support_admin'],
  'venueProfile.venueType': ['cafe', 'bar', 'studio', 'club', 'outdoor', 'restaurant', 'coworking', 'other'],
  'venueProfile.spaceType': ['Indoor', 'Outdoor', 'Rooftop', 'Mixed'],
  'venueProfile.parkingAvailability': ['Available', 'Not Available', 'Limited'],
  'venueProfile.capacityRange': ['≤30', '30-50', '50-100', '100+', '0-20', '20-40', '40-80', '80-150', '150-300', '300+'],
  'venueProfile.rules.ageLimit': ['18+', '21+', 'All Ages'],
  'brandProfile.brandCategory': ['food_beverage', 'wellness_fitness', 'lifestyle', 'tech', 'entertainment', 'fashion', 'education', 'other'],
  'communityProfile.communityType': ['open', 'curated'],
  'communityProfile.pastEventExperience': ['0-5', '5-10', '10-30', '30-50', '50-100', '100+'],
  'communityProfile.typicalAudienceSize': ['≤20', '20-50', '50-100', '100+', '0-20', '100-200', '200-500', '500+'],
  'preferences.recommendationFrequency': ['daily', 'weekly', 'monthly'],

  // ── Array fields ──
  'adminProfile.permissions': ['manage_users', 'manage_events', 'manage_collaborations', 'view_analytics', 'manage_payments', 'moderate_content', 'system_settings'],
  'venueProfile.amenities': ['wifi', 'parking', 'ac', 'sound_system', 'projector', 'kitchen', 'bar', 'outdoor_seating', 'stage', 'dance_floor', 'green_room', 'security'],
  'venueProfile.preferredCategories': ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'],
  'venueProfile.preferredEventFormats': ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation'],
  'venueProfile.preferredAudienceTypes': ['Students', 'Young Professionals', 'Founders / Creators', 'Families', 'Niche Community'],
  'brandProfile.sponsorshipType': ['barter', 'paid_monetary', 'product_sampling', 'co-marketing'],
  'brandProfile.collaborationIntent': ['sponsorship', 'sampling', 'popups', 'experience_partnerships', 'brand_activation', 'content_creation'],
  'brandProfile.preferredCategories': ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'],
  'brandProfile.preferredEventFormats': ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation'],
  'brandProfile.preferredCollaborationTypes': ['sponsorship', 'sampling', 'pop-ups', 'co-hosted_events'],
  'brandProfile.preferredAudienceTypes': ['Students', 'Young Professionals', 'Founders / Creators', 'Families', 'Niche Community'],
  'communityProfile.category': ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'],
  'communityProfile.preferredCategories': ['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'],
  'communityProfile.preferredEventFormats': ['Workshop', 'Mixer / Social', 'Tournament', 'Performance / Show', 'Panel / Talk', 'Experiential / Activation'],
  'communityProfile.preferredAudienceTypes': ['Students', 'Young Professionals', 'Founders / Creators', 'Families', 'Niche Community'],
  'interests': ['Sip & Savor', 'Sweat & Play', 'Art & DIY', 'Social Mixers', 'Adventure & Outdoors', 'Epic Screenings', 'Indoor & Board Games', 'Music & Performance', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games'],
  'preferences.preferredEventTimes': ['morning', 'afternoon', 'evening', 'night'],
};

// Array fields (values stored as arrays, not scalars)
const ARRAY_FIELDS = new Set([
  'adminProfile.permissions', 'venueProfile.amenities',
  'venueProfile.preferredCategories', 'venueProfile.preferredEventFormats', 'venueProfile.preferredAudienceTypes',
  'brandProfile.sponsorshipType', 'brandProfile.collaborationIntent',
  'brandProfile.preferredCategories', 'brandProfile.preferredEventFormats',
  'brandProfile.preferredCollaborationTypes', 'brandProfile.preferredAudienceTypes',
  'communityProfile.category', 'communityProfile.preferredCategories',
  'communityProfile.preferredEventFormats', 'communityProfile.preferredAudienceTypes',
  'interests', 'preferences.preferredEventTimes',
]);

/**
 * Get a nested value from an object by dot-path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

async function cleanupStaleEnumValues() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Cleanup Stale Enum Values in User Profiles');
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '🔧 APPLYING FIXES'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Fetch all users as plain objects to bypass Mongoose validation on read
    const users = await User.find({}).lean();
    console.log(`📊 Total users to scan: ${users.length}\n`);

    let totalUsersWithIssues = 0;
    let totalFieldsFixed = 0;
    let totalInvalidValues = 0;
    const issuesByField = {};

    for (const user of users) {
      const userId = user._id;
      const identifier = user.email || user.phoneNumber || userId;
      const userIssues = [];
      const updateOps = {};

      for (const [fieldPath, validValues] of Object.entries(VALID_ENUMS)) {
        const currentValue = getNestedValue(user, fieldPath);
        if (currentValue === undefined || currentValue === null) continue;

        const isArray = ARRAY_FIELDS.has(fieldPath);

        if (isArray) {
          if (!Array.isArray(currentValue) || currentValue.length === 0) continue;
          const invalidValues = currentValue.filter(v => !validValues.includes(v));
          if (invalidValues.length > 0) {
            const cleanedValues = currentValue.filter(v => validValues.includes(v));
            userIssues.push({
              field: fieldPath,
              invalid: invalidValues,
              kept: cleanedValues,
            });
            updateOps[fieldPath] = cleanedValues;
            totalInvalidValues += invalidValues.length;
            issuesByField[fieldPath] = (issuesByField[fieldPath] || 0) + 1;
          }
        } else {
          if (!validValues.includes(currentValue)) {
            userIssues.push({
              field: fieldPath,
              invalid: [currentValue],
              kept: null,
            });
            updateOps[fieldPath] = null;
            totalInvalidValues++;
            issuesByField[fieldPath] = (issuesByField[fieldPath] || 0) + 1;
          }
        }
      }

      if (userIssues.length > 0) {
        totalUsersWithIssues++;
        totalFieldsFixed += userIssues.length;

        console.log(`\n👤 ${identifier} (${user.role || 'user'}${user.hostPartnerType ? ' / ' + user.hostPartnerType : ''})`);
        for (const issue of userIssues) {
          console.log(`   ❌ ${issue.field}`);
          console.log(`      Invalid: ${JSON.stringify(issue.invalid)}`);
          console.log(`      ${issue.kept !== null ? `Keeping: ${JSON.stringify(issue.kept)}` : 'Will set to: null'}`);
        }

        if (!DRY_RUN) {
          // Use updateOne with $set to bypass Mongoose validation
          const setOps = {};
          const unsetOps = {};
          for (const [field, value] of Object.entries(updateOps)) {
            if (value === null) {
              unsetOps[field] = '';
            } else {
              setOps[field] = value;
            }
          }
          const update = {};
          if (Object.keys(setOps).length > 0) update.$set = setOps;
          if (Object.keys(unsetOps).length > 0) update.$unset = unsetOps;

          await User.updateOne({ _id: userId }, update);
          console.log(`   ✅ Fixed`);
        }
      }
    }

    // ─── Summary ───
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total users scanned: ${users.length}`);
    console.log(`  Users with issues:   ${totalUsersWithIssues}`);
    console.log(`  Fields with issues:  ${totalFieldsFixed}`);
    console.log(`  Invalid values:      ${totalInvalidValues}`);

    if (Object.keys(issuesByField).length > 0) {
      console.log('\n  Breakdown by field:');
      for (const [field, count] of Object.entries(issuesByField).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${field}: ${count} user(s)`);
      }
    }

    if (totalUsersWithIssues === 0) {
      console.log('\n  ✅ All user profiles are clean — no stale enum values found!');
    } else if (DRY_RUN) {
      console.log(`\n  ⚠️  Run with --fix to apply changes:`);
      console.log(`     node scripts/cleanupStaleEnumValues.js --fix`);
    } else {
      console.log(`\n  ✅ All ${totalUsersWithIssues} user(s) fixed successfully!`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupStaleEnumValues();
