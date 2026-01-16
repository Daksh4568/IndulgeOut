const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxLength: 1000
  },
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxLength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const testimonialSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxLength: 500
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  shortDescription: {
    type: String,
    maxLength: 200
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Social & Fun
      'Meet & Mingle',
      'Epic Screenings',
      'Indoor & Board Games',
      'Battle of the Beats',
      // Creative & Culture
      'Make & Create',
      'Open Mics & Jams',
      'Culture & Heritage',
      'Underground & Street',
      // Active & Outdoor
      'Sweat & Play',
      'Adventure & Outdoors',
      'Mind & Body Recharge',
      // Learn & Build
      'Learn & Network',
      'Startup Connect',
      'Tech Unplugged',
      // Purpose & Experiences
      'Make a Difference',
      'Immersive & Experiential',
      'Indie Bazaar',
      // Legacy Categories (for backward compatibility)
      'Sip & Savor',
      'Art & DIY',
      'Social Mixers',
      'Music & Performance'
    ]
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  images: [{
    type: String // Cloudinary URLs
  }],
  coverImage: {
    type: String // Main community image
  },
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  guidelines: {
    type: String,
    maxLength: 2000
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  memberLimit: {
    type: Number,
    default: 1000
  },
  tags: [{
    type: String,
    maxLength: 30
  }],
  socialLinks: {
    website: String,
    instagram: String,
    facebook: String,
    twitter: String,
    linkedin: String
  },
  forum: [forumPostSchema],
  testimonials: [testimonialSchema],
  stats: {
    totalEvents: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Middleware to update stats
communitySchema.pre('save', function(next) {
  this.stats.totalMembers = this.members.length;
  
  if (this.testimonials.length > 0) {
    const sum = this.testimonials.reduce((acc, testimonial) => acc + testimonial.rating, 0);
    this.stats.averageRating = sum / this.testimonials.length;
  }
  
  next();
});

// Virtual field for memberCount (for backward compatibility)
communitySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Ensure virtuals are included in JSON output
communitySchema.set('toJSON', { virtuals: true });
communitySchema.set('toObject', { virtuals: true });

// Index for better search performance
communitySchema.index({ name: 'text', description: 'text' });
communitySchema.index({ category: 1 });
communitySchema.index({ 'location.city': 1 });
communitySchema.index({ host: 1 });

module.exports = mongoose.model('Community', communitySchema);