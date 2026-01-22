const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Dummy Venue Accounts
const dummyVenues = [
  {
    name: 'The Urban Lounge',
    email: 'venue1@indulgeout.com',
    password: 'Venue@123',
    phoneNumber: '9876543210',
    role: 'host_partner',
    hostPartnerType: 'venue',
    onboardingCompleted: true,
    venueProfile: {
      venueName: 'The Urban Lounge',
      locality: 'Indiranagar',
      city: 'Bengaluru',
      venueType: 'cafe',
      capacityRange: '20-40',
      contactPerson: {
        name: 'Rajesh Kumar',
        phone: '9876543210',
        email: 'venue1@indulgeout.com'
      },
      photos: [
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800'
      ],
      amenities: ['wifi', 'ac', 'parking', 'sound_system', 'outdoor_seating'],
      rules: {
        alcoholAllowed: false,
        smokingAllowed: false,
        minimumAge: 18,
        soundRestrictions: 'Music must end by 10 PM on weekdays',
        additionalRules: 'No outside food allowed'
      },
      pricing: {
        hourlyRate: 2000,
        minimumBooking: 3,
        currency: 'INR'
      },
      availability: {
        daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        timeSlots: '6 PM - 11 PM'
      },
      description: 'Cozy urban cafe perfect for intimate gatherings, workshops, and creative meetups. Features comfortable seating and excellent acoustics.'
    }
  },
  {
    name: 'Skyline Terrace',
    email: 'venue2@indulgeout.com',
    password: 'Venue@123',
    phoneNumber: '9876543211',
    role: 'host_partner',
    hostPartnerType: 'venue',
    onboardingCompleted: true,
    venueProfile: {
      venueName: 'Skyline Terrace',
      locality: 'Bandra West',
      city: 'Mumbai',
      venueType: 'bar',
      capacityRange: '40-80',
      contactPerson: {
        name: 'Priya Sharma',
        phone: '9876543211',
        email: 'venue2@indulgeout.com'
      },
      photos: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800'
      ],
      amenities: ['wifi', 'ac', 'bar', 'sound_system', 'outdoor_seating', 'stage'],
      rules: {
        alcoholAllowed: true,
        smokingAllowed: true,
        minimumAge: 21,
        soundRestrictions: 'Live music allowed until 11:30 PM',
        additionalRules: 'Valid ID required for entry'
      },
      pricing: {
        hourlyRate: 5000,
        minimumBooking: 4,
        currency: 'INR'
      },
      availability: {
        daysAvailable: ['friday', 'saturday', 'sunday'],
        timeSlots: '7 PM - 12 AM'
      },
      description: 'Rooftop bar with stunning city views. Ideal for networking events, live music performances, and upscale social gatherings.'
    }
  },
  {
    name: 'Creative Hub Studio',
    email: 'venue3@indulgeout.com',
    password: 'Venue@123',
    phoneNumber: '9876543212',
    role: 'host_partner',
    hostPartnerType: 'venue',
    onboardingCompleted: true,
    venueProfile: {
      venueName: 'Creative Hub Studio',
      locality: 'Koramangala',
      city: 'Bengaluru',
      venueType: 'studio',
      capacityRange: '20-40',
      contactPerson: {
        name: 'Arjun Mehta',
        phone: '9876543212',
        email: 'venue3@indulgeout.com'
      },
      photos: [
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'
      ],
      amenities: ['wifi', 'ac', 'projector', 'sound_system', 'kitchen', 'green_room'],
      rules: {
        alcoholAllowed: false,
        smokingAllowed: false,
        minimumAge: 16,
        soundRestrictions: 'No loud music after 9 PM',
        additionalRules: 'Clean up required after events'
      },
      pricing: {
        hourlyRate: 1500,
        minimumBooking: 2,
        currency: 'INR'
      },
      availability: {
        daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        timeSlots: 'Flexible - 9 AM to 9 PM'
      },
      description: 'Versatile creative space for workshops, art sessions, team building activities, and skill-sharing events.'
    }
  },
  {
    name: 'Garden Grove Venue',
    email: 'venue4@indulgeout.com',
    password: 'Venue@123',
    phoneNumber: '9876543213',
    role: 'host_partner',
    hostPartnerType: 'venue',
    onboardingCompleted: true,
    venueProfile: {
      venueName: 'Garden Grove',
      locality: 'Hauz Khas',
      city: 'Delhi',
      venueType: 'outdoor',
      capacityRange: '80-150',
      contactPerson: {
        name: 'Neha Singh',
        phone: '9876543213',
        email: 'venue4@indulgeout.com'
      },
      photos: [
        'https://images.unsplash.com/photo-1519167758481-83f29da8c686?w=800',
        'https://images.unsplash.com/photo-1530047625168-4b29bfbbe1fc?w=800',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800'
      ],
      amenities: ['parking', 'sound_system', 'outdoor_seating', 'stage', 'security'],
      rules: {
        alcoholAllowed: true,
        smokingAllowed: true,
        minimumAge: 18,
        soundRestrictions: 'Events must end by 10 PM',
        additionalRules: 'Weather-dependent bookings'
      },
      pricing: {
        hourlyRate: 8000,
        minimumBooking: 4,
        currency: 'INR'
      },
      availability: {
        daysAvailable: ['friday', 'saturday', 'sunday'],
        timeSlots: '4 PM - 10 PM'
      },
      description: 'Beautiful outdoor garden space perfect for festivals, outdoor movie screenings, yoga sessions, and large community gatherings.'
    }
  },
  {
    name: 'Tech Space Coworking',
    email: 'venue5@indulgeout.com',
    password: 'Venue@123',
    phoneNumber: '9876543214',
    role: 'host_partner',
    hostPartnerType: 'venue',
    onboardingCompleted: true,
    venueProfile: {
      venueName: 'Tech Space',
      locality: 'Powai',
      city: 'Mumbai',
      venueType: 'coworking',
      capacityRange: '40-80',
      contactPerson: {
        name: 'Vikram Patel',
        phone: '9876543214',
        email: 'venue5@indulgeout.com'
      },
      photos: [
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800',
        'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800'
      ],
      amenities: ['wifi', 'ac', 'projector', 'sound_system', 'kitchen', 'parking'],
      rules: {
        alcoholAllowed: false,
        smokingAllowed: false,
        minimumAge: 18,
        soundRestrictions: 'Moderate noise levels',
        additionalRules: 'Professional environment - no loud music'
      },
      pricing: {
        hourlyRate: 3000,
        minimumBooking: 3,
        currency: 'INR'
      },
      availability: {
        daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        timeSlots: '9 AM - 7 PM'
      },
      description: 'Modern coworking space ideal for tech meetups, startup events, hackathons, and professional networking sessions.'
    }
  }
];

// Dummy Brand Accounts
const dummyBrands = [
  {
    name: 'FitLife Nutrition',
    email: 'brand1@indulgeout.com',
    password: 'Brand@123',
    phoneNumber: '9876543220',
    role: 'host_partner',
    hostPartnerType: 'brand_sponsor',
    onboardingCompleted: true,
    brandProfile: {
      brandName: 'FitLife Nutrition',
      brandCategory: 'wellness_fitness',
      targetCity: ['Bengaluru', 'Mumbai', 'Delhi', 'Pune'],
      sponsorshipType: ['barter', 'product_sampling'],
      collaborationIntent: ['sampling', 'brand_activation', 'sponsorship'],
      contactPerson: {
        name: 'Ananya Reddy',
        workEmail: 'ananya@fitlife.com',
        phone: '9876543220',
        designation: 'Marketing Manager'
      },
      brandDescription: 'Leading health and wellness brand offering protein supplements, nutrition bars, and fitness products. We partner with fitness communities and wellness events.',
      website: 'https://fitlife.com',
      instagram: '@fitlifeindia',
      facebook: 'fitlifeindia',
      linkedin: 'fitlife-nutrition',
      logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      budget: {
        min: 10000,
        max: 50000,
        currency: 'INR'
      }
    }
  },
  {
    name: 'Brew & Bean Coffee',
    email: 'brand2@indulgeout.com',
    password: 'Brand@123',
    phoneNumber: '9876543221',
    role: 'host_partner',
    hostPartnerType: 'brand_sponsor',
    onboardingCompleted: true,
    brandProfile: {
      brandName: 'Brew & Bean',
      brandCategory: 'food_beverage',
      targetCity: ['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad'],
      sponsorshipType: ['barter', 'product_sampling', 'co-marketing'],
      collaborationIntent: ['sampling', 'popups', 'content_creation'],
      contactPerson: {
        name: 'Rohan Malhotra',
        workEmail: 'rohan@brewandbean.com',
        phone: '9876543221',
        designation: 'Brand Partnerships Lead'
      },
      brandDescription: 'Artisanal coffee brand specializing in specialty blends and cold brews. Perfect for morning events, workshops, and creative meetups.',
      website: 'https://brewandbean.com',
      instagram: '@brewandbean',
      facebook: 'brewandbean',
      linkedin: 'brew-and-bean',
      logo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      budget: {
        min: 15000,
        max: 75000,
        currency: 'INR'
      }
    }
  },
  {
    name: 'TechGadgets Pro',
    email: 'brand3@indulgeout.com',
    password: 'Brand@123',
    phoneNumber: '9876543222',
    role: 'host_partner',
    hostPartnerType: 'brand_sponsor',
    onboardingCompleted: true,
    brandProfile: {
      brandName: 'TechGadgets Pro',
      brandCategory: 'tech',
      targetCity: ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune'],
      sponsorshipType: ['paid_monetary', 'product_sampling', 'co-marketing'],
      collaborationIntent: ['sponsorship', 'brand_activation', 'experience_partnerships'],
      contactPerson: {
        name: 'Karthik Iyer',
        workEmail: 'karthik@techgadgets.com',
        phone: '9876543222',
        designation: 'Community Manager'
      },
      brandDescription: 'Premium tech accessories brand offering headphones, smartwatches, and mobile accessories. We sponsor tech events, hackathons, and innovation meetups.',
      website: 'https://techgadgetspro.com',
      instagram: '@techgadgetspro',
      facebook: 'techgadgetspro',
      linkedin: 'techgadgets-pro',
      logo: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400',
      budget: {
        min: 25000,
        max: 150000,
        currency: 'INR'
      }
    }
  },
  {
    name: 'EcoWear Lifestyle',
    email: 'brand4@indulgeout.com',
    password: 'Brand@123',
    phoneNumber: '9876543223',
    role: 'host_partner',
    hostPartnerType: 'brand_sponsor',
    onboardingCompleted: true,
    brandProfile: {
      brandName: 'EcoWear',
      brandCategory: 'fashion',
      targetCity: ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata'],
      sponsorshipType: ['barter', 'co-marketing'],
      collaborationIntent: ['popups', 'content_creation', 'brand_activation'],
      contactPerson: {
        name: 'Simran Kaur',
        workEmail: 'simran@ecowear.com',
        phone: '9876543223',
        designation: 'Partnerships Head'
      },
      brandDescription: 'Sustainable fashion brand creating eco-friendly clothing and accessories. We collaborate with conscious living communities and environmental events.',
      website: 'https://ecowear.com',
      instagram: '@ecowearliving',
      facebook: 'ecowearliving',
      linkedin: 'ecowear-lifestyle',
      logo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
      budget: {
        min: 20000,
        max: 100000,
        currency: 'INR'
      }
    }
  },
  {
    name: 'Urban Beats Entertainment',
    email: 'brand5@indulgeout.com',
    password: 'Brand@123',
    phoneNumber: '9876543224',
    role: 'host_partner',
    hostPartnerType: 'brand_sponsor',
    onboardingCompleted: true,
    brandProfile: {
      brandName: 'Urban Beats',
      brandCategory: 'entertainment',
      targetCity: ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad'],
      sponsorshipType: ['paid_monetary', 'co-marketing'],
      collaborationIntent: ['sponsorship', 'experience_partnerships', 'content_creation'],
      contactPerson: {
        name: 'DJ Arjun',
        workEmail: 'arjun@urbanbeats.com',
        phone: '9876543224',
        designation: 'Events Director'
      },
      brandDescription: 'Music and entertainment brand hosting DJ nights, live performances, and music festivals. We sponsor music events and cultural gatherings.',
      website: 'https://urbanbeats.com',
      instagram: '@urbanbeatsofficial',
      facebook: 'urbanbeatsofficial',
      linkedin: 'urban-beats',
      logo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      budget: {
        min: 50000,
        max: 200000,
        currency: 'INR'
      }
    }
  }
];

// Seed function
const seedDummyAccounts = async () => {
  try {
    console.log('🌱 Starting to seed dummy accounts...\n');

    // Connect to database
    await connectDB();

    // Insert Venues
    console.log('📍 Creating venue accounts...');
    for (const venueData of dummyVenues) {
      // Check if venue already exists
      const existingVenue = await User.findOne({ email: venueData.email });
      if (existingVenue) {
        console.log(`⚠️  Venue ${venueData.venueProfile.venueName} already exists. Skipping.`);
        continue;
      }

      // Create venue (password will be hashed by User model's pre-save hook)
      const venue = new User(venueData);
      await venue.save();
      console.log(`✅ Created venue: ${venueData.venueProfile.venueName}`);
    }

    // Insert Brands
    console.log('\n🏢 Creating brand accounts...');
    for (const brandData of dummyBrands) {
      // Check if brand already exists
      const existingBrand = await User.findOne({ email: brandData.email });
      if (existingBrand) {
        console.log(`⚠️  Brand ${brandData.brandProfile.brandName} already exists. Skipping.`);
        continue;
      }

      // Create brand (password will be hashed by User model's pre-save hook)
      const brand = new User(brandData);
      await brand.save();
      console.log(`✅ Created brand: ${brandData.brandProfile.brandName}`);
    }

    console.log('\n✅ All dummy accounts created successfully!\n');

    // Print login credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 DUMMY ACCOUNT LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📍 VENUE ACCOUNTS:');
    console.log('─────────────────────────────────────────────');
    dummyVenues.forEach((venue, index) => {
      console.log(`\n${index + 1}. ${venue.venueProfile.venueName}`);
      console.log(`   Email:    ${venue.email}`);
      console.log(`   Password: Venue@123`);
      console.log(`   City:     ${venue.venueProfile.city}`);
      console.log(`   Type:     ${venue.venueProfile.venueType}`);
    });

    console.log('\n\n🏢 BRAND ACCOUNTS:');
    console.log('─────────────────────────────────────────────');
    dummyBrands.forEach((brand, index) => {
      console.log(`\n${index + 1}. ${brand.brandProfile.brandName}`);
      console.log(`   Email:    ${brand.email}`);
      console.log(`   Password: Brand@123`);
      console.log(`   Category: ${brand.brandProfile.brandCategory}`);
      console.log(`   Cities:   ${brand.brandProfile.targetCity.join(', ')}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 TIP: Use these credentials to login and test');
    console.log('    Browse Venues and Browse Brands functionality\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummy accounts:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDummyAccounts();
