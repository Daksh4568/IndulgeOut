/**
 * Migration Script: Update All Events to Use 6 Hardcoded Categories
 * 
 * This script maps old category names to the new 6 fixed categories:
 * 1. Social Mixers
 * 2. Wellness, Fitness & Sports
 * 3. Art, Music & Dance
 * 4. Immersive
 * 5. Food & Beverage
 * 6. Games
 * 
 * Usage: node scripts/migrateCategoriesTo6Fixed.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Define the 6 new categories
const NEW_CATEGORIES = [
  'Social Mixers',
  'Wellness, Fitness & Sports',
  'Art, Music & Dance',
  'Immersive',
  'Food & Beverage',
  'Games'
];

// Category mapping from old names to new categories
const CATEGORY_MAPPING = {
  // Social Mixers variations
  'meet-mingle': 'Social Mixers',
  'Meet & Mingle': 'Social Mixers',
  'Social Mixers': 'Social Mixers',
  'social mixers': 'Social Mixers',
  'networking': 'Social Mixers',
  'Networking': 'Social Mixers',
  'socializing': 'Social Mixers',
  'Socializing': 'Social Mixers',
  'ice-breaker': 'Social Mixers',
  'Ice Breaker': 'Social Mixers',
  'speed friending': 'Social Mixers',
  'hangouts': 'Social Mixers',
  'Hangouts': 'Social Mixers',

  // Wellness, Fitness & Sports variations
  'wellness-fitness': 'Wellness, Fitness & Sports',
  'Wellness': 'Wellness, Fitness & Sports',
  'wellness': 'Wellness, Fitness & Sports',
  'Fitness': 'Wellness, Fitness & Sports',
  'fitness': 'Wellness, Fitness & Sports',
  'Sports': 'Wellness, Fitness & Sports',
  'sports': 'Wellness, Fitness & Sports',
  'Yoga': 'Wellness, Fitness & Sports',
  'yoga': 'Wellness, Fitness & Sports',
  'Meditation': 'Wellness, Fitness & Sports',
  'meditation': 'Wellness, Fitness & Sports',
  'Adventure': 'Wellness, Fitness & Sports',
  'adventure': 'Wellness, Fitness & Sports',
  'adventurous': 'Wellness, Fitness & Sports',
  'running': 'Wellness, Fitness & Sports',
  'Running': 'Wellness, Fitness & Sports',
  'cycling': 'Wellness, Fitness & Sports',
  'Cycling': 'Wellness, Fitness & Sports',
  'outdoor': 'Wellness, Fitness & Sports',
  'Outdoor': 'Wellness, Fitness & Sports',
  'hiking': 'Wellness, Fitness & Sports',
  'Hiking': 'Wellness, Fitness & Sports',
  'Sweat & Play': 'Wellness, Fitness & Sports',
  'Adventure & Outdoors': 'Wellness, Fitness & Sports',
  'Fitness & Wellness': 'Wellness, Fitness & Sports',

  // Art, Music & Dance variations
  'art-music-dance': 'Art, Music & Dance',
  'Art': 'Art, Music & Dance',
  'art': 'Art, Music & Dance',
  'Music': 'Art, Music & Dance',
  'music': 'Art, Music & Dance',
  'Dance': 'Art, Music & Dance',
  'dance': 'Art, Music & Dance',
  'Creative': 'Art, Music & Dance',
  'creative': 'Art, Music & Dance',
  'workshops': 'Art, Music & Dance',
  'Workshops': 'Art, Music & Dance',
  'pop-ups': 'Art, Music & Dance',
  'Pop-Ups': 'Art, Music & Dance',
  'jams': 'Art, Music & Dance',
  'Jams': 'Art, Music & Dance',
  'battle-beats': 'Art, Music & Dance',
  'Battle of the Beats': 'Art, Music & Dance',
  'DJ': 'Art, Music & Dance',
  'dj': 'Art, Music & Dance',
  'art-diy': 'Art, Music & Dance',
  'Art & DIY': 'Art, Music & Dance',
  'painting': 'Art, Music & Dance',
  'Painting': 'Art, Music & Dance',
  'Music & Performance': 'Art, Music & Dance',
  'Learning Workshops': 'Art, Music & Dance',

  // Immersive variations
  'immersive': 'Immersive',
  'Immersive': 'Immersive',
  'Festival': 'Immersive',
  'festival': 'Immersive',
  'Festivals': 'Immersive',
  'festivals': 'Immersive',
  'Carnival': 'Immersive',
  'carnival': 'Immersive',
  'carnivals': 'Immersive',
  'Carnivals': 'Immersive',
  'Screening': 'Immersive',
  'screening': 'Immersive',
  'screenings': 'Immersive',
  'Screenings': 'Immersive',
  'epic-screenings': 'Immersive',
  'Epic Screenings': 'Immersive',
  'experiential': 'Immersive',
  'Experiential': 'Immersive',
  'theatre': 'Immersive',
  'Theatre': 'Immersive',
  'theater': 'Immersive',
  'Theater': 'Immersive',
  'performance': 'Immersive',
  'Performance': 'Immersive',
  'Epic Nights': 'Immersive',
  'Festivals & Celebrations': 'Immersive',
  'Indie Bazaar': 'Immersive',

  // Food & Beverage variations
  'food-beverage': 'Food & Beverage',
  'Food': 'Food & Beverage',
  'food': 'Food & Beverage',
  'Beverage': 'Food & Beverage',
  'beverage': 'Food & Beverage',
  'Food & Beverage': 'Food & Beverage',
  'Culinary': 'Food & Beverage',
  'culinary': 'Food & Beverage',
  'Cooking': 'Food & Beverage',
  'cooking': 'Food & Beverage',
  'Tasting': 'Food & Beverage',
  'tasting': 'Food & Beverage',
  'food-tastings': 'Food & Beverage',
  'Food Tastings': 'Food & Beverage',
  'cook-outs': 'Food & Beverage',
  'Cook Outs': 'Food & Beverage',
  'wine': 'Food & Beverage',
  'Wine': 'Food & Beverage',
  'drinks': 'Food & Beverage',
  'Drinks': 'Food & Beverage',
  'Sip & Savor': 'Food & Beverage',
  'Food & Culinary': 'Food & Beverage',

  // Games variations
  'games': 'Games',
  'Games': 'Games',
  'board-games': 'Games',
  'Board Games': 'Games',
  'indoor-board-games': 'Games',
  'Indoor & Board Games': 'Games',
  'trivia': 'Games',
  'Trivia': 'Games',
  'Quiz': 'Games',
  'quiz': 'Games',
  'murder mysteries': 'Games',
  'Murder Mysteries': 'Games',
  'e-sports': 'Games',
  'E-Sports': 'Games',
  'esports': 'Games',
  'Esports': 'Games',
  'gaming': 'Games',
  'Gaming': 'Games',
  'indoor sports': 'Games',
  'Indoor Sports': 'Games',
  'arcade': 'Games',
  'Arcade': 'Games',
  
  // Additional mappings
  'Make a Difference': 'Social Mixers',
  'Community & Impact': 'Social Mixers',
};

// Function to map old category to new category
const mapCategory = (oldCategory) => {
  if (!oldCategory) return null;
  
  // Direct match
  if (NEW_CATEGORIES.includes(oldCategory)) {
    return oldCategory;
  }
  
  // Check mapping
  if (CATEGORY_MAPPING[oldCategory]) {
    return CATEGORY_MAPPING[oldCategory];
  }
  
  // Try lowercase match
  const lowerCategory = oldCategory.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (key.toLowerCase() === lowerCategory) {
      return value;
    }
  }
  
  // Try partial match (contains)
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (oldCategory.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(oldCategory.toLowerCase())) {
      return value;
    }
  }
  
  // Default fallback based on keywords
  const categoryLower = oldCategory.toLowerCase();
  
  if (categoryLower.includes('social') || categoryLower.includes('network') || 
      categoryLower.includes('mingle') || categoryLower.includes('meet')) {
    return 'Social Mixers';
  }
  
  if (categoryLower.includes('fit') || categoryLower.includes('wellness') || 
      categoryLower.includes('sport') || categoryLower.includes('yoga') || 
      categoryLower.includes('health')) {
    return 'Wellness, Fitness & Sports';
  }
  
  if (categoryLower.includes('art') || categoryLower.includes('music') || 
      categoryLower.includes('dance') || categoryLower.includes('creative')) {
    return 'Art, Music & Dance';
  }
  
  if (categoryLower.includes('festival') || categoryLower.includes('immersive') || 
      categoryLower.includes('carnival') || categoryLower.includes('screen') || 
      categoryLower.includes('theatre') || categoryLower.includes('theater')) {
    return 'Immersive';
  }
  
  if (categoryLower.includes('food') || categoryLower.includes('drink') || 
      categoryLower.includes('culinary') || categoryLower.includes('tasting') || 
      categoryLower.includes('cook')) {
    return 'Food & Beverage';
  }
  
  if (categoryLower.includes('game') || categoryLower.includes('trivia') || 
      categoryLower.includes('quiz') || categoryLower.includes('board') || 
      categoryLower.includes('esport') || categoryLower.includes('arcade')) {
    return 'Games';
  }
  
  // If no match found, default to Social Mixers (most general category)
  console.log(`⚠️  No mapping found for "${oldCategory}", defaulting to "Social Mixers"`);
  return 'Social Mixers';
};

// Main migration function
const migrateCategories = async () => {
  try {
    console.log('\n🚀 Starting Category Migration...\n');
    
    // Get Event model
    const Event = require('../models/Event');
    
    // Fetch all events
    const events = await Event.find({});
    console.log(`📊 Found ${events.length} events to process\n`);
    
    if (events.length === 0) {
      console.log('✅ No events to migrate');
      return;
    }
    
    let updatedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;
    const categoryStats = {};
    
    // Initialize stats for new categories
    NEW_CATEGORIES.forEach(cat => {
      categoryStats[cat] = 0;
    });
    
    // Process each event
    for (const event of events) {
      try {
        const oldCategories = event.categories || [];
        const newCategories = [];
        
        // Map each old category to new category
        for (const oldCat of oldCategories) {
          const newCat = mapCategory(oldCat);
          if (newCat && !newCategories.includes(newCat)) {
            newCategories.push(newCat);
            categoryStats[newCat]++;
          }
        }
        
        // If no categories mapped and event had categories, default to Social Mixers
        if (newCategories.length === 0 && oldCategories.length > 0) {
          newCategories.push('Social Mixers');
          categoryStats['Social Mixers']++;
          console.log(`⚠️  Event "${event.title}" had no mappable categories, defaulted to Social Mixers`);
        }
        
        // If event had no categories at all, default to Social Mixers
        if (newCategories.length === 0) {
          newCategories.push('Social Mixers');
          categoryStats['Social Mixers']++;
          console.log(`⚠️  Event "${event.title}" had no categories, defaulted to Social Mixers`);
        }
        
        // Check if update is needed
        const categoriesChanged = JSON.stringify(oldCategories.sort()) !== JSON.stringify(newCategories.sort());
        
        if (categoriesChanged) {
          // Update the event
          event.categories = newCategories;
          await event.save();
          
          updatedCount++;
          console.log(`✅ Updated: "${event.title}"`);
          console.log(`   Old: [${oldCategories.join(', ')}]`);
          console.log(`   New: [${newCategories.join(', ')}]\n`);
        } else {
          unchangedCount++;
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating event "${event.title}":`, error.message);
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Events Processed: ${events.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Unchanged: ${unchangedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n📈 Category Distribution:');
    console.log('='.repeat(60));
    
    NEW_CATEGORIES.forEach(cat => {
      const count = categoryStats[cat];
      const percentage = ((count / events.length) * 100).toFixed(1);
      console.log(`${cat.padEnd(35)} : ${count.toString().padStart(4)} events (${percentage}%)`);
    });
    
    console.log('='.repeat(60));
    console.log('\n✅ Migration Complete!\n');
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
    throw error;
  }
};

// Run the migration
const run = async () => {
  try {
    await connectDB();
    await migrateCategories();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script Failed:', error);
    process.exit(1);
  }
};

// Execute
run();
