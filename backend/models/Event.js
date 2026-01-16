const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  categories: [{
    type: String,
    enum:[
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
    ],
    required: true
  }],
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coHosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
    max: 10000 // Support up to 10,000 participants for large events
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    }
  }],
  price: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  images: [String],
  tags: [String],
  requirements: [String],
  mood: {
    type: String,
    enum: ['chill', 'energetic', 'creative', 'social', 'adventure'],
    default: 'social'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  community: {
    type: String,
    required: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  registrationDeadline: Date,
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    registrations: {
      type: Number,
      default: 0
    },
    clickHistory: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      source: {
        type: String,
        default: 'event_discovery'
      }
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ date: 1, categories: 1, 'location.city': 1 });
eventSchema.index({ host: 1, createdBy: 1 });
// Critical index for registration queries - speeds up participant lookups
eventSchema.index({ 'participants.user': 1 });
// Index for checking event availability
eventSchema.index({ status: 1, date: 1 });

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for ticketPrice (alias for price.amount for easier access)
eventSchema.virtual('ticketPrice').get(function() {
  return this.price?.amount || 0;
});

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Update current participants count
eventSchema.methods.updateParticipantCount = function() {
  this.currentParticipants = this.participants.filter(p => p.status === 'registered').length;
  return this.save();
};

module.exports = mongoose.model('Event', eventSchema);