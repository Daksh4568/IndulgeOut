/**
 * Migration Script: Generate Slugs for Existing Events
 * 
 * This script generates SEO-friendly URL slugs for all existing events
 * that don't have a slug yet.
 * 
 * Usage:
 * node scripts/generateEventSlugs.js [--fix]
 * 
 * --fix: Actually update the database (default is dry run)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

// Function to generate URL-friendly slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

async function generateEventSlugs(isDryRun = true) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all events without slugs
    const eventsWithoutSlugs = await Event.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).select('_id title slug');

    console.log(`📊 Found ${eventsWithoutSlugs.length} events without slugs\n`);

    if (eventsWithoutSlugs.length === 0) {
      console.log('✅ All events already have slugs!');
      return;
    }

    const updates = [];
    const slugTracker = new Set();

    for (const event of eventsWithoutSlugs) {
      let baseSlug = generateSlug(event.title);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug uniqueness
      while (slugTracker.has(slug) || await Event.findOne({ slug, _id: { $ne: event._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      slugTracker.add(slug);
      updates.push({
        eventId: event._id,
        title: event.title,
        oldSlug: event.slug || '(none)',
        newSlug: slug
      });

      if (!isDryRun) {
        // Update the event with new slug
        await Event.findByIdAndUpdate(event._id, { slug });
      }
    }

    // Display results
    console.log('📝 Slug Generation Summary:\n');
    console.log('─'.repeat(100));
    console.log(
      'Event ID'.padEnd(26) + 
      'Title'.padEnd(40) + 
      'New Slug'.padEnd(34)
    );
    console.log('─'.repeat(100));

    for (const update of updates) {
      console.log(
        update.eventId.toString().padEnd(26) +
        (update.title.length > 37 ? update.title.substring(0, 37) + '...' : update.title).padEnd(40) +
        update.newSlug.padEnd(34)
      );
    }
    
    console.log('─'.repeat(100));
    console.log(`\n📊 Total events to update: ${updates.length}`);

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
      console.log('💡 Run with --fix flag to apply these changes');
    } else {
      console.log('\n✅ All event slugs have been generated and saved!');
    }

  } catch (error) {
    console.error('❌ Error generating slugs:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--fix');

if (isDryRun) {
  console.log('🔍 Running in DRY RUN mode...\n');
} else {
  console.log('⚡ Running in FIX mode - will update database...\n');
}

generateEventSlugs(isDryRun)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
