const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const Event = require('../models/Event');
const { authMiddleware } = require('../utils/authUtils');

// Get all communities with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, location, search, limit = 12, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    // Apply filters
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const communities = await Community.find(query)
      .populate('host', 'name email profilePicture')
      .populate('members.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Community.countDocuments(query);
    
    res.json({
      communities,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single community by ID
router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('host', 'name email profilePicture bio')
      .populate('members.user', 'name profilePicture')
      .populate('forum.author', 'name profilePicture')
      .populate('forum.replies.author', 'name profilePicture')
      .populate('testimonials.author', 'name profilePicture')
      .populate('testimonials.event', 'title');
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    // Get community events
    const events = await Event.find({ host: community.host._id })
      .sort({ date: -1 })
      .limit(10);
    
    res.json({ community, events });
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new community (requires authentication)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      location,
      guidelines,
      isPrivate,
      memberLimit,
      tags,
      socialLinks,
      images,
      coverImage
    } = req.body;
    
    // Check if user already has a community with this name
    const existingCommunity = await Community.findOne({ 
      name: name.trim(),
      host: req.user.id 
    });
    
    if (existingCommunity) {
      return res.status(400).json({ message: 'You already have a community with this name' });
    }
    
    const community = new Community({
      name: name.trim(),
      description,
      shortDescription,
      category,
      host: req.user.id,
      location,
      guidelines,
      isPrivate: isPrivate || false,
      memberLimit: memberLimit || 1000,
      tags: tags || [],
      socialLinks: socialLinks || {},
      images: images || [],
      coverImage,
      members: [{
        user: req.user.id,
        role: 'admin',
        joinedAt: new Date()
      }]
    });
    
    await community.save();
    
    // Populate the response
    const populatedCommunity = await Community.findById(community._id)
      .populate('host', 'name email profilePicture')
      .populate('members.user', 'name profilePicture');
    
    res.status(201).json({ 
      message: 'Community created successfully',
      community: populatedCommunity 
    });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join community
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    // Check if user is already a member
    const isMember = community.members.some(
      member => member.user.toString() === req.user.id
    );
    
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this community' });
    }
    
    // Check member limit
    if (community.members.length >= community.memberLimit) {
      return res.status(400).json({ message: 'Community has reached member limit' });
    }
    
    // Add user to members
    community.members.push({
      user: req.user.id,
      joinedAt: new Date()
    });
    
    await community.save();
    
    res.json({ message: 'Successfully joined community' });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave community
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    // Don't allow host to leave
    if (community.host.toString() === req.user.id) {
      return res.status(400).json({ message: 'Host cannot leave their own community' });
    }
    
    // Remove user from members
    community.members = community.members.filter(
      member => member.user.toString() !== req.user.id
    );
    
    await community.save();
    
    res.json({ message: 'Successfully left community' });
  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add forum post
router.post('/:id/forum', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }
    
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    // Check if user is a member
    const isMember = community.members.some(
      member => member.user.toString() === req.user.id
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member to post' });
    }
    
    const newPost = {
      author: req.user.id,
      content: content.trim(),
      replies: [],
      likes: []
    };
    
    community.forum.unshift(newPost); // Add to beginning
    await community.save();
    
    // Populate and return the new post
    const updatedCommunity = await Community.findById(req.params.id)
      .populate('forum.author', 'name profilePicture');
    
    const createdPost = updatedCommunity.forum[0];
    
    res.status(201).json({ 
      message: 'Post created successfully',
      post: createdPost 
    });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add testimonial
router.post('/:id/testimonials', authMiddleware, async (req, res) => {
  try {
    const { content, rating, eventId } = req.body;
    
    if (!content || !rating) {
      return res.status(400).json({ message: 'Content and rating are required' });
    }
    
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    // Check if user is a member
    const isMember = community.members.some(
      member => member.user.toString() === req.user.id
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member to leave a testimonial' });
    }
    
    const testimonial = {
      author: req.user.id,
      content: content.trim(),
      rating: parseInt(rating),
      event: eventId || null
    };
    
    community.testimonials.push(testimonial);
    await community.save();
    
    res.status(201).json({ message: 'Testimonial added successfully' });
  } catch (error) {
    console.error('Error adding testimonial:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get communities by host
router.get('/host/:hostId', async (req, res) => {
  try {
    const communities = await Community.find({ 
      host: req.params.hostId,
      isActive: true 
    })
    .populate('host', 'name email profilePicture')
    .sort({ createdAt: -1 });
    
    res.json({ communities });
  } catch (error) {
    console.error('Error fetching host communities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;