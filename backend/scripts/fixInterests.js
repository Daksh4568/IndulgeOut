import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Mapping from kebab-case IDs to proper names
const interestMapping = {
  'sip-savor': 'Sip & Savor',
  'sweat-play': 'Sweat & Play',
  'art-diy': 'Art & DIY',
  'social-mixers': 'Social Mixers',
  'adventure-outdoors': 'Adventure & Outdoors',
  'epic-screenings': 'Epic Screenings',
  'indoor-boardgames': 'Indoor & Board Games',
  'music-performance': 'Music & Performance'
};

async function fixUserInterests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with interests
    const users = await User.find({ interests: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with interests`);

    for (const user of users) {
      let hasChanges = false;
      const updatedInterests = user.interests.map(interest => {
        if (interestMapping[interest]) {
          console.log(`Converting ${interest} to ${interestMapping[interest]} for user ${user.email}`);
          hasChanges = true;
          return interestMapping[interest];
        }
        return interest;
      });

      if (hasChanges) {
        user.interests = updatedInterests;
        await user.save();
        console.log(`Updated interests for user: ${user.email}`);
      }
    }

    console.log('Interest migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing interests:', error);
    process.exit(1);
  }
}

fixUserInterests();