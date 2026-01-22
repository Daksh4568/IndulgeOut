const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const dropPhoneNumberIndex = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    console.log('🔍 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name).join(', '));
    
    // Drop the phoneNumber_1 index
    try {
      await collection.dropIndex('phoneNumber_1');
      console.log('✅ Successfully dropped phoneNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('⚠️  phoneNumber_1 index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Index cleanup complete! You can now run the seed script.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

dropPhoneNumberIndex();
