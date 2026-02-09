/**
 * Setup Admin Account Script
 * Creates a default admin account for testing and development
 * 
 * Run: node setupAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout';

const adminSchema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  name: String,
  role: String,
  password: String,
  isVerified: Boolean,
  createdAt: { type: Date, default: Date.now }
});

async function setupAdmin() {
  try {
    console.log('\n🔧 Setting up admin account...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const User = mongoose.model('User', adminSchema);
    
    // Admin credentials
    const adminData = {
      phoneNumber: '+919999999999',
      email: 'admin@indulgeout.com',
      name: 'Admin User',
      role: 'admin',
      password: await bcrypt.hash('admin123', 10),
      isVerified: true
    };
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { phoneNumber: adminData.phoneNumber },
        { email: adminData.email }
      ]
    });
    
    if (existingAdmin) {
      // Update existing admin
      existingAdmin.password = adminData.password;
      existingAdmin.name = adminData.name;
      existingAdmin.role = adminData.role;
      existingAdmin.isVerified = true;
      existingAdmin.email = adminData.email;
      await existingAdmin.save();
      console.log('✓ Admin account updated');
    } else {
      // Create new admin
      await User.create(adminData);
      console.log('✓ Admin account created');
    }
    
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║           ADMIN CREDENTIALS                       ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log('║  Phone:    +919999999999                         ║');
    console.log('║  Email:    admin@indulgeout.com                  ║');
    console.log('║  Password: admin123                              ║');
    console.log('║  Role:     admin                                 ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    
    console.log('✅ Admin setup complete!\n');
    console.log('You can now login through:');
    console.log('  - OTP to phone: +919999999999');
    console.log('  - Direct login with email & password (if implemented)\n');
    
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up admin:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupAdmin();
