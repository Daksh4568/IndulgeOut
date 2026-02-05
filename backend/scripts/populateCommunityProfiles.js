const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const communityData = [
  {
    email: 'community1@indulgeout.com',
    password: 'password123',
    name: 'Wellness Warriors',
    phoneNumber: '9876543210',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Wellness Warriors',
      city: 'Mumbai',
      primaryCategory: 'Fitness & Wellness',
      communityType: 'curated',
      contactPerson: {
        name: 'Anjali Sharma',
        email: 'anjali@wellnesswarriors.com',
        phone: '9876543210'
      },
      communityDescription: 'A vibrant community dedicated to holistic wellness, yoga, meditation, and mindful living. Join us for transformative experiences.',
      instagram: '@wellnesswarriors',
      facebook: 'WellnessWarriorsMumbai',
      website: 'www.wellnesswarriors.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800'
      ],
      pastEventExperience: '30-50',
      typicalAudienceSize: '50-100',
      established: new Date('2020-01-15'),
      memberCount: 2500
    },
    profilePicture: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
  },
  {
    email: 'community2@indulgeout.com',
    password: 'password123',
    name: 'Mumbai Creatives Collective',
    phoneNumber: '9876543211',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Mumbai Creatives Collective',
      city: 'Mumbai',
      primaryCategory: 'Arts & Culture',
      communityType: 'curated',
      contactPerson: {
        name: 'Rahul Mehra',
        email: 'rahul@mumbaicreatives.com',
        phone: '9876543211'
      },
      communityDescription: 'An enchanting outdoor venue perfect for intimate gatherings and creative events under the stars',
      instagram: '@mumbaicreatives',
      facebook: 'MumbaiCreativesCollective',
      website: 'www.mumbaicreatives.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'
      ],
      pastEventExperience: '50-100',
      typicalAudienceSize: '20-50',
      established: new Date('2019-05-20'),
      memberCount: 1800
    },
    profilePicture: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400'
  },
  {
    email: 'community3@indulgeout.com',
    password: 'password123',
    name: 'Tech Innovators Hub',
    phoneNumber: '9876543212',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Tech Innovators Hub',
      city: 'Bengaluru',
      primaryCategory: 'Tech & Innovation',
      communityType: 'open',
      contactPerson: {
        name: 'Priya Singh',
        email: 'priya@techinnovators.com',
        phone: '9876543212'
      },
      communityDescription: 'Connecting tech enthusiasts, entrepreneurs, and innovators. Weekly meetups, hackathons, and knowledge sharing sessions.',
      instagram: '@techinnovatorshub',
      facebook: 'TechInnovatorsHubBengaluru',
      website: 'www.techinnovatorshub.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800'
      ],
      pastEventExperience: '100+',
      typicalAudienceSize: '100-200',
      established: new Date('2018-03-10'),
      memberCount: 5000
    },
    profilePicture: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
  },
  {
    email: 'community4@indulgeout.com',
    password: 'password123',
    name: 'Foodies Paradise Delhi',
    phoneNumber: '9876543213',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Foodies Paradise Delhi',
      city: 'Delhi',
      primaryCategory: 'Food & Beverage',
      communityType: 'open',
      contactPerson: {
        name: 'Vikram Khanna',
        email: 'vikram@foodiesparadise.com',
        phone: '9876543213'
      },
      communityDescription: 'Explore the culinary wonders of Delhi with fellow food lovers. Food walks, restaurant reviews, and cooking workshops.',
      instagram: '@foodiesparadisedelhi',
      facebook: 'FoodiesParadiseDelhi',
      website: 'www.foodiesparadise.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'
      ],
      pastEventExperience: '50-100',
      typicalAudienceSize: '50-100',
      established: new Date('2021-06-15'),
      memberCount: 3200
    },
    profilePicture: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'
  },
  {
    email: 'community5@indulgeout.com',
    password: 'password123',
    name: 'Bangalore Music Collective',
    phoneNumber: '9876543214',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Bangalore Music Collective',
      city: 'Bengaluru',
      primaryCategory: 'Music & Performance',
      communityType: 'curated',
      contactPerson: {
        name: 'Arjun Nair',
        email: 'arjun@blrmusic.com',
        phone: '9876543214'
      },
      communityDescription: 'A platform for musicians, music lovers, and industry professionals. Live performances, jam sessions, and networking events.',
      instagram: '@blrmusiccollective',
      facebook: 'BangaloreMusicCollective',
      website: 'www.blrmusic.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800'
      ],
      pastEventExperience: '30-50',
      typicalAudienceSize: '200-500',
      established: new Date('2019-09-01'),
      memberCount: 4500
    },
    profilePicture: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400'
  },
  {
    email: 'community6@indulgeout.com',
    password: 'password123',
    name: 'Pune Adventure Seekers',
    phoneNumber: '9876543215',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Pune Adventure Seekers',
      city: 'Pune',
      primaryCategory: 'Sports & Outdoors',
      communityType: 'open',
      contactPerson: {
        name: 'Sneha Desai',
        email: 'sneha@puneadventure.com',
        phone: '9876543215'
      },
      communityDescription: 'Trek, climb, and explore with Pune\'s most active outdoor community. Weekend getaways and adventure sports.',
      instagram: '@puneadventureseekers',
      facebook: 'PuneAdventureSeekers',
      website: 'www.puneadventure.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
      ],
      pastEventExperience: '100+',
      typicalAudienceSize: '20-50',
      established: new Date('2017-04-22'),
      memberCount: 6800
    },
    profilePicture: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'
  },
  {
    email: 'community7@indulgeout.com',
    password: 'password123',
    name: 'Hyderabad Business Network',
    phoneNumber: '9876543216',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Hyderabad Business Network',
      city: 'Hyderabad',
      primaryCategory: 'Business & Networking',
      communityType: 'curated',
      contactPerson: {
        name: 'Karthik Reddy',
        email: 'karthik@hydbusiness.com',
        phone: '9876543216'
      },
      communityDescription: 'Connect with entrepreneurs, business leaders, and professionals. Monthly networking events and business workshops.',
      instagram: '@hydbusinessnetwork',
      facebook: 'HyderabadBusinessNetwork',
      website: 'www.hydbusiness.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
        'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800'
      ],
      pastEventExperience: '50-100',
      typicalAudienceSize: '100-200',
      established: new Date('2020-11-10'),
      memberCount: 2100
    },
    profilePicture: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400'
  },
  {
    email: 'community8@indulgeout.com',
    password: 'password123',
    name: 'Chennai Social Impact Circle',
    phoneNumber: '9876543217',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    communityProfile: {
      communityName: 'Chennai Social Impact Circle',
      city: 'Chennai',
      primaryCategory: 'Social Impact',
      communityType: 'open',
      contactPerson: {
        name: 'Lakshmi Iyer',
        email: 'lakshmi@chennaisocialimpact.com',
        phone: '9876543217'
      },
      communityDescription: 'Creating positive change through community initiatives, volunteering, and social entrepreneurship programs.',
      instagram: '@chennaisocialimpact',
      facebook: 'ChennaiSocialImpactCircle',
      website: 'www.chennaisocialimpact.com',
      pastEventPhotos: [
        'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
        'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800'
      ],
      pastEventExperience: '30-50',
      typicalAudienceSize: '50-100',
      established: new Date('2021-02-14'),
      memberCount: 1500
    },
    profilePicture: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400'
  }
];

async function populateCommunityProfiles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if communities already exist
    for (const community of communityData) {
      const existingUser = await User.findOne({ email: community.email });
      
      if (existingUser) {
        console.log(`Community ${community.communityProfile.communityName} already exists, updating...`);
        // Update existing community
        await User.findOneAndUpdate(
          { email: community.email },
          {
            $set: {
              name: community.name,
              phoneNumber: community.phoneNumber,
              communityProfile: community.communityProfile,
              profilePicture: community.profilePicture
            }
          }
        );
        console.log(`✓ Updated: ${community.communityProfile.communityName}`);
      } else {
        // Create new community
        const newCommunity = new User(community);
        await newCommunity.save();
        console.log(`✓ Created: ${community.communityProfile.communityName}`);
      }
    }

    console.log('\n✅ All community profiles populated successfully!');
    console.log(`Total communities: ${communityData.length}`);
    
    // Display summary
    console.log('\n📊 Communities Summary:');
    communityData.forEach((community, index) => {
      console.log(`${index + 1}. ${community.communityProfile.communityName} (${community.communityProfile.city}) - ${community.communityProfile.communityType}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error populating community profiles:', error);
    process.exit(1);
  }
}

// Run the script
populateCommunityProfiles();
