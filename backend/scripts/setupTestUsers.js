/**
 * Setup Test Users for Collaboration Workflow Testing
 * Creates: Admin, Community Organizer, Venue, Brand Sponsor
 * 
 * Usage: node scripts/setupTestUsers.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Test Users Configuration
const testUsers = [
  {
    name: 'Test Admin',
    email: 'testadmin@indulgeout.com',
    phoneNumber: '8888888801',
    role: 'admin',
    adminProfile: {
      accessLevel: 'super_admin',
      permissions: [
        'manage_collaborations',
        'manage_users',
        'view_analytics',
        'manage_events',
        'manage_payments',
        'moderate_content',
        'system_settings'
      ],
      department: 'Operations',
      assignedBy: null
    }
  },
  {
    name: 'Test Community Organizer',
    email: 'testcommunity@indulgeout.com',
    phoneNumber: '8888888802',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    onboardingCompleted: true,
    communityProfile: {
      communityName: 'Test Community Hub',
      city: 'Mumbai',
      locality: 'Bandra',
      primaryCategory: 'music',
      communityType: 'open',
      meetupFrequency: 'weekly',
      averageAttendance: '50-100',
      communityAge: '1-2 years',
      targetAudience: 'Music enthusiasts and performers',
      description: 'A vibrant community for music lovers and artists to connect and collaborate.',
      socialMedia: {
        instagram: '@testcommunityhub'
      }
    }
  },
  {
    name: 'Test Venue Partner',
    email: 'testvenue@indulgeout.com',
    phoneNumber: '8888888803',
    role: 'host_partner',
    hostPartnerType: 'venue',
    onboardingCompleted: true,
    venueProfile: {
      venueName: 'Test Music Lounge',
      locality: 'Andheri West',
      city: 'Mumbai',
      venueType: 'bar',
      capacityRange: '150-300',
      contactPerson: {
        name: 'Venue Manager',
        phone: '8888888803',
        email: 'testvenue@indulgeout.com'
      },
      photos: [
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
      ],
      amenities: ['wifi', 'ac', 'parking', 'sound_system', 'stage', 'bar', 'green_room'],
      rules: {
        alcoholAllowed: true,
        smokingAllowed: false,
        minimumAge: 18,
        soundRestrictions: 'Music allowed until 11 PM',
        additionalRules: 'Valid ID required for entry'
      },
      pricing: {
        hourlyRate: 8000,
        minimumBooking: 3,
        currency: 'INR'
      },
      availability: {
        daysAvailable: ['thursday', 'friday', 'saturday', 'sunday'],
        timeSlots: '6 PM - 12 AM'
      },
      description: 'Premium music lounge with state-of-the-art sound system and comfortable seating for up to 250 guests.'
    }
  },
  {
    name: 'Test Brand Sponsor',
    email: 'testbrand@indulgeout.com',
    phoneNumber: '8888888804',
    role: 'host_partner',
    hostPartnerType: 'brand_sponsor',
    onboardingCompleted: true,
    brandProfile: {
      brandName: 'Test Energy Drink Co.',
      brandCategory: 'food_beverage',
      targetCity: ['Mumbai', 'Bengaluru'],
      sponsorshipType: ['paid_monetary', 'product_sampling'],
      collaborationIntent: ['brand_activation', 'sampling', 'sponsorship'],
      contactPerson: {
        name: 'Brand Manager',
        phone: '8888888804',
        email: 'testbrand@indulgeout.com'
      },
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400',
      budget: {
        min: 50000,
        max: 100000,
        currency: 'INR'
      },
      pastCollaborations: 'Music festivals, sports events, college fests',
      description: 'Leading energy drink brand looking to partner with music communities and events for brand activation.'
    }
  }
];

// Clear existing test users
async function clearTestUsers() {
  console.log('\n🧹 Clearing existing test users...');
  
  const testEmails = testUsers.map(u => u.email);
  const testPhones = testUsers.map(u => u.phoneNumber);
  
  const result = await User.deleteMany({
    $or: [
      { email: { $in: testEmails } },
      { phoneNumber: { $in: testPhones } }
    ]
  });
  
  console.log(`  ✓ Removed ${result.deletedCount} existing test accounts`);
}

// Create test users
async function createTestUsers() {
  console.log('\n👥 Creating test users...\n');
  
  const createdUsers = [];
  
  for (const userData of testUsers) {
    try {
      // Create user with OTP verification already completed
      const user = new User({
        ...userData,
        otpVerification: {
          otp: '000000', // Dummy OTP (won't be used)
          otpExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          otpAttempts: 0,
          lastOTPSent: new Date(),
          isPhoneVerified: true // Mark as verified
        },
        analytics: {
          registrationDate: new Date(),
          registrationMethod: 'script',
          lastLogin: new Date()
        }
      });
      
      await user.save();
      createdUsers.push(user);
      
      console.log(`  ✅ Created: ${userData.name}`);
      console.log(`     📧 Email: ${userData.email}`);
      console.log(`     📱 Phone: ${userData.phoneNumber}`);
      console.log(`     👤 Role: ${userData.role}${userData.hostPartnerType ? ` (${userData.hostPartnerType})` : ''}`);
      console.log('');
      
    } catch (error) {
      console.error(`  ❌ Failed to create ${userData.name}:`, error.message);
    }
  }
  
  return createdUsers;
}

// Display summary and usage instructions
function displaySummary(users) {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   ✅ TEST USERS CREATED SUCCESSFULLY                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log('📋 TEST CREDENTIALS:\n');
  console.log('┌───────────────────────────────────────────────────────────────┐');
  console.log('│ Admin User                                                    │');
  console.log('├───────────────────────────────────────────────────────────────┤');
  console.log('│ Email:  testadmin@indulgeout.com                              │');
  console.log('│ Phone:  8888888801                                            │');
  console.log('└───────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌───────────────────────────────────────────────────────────────┐');
  console.log('│ Community Organizer                                           │');
  console.log('├───────────────────────────────────────────────────────────────┤');
  console.log('│ Email:  testcommunity@indulgeout.com                          │');
  console.log('│ Phone:  8888888802                                            │');
  console.log('└───────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌───────────────────────────────────────────────────────────────┐');
  console.log('│ Venue Partner                                                 │');
  console.log('├───────────────────────────────────────────────────────────────┤');
  console.log('│ Email:  testvenue@indulgeout.com                              │');
  console.log('│ Phone:  8888888803                                            │');
  console.log('└───────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌───────────────────────────────────────────────────────────────┐');
  console.log('│ Brand Sponsor                                                 │');
  console.log('├───────────────────────────────────────────────────────────────┤');
  console.log('│ Email:  testbrand@indulgeout.com                              │');
  console.log('│ Phone:  8888888804                                            │');
  console.log('└───────────────────────────────────────────────────────────────┘');
  console.log('\n');
  console.log('📌 NEXT STEPS:\n');
  console.log('  1. Update testCollaborationWorkflow.js with these credentials');
  console.log('  2. Run: node scripts/testCollaborationWorkflow.js');
  console.log('\n');
  console.log('💡 NOTE: All users are pre-verified and ready to use!');
  console.log('   No OTP verification needed for testing.\n');
}

// Main execution
async function main() {
  try {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   SETUP TEST USERS FOR COLLABORATION WORKFLOW                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    await connectDB();
    await clearTestUsers();
    const users = await createTestUsers();
    displaySummary(users);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
