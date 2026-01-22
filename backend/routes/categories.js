const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Event = require('../models/Event');
const Community = require('../models/Community');
const { authMiddleware } = require('../utils/authUtils');

// @route   GET /api/categories
// @desc    Get all categories (grouped by cluster)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });

    // Group categories by cluster
    const grouped = categories.reduce((acc, category) => {
      const clusterId = category.cluster.id;
      if (!acc[clusterId]) {
        acc[clusterId] = {
          id: clusterId,
          name: category.cluster.name,
          color: category.cluster.color,
          categories: []
        };
      }
      acc[clusterId].categories.push({
        id: category.id,
        slug: category.slug,
        name: category.name,
        emoji: category.emoji,
        descriptor: category.descriptor,
        subtext: category.subtext,
        color: category.color,
        analytics: {
          eventCount: category.analytics.eventCount,
          communityCount: category.analytics.communityCount,
          popularityScore: category.analytics.popularityScore
        }
      });
      return acc;
    }, {});

    // Convert to array
    const clusters = Object.values(grouped);

    res.json({
      success: true,
      count: categories.length,
      clusters,
      allCategories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        descriptor: cat.descriptor,
        subtext: cat.subtext,
        color: cat.color,
        cluster: cat.cluster,
        analytics: {
          eventCount: cat.analytics.eventCount,
          communityCount: cat.analytics.communityCount
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// @route   GET /api/categories/flat
// @desc    Get all categories as flat array (not grouped)
// @access  Public
router.get('/flat', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        descriptor: cat.descriptor,
        subtext: cat.subtext,
        color: cat.color,
        cluster: cat.cluster
      }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// @route   GET /api/categories/popular
// @desc    Get popular categories by popularity score
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const categories = await Category.getPopular(limit);

    res.json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        descriptor: cat.descriptor,
        analytics: {
          views: cat.analytics.views,
          eventCount: cat.analytics.eventCount,
          communityCount: cat.analytics.communityCount,
          popularityScore: cat.analytics.popularityScore
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching popular categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular categories',
      error: error.message
    });
  }
});

// @route   GET /api/categories/trending
// @desc    Get trending categories (most views in last 7 days)
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const categories = await Category.getTrending(limit);

    res.json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        descriptor: cat.descriptor,
        analytics: {
          views: cat.analytics.views
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching trending categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending categories',
      error: error.message
    });
  }
});

// @route   GET /api/categories/:slug
// @desc    Get single category by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Track view (don't await to avoid blocking response)
    category.incrementView().catch(err => {
      console.error('Error tracking category view:', err);
    });

    res.json({
      success: true,
      category: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        emoji: category.emoji,
        descriptor: category.descriptor,
        subtext: category.subtext,
        color: category.color,
        cluster: category.cluster,
        details: category.details,
        seo: category.seo,
        analytics: {
          eventCount: category.analytics.eventCount,
          communityCount: category.analytics.communityCount,
          views: category.analytics.views
        }
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
});

// @route   GET /api/categories/:slug/analytics
// @desc    Get detailed analytics for a category
// @access  Public (or could be Admin only)
router.get('/:slug/analytics', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get view history for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentViewHistory = category.viewHistory.filter(
      entry => entry.date >= thirtyDaysAgo
    );

    res.json({
      success: true,
      analytics: {
        name: category.name,
        slug: category.slug,
        totalViews: category.analytics.views,
        totalClicks: category.analytics.clicks,
        eventCount: category.analytics.eventCount,
        communityCount: category.analytics.communityCount,
        popularityScore: category.analytics.popularityScore,
        lastViewedAt: category.analytics.lastViewedAt,
        viewHistory: recentViewHistory,
        clickThroughRate: category.analytics.views > 0 
          ? ((category.analytics.clicks / category.analytics.views) * 100).toFixed(2) + '%'
          : '0%'
      }
    });
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// @route   POST /api/categories/:slug/track-click
// @desc    Track when a user clicks on an event/community in this category
// @access  Public
router.post('/:slug/track-click', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await category.incrementClick();

    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error.message
    });
  }
});

// @route   POST /api/categories/refresh-counts
// @desc    Refresh event and community counts for all categories
// @access  Public (could be Admin or Cron job)
router.post('/refresh-counts', async (req, res) => {
  try {
    const categories = await Category.find({});
    let updated = 0;

    for (const category of categories) {
      // Count events in this category
      const eventCount = await Event.countDocuments({
        categories: category.slug,
        status: 'published'
      });

      // Count communities in this category
      const communityCount = await Community.countDocuments({
        category: category.slug,
        isPrivate: false
      });

      // Update counts
      await category.updateCounts(eventCount, communityCount);
      updated++;
    }

    res.json({
      success: true,
      message: `Refreshed counts for ${updated} categories`
    });
  } catch (error) {
    console.error('Error refreshing counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh counts',
      error: error.message
    });
  }
});

// @route   PATCH /api/categories/:slug
// @desc    Update category (admin only)
// @access  Private
router.patch('/:slug', authMiddleware, async (req, res) => {
  try {
    const { name, descriptor, subtext, seo, details, isActive, order } = req.body;

    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Update allowed fields
    if (name) category.name = name;
    if (descriptor) category.descriptor = descriptor;
    if (subtext) category.subtext = subtext;
    if (seo) category.seo = { ...category.seo, ...seo };
    if (details) category.details = { ...category.details, ...details };
    if (typeof isActive !== 'undefined') category.isActive = isActive;
    if (typeof order !== 'undefined') category.order = order;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// @route   GET /api/categories/cluster/:clusterId
// @desc    Get all categories in a specific cluster
// @access  Public
router.get('/cluster/:clusterId', async (req, res) => {
  try {
    const categories = await Category.getByCluster(req.params.clusterId);

    res.json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        descriptor: cat.descriptor,
        subtext: cat.subtext,
        color: cat.color
      }))
    });
  } catch (error) {
    console.error('Error fetching cluster categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cluster categories',
      error: error.message
    });
  }
});

module.exports = router;
