const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic Information
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  emoji: {
    type: String,
    required: true
  },
  descriptor: {
    type: String,
    required: true
  },
  subtext: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true,
    default: 'from-gray-500 to-slate-500'
  },

  // Cluster/Group Information
  cluster: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  },

  // SEO & Marketing
  seo: {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String
  },

  // Category Details for Detail Page
  details: {
    whoIsThisFor: {
      type: String,
      default: ''
    },
    whatYouWillFind: {
      type: String,
      default: ''
    },
    popularTags: [String]
  },

  // Analytics & Metrics
  analytics: {
    views: {
      type: Number,
      default: 0,
      index: true
    },
    clicks: {
      type: Number,
      default: 0
    },
    eventCount: {
      type: Number,
      default: 0
    },
    communityCount: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date,
    popularityScore: {
      type: Number,
      default: 0,
      index: true
    }
  },

  // View History for detailed analytics
  viewHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    count: {
      type: Number,
      default: 1
    }
  }],

  // Configuration
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  order: {
    type: Number,
    default: 0
  },

  // Localization support (future)
  translations: {
    type: Map,
    of: {
      name: String,
      descriptor: String,
      subtext: String
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
categorySchema.index({ 'cluster.id': 1 });
categorySchema.index({ isActive: 1, 'analytics.popularityScore': -1 });
categorySchema.index({ isActive: 1, order: 1 });

// Virtual for full cluster object
categorySchema.virtual('clusterInfo').get(function() {
  return {
    id: this.cluster.id,
    name: this.cluster.name,
    color: this.cluster.color
  };
});

// Method to increment view count
categorySchema.methods.incrementView = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Increment total views
  this.analytics.views += 1;
  this.analytics.lastViewedAt = new Date();

  // Update or create today's view history entry
  const todayEntry = this.viewHistory.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  if (todayEntry) {
    todayEntry.count += 1;
  } else {
    this.viewHistory.push({ date: today, count: 1 });
  }

  // Keep only last 90 days of history
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  this.viewHistory = this.viewHistory.filter(entry => entry.date >= ninetyDaysAgo);

  // Update popularity score (weighted: views 40%, events 30%, communities 30%)
  this.analytics.popularityScore = 
    (this.analytics.views * 0.4) + 
    (this.analytics.eventCount * 0.3) + 
    (this.analytics.communityCount * 0.3);

  await this.save();
  return this;
};

// Method to increment click count (when user clicks on an event/community in this category)
categorySchema.methods.incrementClick = async function() {
  this.analytics.clicks += 1;
  await this.save();
  return this;
};

// Method to update event/community counts
categorySchema.methods.updateCounts = async function(eventCount, communityCount) {
  this.analytics.eventCount = eventCount;
  this.analytics.communityCount = communityCount;
  
  // Update popularity score
  this.analytics.popularityScore = 
    (this.analytics.views * 0.4) + 
    (this.analytics.eventCount * 0.3) + 
    (this.analytics.communityCount * 0.3);
    
  await this.save();
  return this;
};

// Static method to get popular categories
categorySchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'analytics.popularityScore': -1 })
    .limit(limit);
};

// Static method to get categories by cluster
categorySchema.statics.getByCluster = function(clusterId) {
  return this.find({ 
    'cluster.id': clusterId, 
    isActive: true 
  }).sort({ order: 1 });
};

// Static method to get trending categories (most views in last 7 days)
categorySchema.statics.getTrending = async function(limit = 5) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const categories = await this.find({ isActive: true });
  
  const trending = categories.map(cat => {
    const recentViews = cat.viewHistory
      .filter(entry => entry.date >= sevenDaysAgo)
      .reduce((sum, entry) => sum + entry.count, 0);
    
    return {
      category: cat,
      recentViews
    };
  })
  .sort((a, b) => b.recentViews - a.recentViews)
  .slice(0, limit)
  .map(item => item.category);

  return trending;
};

// Ensure JSON includes virtuals
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
