const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
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

// Dummy data pools
const dummyData = {
  cities: [
    'Bengaluru', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 
    'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Goa'
  ],
  
  categories: [
    'Sip & Savor',
    'Sweat & Play',
    'Art & DIY',
    'Social Mixers',
    'Adventure & Outdoors',
    'Epic Screenings',
    'Indoor & Board Games',
    'Music & Performance'
  ],
  
  communityTypes: ['open', 'curated'],
  
  descriptions: [
    'A vibrant community bringing together like-minded people for unforgettable experiences.',
    'We create magical moments through carefully curated events and activities.',
    'Join us for exciting gatherings that celebrate creativity, connection, and culture.',
    'Building a community of enthusiasts who love to explore, connect, and create memories.',
    'Bringing people together through thoughtfully designed events and immersive experiences.',
    'A dynamic community dedicated to fostering connections through engaging activities.',
    'Experience the joy of community through our diverse range of events and gatherings.',
    'Creating memorable experiences that bring people closer and build lasting friendships.'
  ],
  
  instagramHandles: [
    'thecultureclub_blr',
    'urbanvibes_community',
    'creativeminds_collective',
    'socialbutterfly_events',
    'experiencemakers_india',
    'communityconnect_in',
    'eventhub_community',
    'tribegatherings'
  ],
  
  websites: [
    'https://www.communityhub.in',
    'https://www.eventscollective.com',
    'https://www.tribegatherings.in',
    'https://www.socialconnect.club',
    'https://www.experiencecommunity.in'
  ],
  
  contactNames: [
    'Priya Sharma', 'Rahul Patel', 'Sneha Reddy', 'Amit Kumar',
    'Kavya Menon', 'Arjun Singh', 'Neha Gupta', 'Rohan Desai',
    'Ananya Iyer', 'Vikram Malhotra', 'Riya Kapoor', 'Karan Mehta'
  ],
  
  pastEventExperiences: ['0-5', '5-10', '10-30', '30-50', '50-100', '100+'],
  
  audienceSizes: ['0-20', '20-50', '50-100', '100-200', '200-500', '500+'],
  
  eventPhotoUrls: [
    'https://images.unsplash.com/photo-1511578314322-379afb476865',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
    'https://images.unsplash.com/photo-1478147427282-58a87a120781',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3'
  ]
};

// Helper function to get random item from array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random items from array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate phone number
const generatePhone = () => {
  const prefix = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
  const number = prefix + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return number;
};

// Helper function to generate email from name
const generateEmail = (name, communityName) => {
  const firstName = name.split(' ')[0].toLowerCase();
  const suffix = communityName ? communityName.toLowerCase().replace(/\s+/g, '') : 'community';
  return `${firstName}@${suffix}.com`;
};

// Helper function to generate random date in the past
const generatePastDate = (yearsBack = 5) => {
  const now = new Date();
  const past = new Date(now.getFullYear() - yearsBack, 0, 1);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
};

// Fill missing community profile data
const fillCommunityData = async () => {
  try {
    // Find all community organizer accounts
    const communityAccounts = await User.find({
      role: 'host_partner',
      hostPartnerType: 'community_organizer'
    });

    if (communityAccounts.length === 0) {
      console.log('⚠️  No community accounts found');
      return;
    }

    console.log(`\n📊 Found ${communityAccounts.length} community accounts\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of communityAccounts) {
      let hasUpdates = false;
      const updates = [];

      // Initialize communityProfile if it doesn't exist
      if (!user.communityProfile) {
        user.communityProfile = {};
      }

      const profile = user.communityProfile;

      // Fill communityName if missing
      if (!profile.communityName) {
        const adjectives = ['The', 'Urban', 'Creative', 'Social', 'Modern', 'Dynamic', 'Cultural'];
        const nouns = ['Collective', 'Circle', 'Hub', 'Tribe', 'Community', 'Club', 'Network'];
        profile.communityName = `${getRandomItem(adjectives)} ${getRandomItem(nouns)}`;
        updates.push('communityName');
        hasUpdates = true;
      }

      // Fill city if missing
      if (!profile.city) {
        profile.city = getRandomItem(dummyData.cities);
        updates.push('city');
        hasUpdates = true;
      }

      // Fill primaryCategory if missing
      if (!profile.primaryCategory) {
        profile.primaryCategory = getRandomItem(dummyData.categories);
        updates.push('primaryCategory');
        hasUpdates = true;
      }

      // Fill communityType if missing
      if (!profile.communityType) {
        profile.communityType = getRandomItem(dummyData.communityTypes);
        updates.push('communityType');
        hasUpdates = true;
      }

      // Fill contactPerson if missing
      if (!profile.contactPerson) {
        profile.contactPerson = {};
      }

      if (!profile.contactPerson.name) {
        profile.contactPerson.name = getRandomItem(dummyData.contactNames);
        updates.push('contactPerson.name');
        hasUpdates = true;
      }

      if (!profile.contactPerson.email) {
        profile.contactPerson.email = generateEmail(
          profile.contactPerson.name || getRandomItem(dummyData.contactNames),
          profile.communityName
        );
        updates.push('contactPerson.email');
        hasUpdates = true;
      }

      if (!profile.contactPerson.phone) {
        profile.contactPerson.phone = generatePhone();
        updates.push('contactPerson.phone');
        hasUpdates = true;
      }

      // Fill communityDescription if missing
      if (!profile.communityDescription) {
        profile.communityDescription = getRandomItem(dummyData.descriptions);
        updates.push('communityDescription');
        hasUpdates = true;
      }

      // Fill instagram if missing
      if (!profile.instagram) {
        profile.instagram = `@${getRandomItem(dummyData.instagramHandles)}`;
        updates.push('instagram');
        hasUpdates = true;
      }

      // Fill facebook if missing (optional, 50% chance)
      if (!profile.facebook && Math.random() > 0.5) {
        profile.facebook = `https://facebook.com/${profile.communityName?.toLowerCase().replace(/\s+/g, '') || 'community'}`;
        updates.push('facebook');
        hasUpdates = true;
      }

      // Fill website if missing (optional, 40% chance)
      if (!profile.website && Math.random() > 0.6) {
        profile.website = getRandomItem(dummyData.websites);
        updates.push('website');
        hasUpdates = true;
      }

      // Fill pastEventPhotos if missing or empty
      if (!profile.pastEventPhotos || profile.pastEventPhotos.length === 0) {
        const photoCount = Math.floor(Math.random() * 4) + 2; // 2-5 photos
        profile.pastEventPhotos = getRandomItems(dummyData.eventPhotoUrls, photoCount);
        updates.push(`pastEventPhotos (${photoCount} photos)`);
        hasUpdates = true;
      }

      // Fill pastEventExperience if missing
      if (!profile.pastEventExperience) {
        profile.pastEventExperience = getRandomItem(dummyData.pastEventExperiences);
        updates.push('pastEventExperience');
        hasUpdates = true;
      }

      // Fill typicalAudienceSize if missing
      if (!profile.typicalAudienceSize) {
        profile.typicalAudienceSize = getRandomItem(dummyData.audienceSizes);
        updates.push('typicalAudienceSize');
        hasUpdates = true;
      }

      // Fill established date if missing
      if (!profile.established) {
        profile.established = generatePastDate(5);
        updates.push('established');
        hasUpdates = true;
      }

      // Fill memberCount if missing
      if (!profile.memberCount || profile.memberCount === 0) {
        // Generate member count based on audience size
        const sizeRanges = {
          '0-20': [50, 200],
          '20-50': [200, 500],
          '50-100': [500, 1000],
          '100-200': [1000, 2000],
          '200-500': [2000, 5000],
          '500+': [5000, 15000]
        };
        const range = sizeRanges[profile.typicalAudienceSize] || [100, 1000];
        profile.memberCount = Math.floor(Math.random() * (range[1] - range[0])) + range[0];
        updates.push('memberCount');
        hasUpdates = true;
      }

      // Mark onboarding as completed if all required fields are filled
      if (!user.onboardingCompleted && 
          profile.communityName && 
          profile.city && 
          profile.primaryCategory && 
          profile.communityDescription) {
        user.onboardingCompleted = true;
        updates.push('onboardingCompleted');
        hasUpdates = true;
      }

      // Save the user if there are updates
      if (hasUpdates) {
        await user.save();
        updatedCount++;
        console.log(`✅ Updated: ${user.email}`);
        console.log(`   Community: ${profile.communityName}`);
        console.log(`   Fields filled: ${updates.join(', ')}`);
        console.log('');
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped: ${user.email} (all fields already filled)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully updated ${updatedCount} community accounts`);
    console.log(`⏭️  Skipped ${skippedCount} accounts (already complete)`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error filling community data:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await fillCommunityData();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
main();
