import mongoose from 'mongoose';

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
    enum: [
      'Sip & Savor',
      'Sweat & Play', 
      'Art & DIY',
      'Social Mixers',
      'Adventure & Outdoors',
      'Epic Screenings',
      'Indoor & Board Games',
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
    min: 1
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

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Update current participants count
eventSchema.methods.updateParticipantCount = function() {
  this.currentParticipants = this.participants.filter(p => p.status === 'registered').length;
  return this.save();
};

export default mongoose.model('Event', eventSchema);