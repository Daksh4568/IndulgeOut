const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/auth.js');
const eventRoutes = require('./routes/events.js');
const userRoutes = require('./routes/users.js');
const communityRoutes = require('./routes/communities.js');
const recommendationRoutes = require('./routes/recommendations.js');
const otpRoutes = require('./routes/otp.js');
const exploreRoutes = require('./routes/explore.js');
const paymentRoutes = require('./routes/payments.js');

const app = express();

// Global variable to cache the database connection
let cachedDb = null;
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout';
    console.log('Server.js env' , mongoURI);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings for handling concurrent requests
      maxPoolSize: 50, // Maximum 50 connections in the pool (up from default 10)
      minPoolSize: 10, // Maintain at least 10 connections (up from default 0)
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 10000, // Timeout after 10s if no server available
      heartbeatFrequencyMS: 10000, // Check server health every 10 seconds
    });
    console.log('✅ MongoDB connected successfully with connection pool', mongoURI);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('📝 Note: If you haven\'t set up MongoDB yet, add MONGODB_URI to your .env file');
    console.log('💡 For local development, you can use: mongodb://localhost:27017/indulgeout');
    console.log('🌐 For cloud database, use your MongoDB Atlas connection string');
    // Don't exit the process in development to allow frontend testing
    // process.exit(1);
  }
};

// Connect to database initially
connectDB().catch(console.error);

// CORS Configuration for cross-origin access
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Compression middleware - reduces response size by 60-80%
app.use(compression());

// Body parser with size limits to prevent DoS attacks
app.use(express.json({ limit: '10mb' })); // Limit JSON payloads to 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware - prevent hanging requests
app.use((req, res, next) => {
  // Set timeout to 30 seconds for all requests
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    // Ensure database connection before each request
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({ 
      message: 'Database temporarily unavailable. Please try again.', 
      error: 'SERVICE_UNAVAILABLE' 
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/payments', paymentRoutes);

console.log('✅ All routes registered:', [
  '/api/auth',
  '/api/events', 
  '/api/users',
  '/api/communities',
  '/api/recommendations',
  '/api/explore',
  '/api/payments'
]);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'IndulgeOut API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'IndulgeOut Backend API',
    status: 'running',
    endpoints: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/events',
      '/api/users'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  const status = error.statusCode || 500;
  const message = error.message || 'Something went wrong!';
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;