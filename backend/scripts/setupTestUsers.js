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
    name: 'IndulgeOut Admin',
    email: 'daksh@indulgeout.com',
    phoneNumber: '9636475458',
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
  console.log('│ Email:  daksh@indulgeout.com                                  │');
  console.log('│ Phone:  9636475458                                            │');
  console.log('└───────────────────────────────────────────────────────────────┘');
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
