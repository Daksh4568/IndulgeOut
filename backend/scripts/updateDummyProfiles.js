const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Sample images for venues and brands (using placeholder images)
const VENUE_IMAGES = {
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'
  ],
  bar: [
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800'
  ],
  studio: [
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=800',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
  ],
  coworking: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800'
  ]
};

const BRAND_IMAGES = {
  wellness_fitness: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'
  ],
  food_beverage: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'
  ],
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800'
  ],
  fashion: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800'
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'
  ]
};

const updateDummyProfiles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout');
    console.log('✅ Connected to MongoDB');

    // Update Venue Profiles
    console.log('\n📍 Updating Venue Profiles...\n');

    // 1. The Urban Lounge (Bengaluru, Cafe)
    await User.findOneAndUpdate(
      { email: 'venue1@indulgeout.com' },
      {
        $set: {
          'venueProfile.venueName': 'The Urban Lounge',
          'venueProfile.locality': 'Indiranagar',
          'venueProfile.venueType': 'cafe',
          'venueProfile.capacityRange': '20-40',
          'venueProfile.contactPerson': {
            name: 'Rahul Sharma',
            phone: '9876543210',
            email: 'rahul@urbanlounge.com'
          },
          'venueProfile.photos': VENUE_IMAGES.cafe,
          'venueProfile.amenities': ['wifi', 'parking', 'ac', 'outdoor_seating', 'kitchen'],
          'venueProfile.rules': {
            alcoholAllowed: false,
            smokingAllowed: false,
            minimumAge: 18,
            soundRestrictions: 'Until 11 PM',
            additionalRules: 'No outside food allowed'
          },
          'venueProfile.pricing': {
            hourlyRate: 2000,
            minimumBooking: 3,
            currency: 'INR'
          },
          'venueProfile.availability': {
            daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            timeSlots: '9 AM - 11 PM'
          },
          'location.city': 'Bengaluru',
          'location.state': 'Karnataka'
        }
      }
    );
    console.log('✅ Updated: The Urban Lounge');

    // 2. Skyline Terrace (Mumbai, Bar)
    await User.findOneAndUpdate(
      { email: 'venue2@indulgeout.com' },
      {
        $set: {
          'venueProfile.venueName': 'Skyline Terrace',
          'venueProfile.locality': 'Bandra West',
          'venueProfile.venueType': 'bar',
          'venueProfile.capacityRange': '40-80',
          'venueProfile.contactPerson': {
            name: 'Priya Mehta',
            phone: '9876543211',
            email: 'priya@skylineterrace.com'
          },
          'venueProfile.photos': VENUE_IMAGES.bar,
          'venueProfile.amenities': ['wifi', 'parking', 'ac', 'bar', 'sound_system', 'outdoor_seating'],
          'venueProfile.rules': {
            alcoholAllowed: true,
            smokingAllowed: true,
            minimumAge: 21,
            soundRestrictions: 'Until 1 AM',
            additionalRules: 'Valid ID required for entry'
          },
          'venueProfile.pricing': {
            hourlyRate: 5000,
            minimumBooking: 4,
            currency: 'INR'
          },
          'venueProfile.availability': {
            daysAvailable: ['wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            timeSlots: '6 PM - 2 AM'
          },
          'location.city': 'Mumbai',
          'location.state': 'Maharashtra'
        }
      }
    );
    console.log('✅ Updated: Skyline Terrace');

    // 3. Creative Hub Studio (Bengaluru, Studio)
    await User.findOneAndUpdate(
      { email: 'venue3@indulgeout.com' },
      {
        $set: {
          'venueProfile.venueName': 'Creative Hub Studio',
          'venueProfile.locality': 'Koramangala',
          'venueProfile.venueType': 'studio',
          'venueProfile.capacityRange': '20-40',
          'venueProfile.contactPerson': {
            name: 'Amit Kumar',
            phone: '9876543212',
            email: 'amit@creativehub.com'
          },
          'venueProfile.photos': VENUE_IMAGES.studio,
          'venueProfile.amenities': ['wifi', 'parking', 'ac', 'sound_system', 'projector', 'stage'],
          'venueProfile.rules': {
            alcoholAllowed: false,
            smokingAllowed: false,
            minimumAge: 18,
            soundRestrictions: 'Until 10 PM',
            additionalRules: 'Equipment handling with care required'
          },
          'venueProfile.pricing': {
            hourlyRate: 3000,
            minimumBooking: 2,
            currency: 'INR'
          },
          'venueProfile.availability': {
            daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            timeSlots: '10 AM - 10 PM'
          },
          'location.city': 'Bengaluru',
          'location.state': 'Karnataka'
        }
      }
    );
    console.log('✅ Updated: Creative Hub Studio');

    // 4. Garden Grove (Delhi, Outdoor)
    await User.findOneAndUpdate(
      { email: 'venue4@indulgeout.com' },
      {
        $set: {
          'venueProfile.venueName': 'Garden Grove',
          'venueProfile.locality': 'Hauz Khas',
          'venueProfile.venueType': 'outdoor',
          'venueProfile.capacityRange': '80-150',
          'venueProfile.contactPerson': {
            name: 'Neha Singh',
            phone: '9876543213',
            email: 'neha@gardengrove.com'
          },
          'venueProfile.photos': VENUE_IMAGES.outdoor,
          'venueProfile.amenities': ['parking', 'sound_system', 'outdoor_seating', 'stage', 'dance_floor'],
          'venueProfile.rules': {
            alcoholAllowed: true,
            smokingAllowed: true,
            minimumAge: 21,
            soundRestrictions: 'Until 11 PM',
            additionalRules: 'Weather-dependent bookings'
          },
          'venueProfile.pricing': {
            hourlyRate: 8000,
            minimumBooking: 5,
            currency: 'INR'
          },
          'venueProfile.availability': {
            daysAvailable: ['thursday', 'friday', 'saturday', 'sunday'],
            timeSlots: '5 PM - 12 AM'
          },
          'location.city': 'Delhi',
          'location.state': 'Delhi'
        }
      }
    );
    console.log('✅ Updated: Garden Grove');

    // 5. Tech Space (Mumbai, Coworking)
    await User.findOneAndUpdate(
      { email: 'venue5@indulgeout.com' },
      {
        $set: {
          'venueProfile.venueName': 'Tech Space',
          'venueProfile.locality': 'Powai',
          'venueProfile.venueType': 'coworking',
          'venueProfile.capacityRange': '40-80',
          'venueProfile.contactPerson': {
            name: 'Vikram Patel',
            phone: '9876543214',
            email: 'vikram@techspace.com'
          },
          'venueProfile.photos': VENUE_IMAGES.coworking,
          'venueProfile.amenities': ['wifi', 'parking', 'ac', 'projector', 'kitchen', 'sound_system'],
          'venueProfile.rules': {
            alcoholAllowed: false,
            smokingAllowed: false,
            minimumAge: 18,
            soundRestrictions: 'Until 9 PM',
            additionalRules: 'Professional conduct expected'
          },
          'venueProfile.pricing': {
            hourlyRate: 2500,
            minimumBooking: 3,
            currency: 'INR'
          },
          'venueProfile.availability': {
            daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            timeSlots: '9 AM - 9 PM'
          },
          'location.city': 'Mumbai',
          'location.state': 'Maharashtra'
        }
      }
    );
    console.log('✅ Updated: Tech Space');

    // Update Brand Profiles
    console.log('\n🏢 Updating Brand Profiles...\n');

    // 1. FitLife Nutrition (Wellness & Fitness)
    await User.findOneAndUpdate(
      { email: 'brand1@indulgeout.com' },
      {
        $set: {
          'brandProfile.brandName': 'FitLife Nutrition',
          'brandProfile.brandCategory': 'wellness_fitness',
          'brandProfile.targetCity': ['Bengaluru', 'Mumbai', 'Delhi', 'Pune'],
          'brandProfile.sponsorshipType': ['barter', 'product_sampling', 'co-marketing'],
          'brandProfile.collaborationIntent': ['sponsorship', 'sampling', 'brand_activation', 'content_creation'],
          'brandProfile.contactPerson': {
            name: 'Ananya Reddy',
            workEmail: 'ananya@fitlife.com',
            phone: '9876543220',
            designation: 'Marketing Manager'
          },
          'brandProfile.brandDescription': 'Leading nutrition and wellness brand offering premium supplements, protein powders, and health products. Committed to promoting healthy lifestyles through quality products and community engagement.',
          'brandProfile.website': 'https://fitlife.com',
          'brandProfile.instagram': '@fitlife_nutrition',
          'brandProfile.facebook': 'FitLifeNutrition',
          'brandProfile.linkedin': 'fitlife-nutrition',
          'brandProfile.logo': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
          'brandProfile.brandAssets': BRAND_IMAGES.wellness_fitness,
          'brandProfile.budget': {
            min: 50000,
            max: 200000,
            currency: 'INR'
          }
        }
      }
    );
    console.log('✅ Updated: FitLife Nutrition');

    // 2. Brew & Bean (Food & Beverage)
    await User.findOneAndUpdate(
      { email: 'brand2@indulgeout.com' },
      {
        $set: {
          'brandProfile.brandName': 'Brew & Bean',
          'brandProfile.brandCategory': 'food_beverage',
          'brandProfile.targetCity': ['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad'],
          'brandProfile.sponsorshipType': ['barter', 'paid_monetary', 'product_sampling'],
          'brandProfile.collaborationIntent': ['sponsorship', 'sampling', 'popups', 'experience_partnerships'],
          'brandProfile.contactPerson': {
            name: 'Rohan Malhotra',
            workEmail: 'rohan@brewbean.com',
            phone: '9876543221',
            designation: 'Brand Partnerships Head'
          },
          'brandProfile.brandDescription': 'Artisanal coffee roastery and cafe chain specializing in premium coffee experiences. From bean to cup, we craft exceptional coffee moments and build community through coffee culture.',
          'brandProfile.website': 'https://brewandbean.com',
          'brandProfile.instagram': '@brew_and_bean',
          'brandProfile.facebook': 'BrewAndBeanCoffee',
          'brandProfile.linkedin': 'brew-bean-coffee',
          'brandProfile.logo': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
          'brandProfile.brandAssets': BRAND_IMAGES.food_beverage,
          'brandProfile.budget': {
            min: 100000,
            max: 500000,
            currency: 'INR'
          }
        }
      }
    );
    console.log('✅ Updated: Brew & Bean');

    // 3. TechGadgets Pro (Tech)
    await User.findOneAndUpdate(
      { email: 'brand3@indulgeout.com' },
      {
        $set: {
          'brandProfile.brandName': 'TechGadgets Pro',
          'brandProfile.brandCategory': 'tech',
          'brandProfile.targetCity': ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune'],
          'brandProfile.sponsorshipType': ['paid_monetary', 'product_sampling', 'co-marketing'],
          'brandProfile.collaborationIntent': ['sponsorship', 'brand_activation', 'experience_partnerships', 'content_creation'],
          'brandProfile.contactPerson': {
            name: 'Karthik Iyer',
            workEmail: 'karthik@techgadgets.com',
            phone: '9876543222',
            designation: 'Events & Sponsorship Lead'
          },
          'brandProfile.brandDescription': 'Cutting-edge technology brand offering latest gadgets, smart devices, and tech accessories. Passionate about bringing innovative technology to tech enthusiasts and early adopters.',
          'brandProfile.website': 'https://techgadgetspro.com',
          'brandProfile.instagram': '@techgadgets_pro',
          'brandProfile.facebook': 'TechGadgetsPro',
          'brandProfile.linkedin': 'techgadgets-pro',
          'brandProfile.logo': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
          'brandProfile.brandAssets': BRAND_IMAGES.tech,
          'brandProfile.budget': {
            min: 150000,
            max: 800000,
            currency: 'INR'
          }
        }
      }
    );
    console.log('✅ Updated: TechGadgets Pro');

    // 4. EcoWear (Fashion)
    await User.findOneAndUpdate(
      { email: 'brand4@indulgeout.com' },
      {
        $set: {
          'brandProfile.brandName': 'EcoWear',
          'brandProfile.brandCategory': 'fashion',
          'brandProfile.targetCity': ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata'],
          'brandProfile.sponsorshipType': ['barter', 'product_sampling', 'co-marketing'],
          'brandProfile.collaborationIntent': ['sponsorship', 'sampling', 'popups', 'brand_activation', 'content_creation'],
          'brandProfile.contactPerson': {
            name: 'Shreya Kapoor',
            workEmail: 'shreya@ecowear.com',
            phone: '9876543223',
            designation: 'Community & Partnerships Manager'
          },
          'brandProfile.brandDescription': 'Sustainable fashion brand creating eco-friendly, ethically sourced clothing and accessories. Committed to reducing fashion industry impact while delivering style and comfort.',
          'brandProfile.website': 'https://ecowear.com',
          'brandProfile.instagram': '@ecowear_lifestyle',
          'brandProfile.facebook': 'EcoWearLifestyle',
          'brandProfile.linkedin': 'ecowear-lifestyle',
          'brandProfile.logo': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
          'brandProfile.brandAssets': BRAND_IMAGES.fashion,
          'brandProfile.budget': {
            min: 75000,
            max: 300000,
            currency: 'INR'
          }
        }
      }
    );
    console.log('✅ Updated: EcoWear');

    // 5. Urban Beats (Entertainment)
    await User.findOneAndUpdate(
      { email: 'brand5@indulgeout.com' },
      {
        $set: {
          'brandProfile.brandName': 'Urban Beats',
          'brandProfile.brandCategory': 'entertainment',
          'brandProfile.targetCity': ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad'],
          'brandProfile.sponsorshipType': ['paid_monetary', 'barter', 'co-marketing'],
          'brandProfile.collaborationIntent': ['sponsorship', 'brand_activation', 'experience_partnerships', 'content_creation'],
          'brandProfile.contactPerson': {
            name: 'DJ Arjun',
            workEmail: 'arjun@urbanbeats.com',
            phone: '9876543224',
            designation: 'Brand Director'
          },
          'brandProfile.brandDescription': 'Music and entertainment brand curating unforgettable live experiences, music festivals, and artist collaborations. Bringing the best of underground and mainstream music to urban audiences.',
          'brandProfile.website': 'https://urbanbeats.com',
          'brandProfile.instagram': '@urban_beats_official',
          'brandProfile.facebook': 'UrbanBeatsOfficial',
          'brandProfile.linkedin': 'urban-beats',
          'brandProfile.logo': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
          'brandProfile.brandAssets': BRAND_IMAGES.entertainment,
          'brandProfile.budget': {
            min: 200000,
            max: 1000000,
            currency: 'INR'
          }
        }
      }
    );
    console.log('✅ Updated: Urban Beats');

    console.log('\n🎉 All dummy profiles updated successfully!\n');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error updating profiles:', error);
    process.exit(1);
  }
};

// Run the script
updateDummyProfiles();
